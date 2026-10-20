from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.user import User, Role, UserRole, RoleEnum
from app.models.audit import AuditLog
from app.models.pickup import PickupRequest, Dispute, WeightRecord, PickupStatus
from app.models.payment import Payment, PricingCalculation
from app.schemas.user import UserWithProfileResponse, RoleAssignRequest
from app.schemas.audit import AuditLogResponse
from app.schemas.pickup import PickupDetailResponse, DisputeResolveRequest
from app.schemas.payment import DisputeResponse, PaymentResponse
from app.api.deps import require_roles
from app.services.audit_service import log_audit_event
from app.services.state_machine import validate_and_apply_transition

router = APIRouter(
    prefix="/admin",
    tags=["Admin Operations & System Governance"],
    dependencies=[Depends(require_roles(["ADMIN"]))]
)

@router.get("/users", response_model=List[UserWithProfileResponse])
async def list_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    role: Optional[RoleEnum] = None,
    db: AsyncSession = Depends(get_db)
):
    """Admin-only: List registered users with optional role filtering."""
    query = select(User).offset(skip).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()

    if role:
        filtered = [u for u in users if role.value in u.role_names]
        return filtered

    return users

@router.post("/users/{user_id}/roles", response_model=UserWithProfileResponse)
async def assign_user_role(
    user_id: str,
    payload: RoleAssignRequest,
    request: Request,
    current_admin: User = Depends(require_roles(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """Admin-only: Assign an additional role to a user. Logs audit trail."""
    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' does not exist."
        )

    role_str = payload.role.value
    if role_str in user.role_names:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User already has role '{role_str}'."
        )

    # Ensure role exists in roles table
    query_role = select(Role).where(Role.name == role_str)
    role_res = await db.execute(query_role)
    if not role_res.scalar_one_or_none():
        db.add(Role(name=role_str, description=f"{role_str} role"))
        await db.flush()

    new_user_role = UserRole(user_id=user.id, role_name=role_str)
    db.add(new_user_role)
    await db.commit()
    await db.refresh(user)

    client_ip = request.client.host if request.client else None
    await log_audit_event(
        db=db,
        action_name="ROLE_ASSIGNED",
        entity_name="users",
        actor_id=str(current_admin.id),
        entity_id=str(user.id),
        details=f"Admin '{current_admin.full_name}' assigned role '{role_str}' to user '{user.full_name}'",
        ip_address=client_ip
    )

    return user

@router.get("/pickups", response_model=List[PickupDetailResponse])
async def list_all_pickups(
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Admin-only: View all pickup requests with optional status filtering."""
    query = select(PickupRequest).order_by(PickupRequest.created_at.desc()).offset(skip).limit(limit)
    if status_filter:
        query = query.where(PickupRequest.status == status_filter)

    result = await db.execute(query)
    return result.scalars().all()

@router.get("/suspicious-records")
async def review_suspicious_records(
    db: AsyncSession = Depends(get_db)
):
    """Admin-only: Review suspicious records (weight variance > 50% or low quality factor)."""
    query = select(PickupRequest).where(
        PickupRequest.status.in_([PickupStatus.WEIGHT_VERIFIED.value, PickupStatus.CUSTOMER_CONFIRMED.value, PickupStatus.DISPUTED.value])
    )
    result = await db.execute(query)
    pickups = result.scalars().all()

    suspicious = []
    for p in pickups:
        calc_q = select(PricingCalculation).where(PricingCalculation.pickup_id == p.id, PricingCalculation.is_estimated == False)
        calc = (await db.execute(calc_q)).scalar_one_or_none()
        if calc:
            variance = abs(calc.verified_weight_kg - p.estimated_quantity_kg) / p.estimated_quantity_kg
            if variance > 0.50 or calc.quality_factor < 0.80:
                suspicious.append({
                    "pickup_id": str(p.id),
                    "tracking_number": p.tracking_number,
                    "estimated_kg": p.estimated_quantity_kg,
                    "verified_kg": calc.verified_weight_kg,
                    "variance_percentage": round(variance * 100, 1),
                    "quality_factor": calc.quality_factor,
                    "status": p.status,
                    "flag": "High weight variance" if variance > 0.50 else "Severe quality degradation"
                })

    return {"count": len(suspicious), "records": suspicious}

@router.get("/disputes", response_model=List[DisputeResponse])
async def list_disputes(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db)
):
    """Admin-only: Review all dispute tickets."""
    query = select(Dispute).order_by(Dispute.created_at.desc())
    if status_filter:
        query = query.where(Dispute.status == status_filter)

    result = await db.execute(query)
    return result.scalars().all()

@router.patch("/disputes/{id}/resolve", response_model=DisputeResponse)
async def resolve_dispute(
    id: str,
    payload: DisputeResolveRequest,
    current_admin: User = Depends(require_roles(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """Admin-only: Mediate and resolve an open dispute ticket."""
    query = select(Dispute).where(Dispute.id == id)
    dispute = (await db.execute(query)).scalar_one_or_none()
    if not dispute:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dispute ticket not found.")

    dispute.status = payload.status
    dispute.resolution_notes = payload.resolution_notes
    dispute.resolved_by_admin_id = current_admin.id
    dispute.resolved_at = datetime.now(timezone.utc)

    # Transition pickup state back to customer_confirmed if resolved favorably
    q_pickup = select(PickupRequest).where(PickupRequest.id == dispute.pickup_id)
    pickup = (await db.execute(q_pickup)).scalar_one_or_none()
    if pickup and pickup.status == PickupStatus.DISPUTED.value:
        validate_and_apply_transition(pickup, PickupStatus.CUSTOMER_CONFIRMED)

    await db.commit()
    await db.refresh(dispute)
    return dispute

@router.get("/payments", response_model=List[PaymentResponse])
async def list_all_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db)
):
    """Admin-only: View payment records."""
    query = select(Payment).order_by(Payment.created_at.desc()).offset(skip).limit(limit)
    if status_filter:
        query = query.where(Payment.status == status_filter)

    result = await db.execute(query)
    return result.scalars().all()

@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def list_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    action: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Admin-only: View immutable system security and activity audit logs."""
    query = select(AuditLog).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)
    if action:
        query = query.where(AuditLog.action_name == action)

    result = await db.execute(query)
    return result.scalars().all()

@router.post("/collectors/{collector_id}/approve")
async def approve_collector_kyc(
    collector_id: str,
    request: Request,
    current_admin: User = Depends(require_roles(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """Admin-only: Verify and approve a collector's CNIC and digital scale KYC."""
    from app.models.profiles import CollectorProfile
    query = select(CollectorProfile).where(CollectorProfile.user_id == collector_id)
    profile = (await db.execute(query)).scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collector profile not found.")

    profile.kyc_status = "VERIFIED"
    await db.commit()

    client_ip = request.client.host if request.client else None
    await log_audit_event(
        db=db,
        action_name="COLLECTOR_KYC_APPROVED",
        entity_name="collector_profiles",
        actor_id=str(current_admin.id),
        entity_id=collector_id,
        details=f"Admin '{current_admin.full_name}' approved KYC for collector {collector_id}",
        ip_address=client_ip
    )
    return {"status": "success", "collector_id": collector_id, "kyc_status": "VERIFIED"}

@router.post("/collectors/{collector_id}/reject")
async def reject_collector_kyc(
    collector_id: str,
    request: Request,
    reason: str = Query("Incomplete biometric documentation"),
    current_admin: User = Depends(require_roles(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """Admin-only: Reject a collector's KYC application."""
    from app.models.profiles import CollectorProfile
    query = select(CollectorProfile).where(CollectorProfile.user_id == collector_id)
    profile = (await db.execute(query)).scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collector profile not found.")

    profile.kyc_status = "REJECTED"
    await db.commit()

    client_ip = request.client.host if request.client else None
    await log_audit_event(
        db=db,
        action_name="COLLECTOR_KYC_REJECTED",
        entity_name="collector_profiles",
        actor_id=str(current_admin.id),
        entity_id=collector_id,
        details=f"Admin '{current_admin.full_name}' rejected KYC for collector {collector_id}: {reason}",
        ip_address=client_ip
    )
    return {"status": "success", "collector_id": collector_id, "kyc_status": "REJECTED", "reason": reason}

