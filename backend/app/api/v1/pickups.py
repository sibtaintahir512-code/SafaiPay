import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.core.database import get_db
from app.models.user import User, RoleEnum
from app.models.pickup import (
    PickupRequest,
    PickupAssignment,
    WasteImage,
    PickupVerification,
    WeightRecord,
    Rating,
    Dispute,
    PickupStatus,
    ImageType,
)
from app.models.payment import PricingCalculation, Payment, PaymentStatus
from app.schemas.pickup import (
    PickupCreateRequest,
    PickupDetailResponse,
    PickupAssignRequest,
    PickupRejectRequest,
    PickupStartRequest,
    WeightVerificationRequest,
    CustomerConfirmRequest,
    PickupCancelRequest,
    WasteImageUploadRequest,
    RatingCreateRequest,
    DisputeCreateRequest,
    AIClassificationRequest,
    AIClassificationResponse,
)
from app.schemas.payment import PaymentResponse, DisputeResponse
from app.api.deps import get_current_user, require_roles
from app.services.state_machine import validate_and_apply_transition
from app.services.pricing_service import calculate_pickup_pricing
from app.services.payment_service import MockPaymentService
from app.services.notification_service import create_notification
from app.services.audit_service import log_audit_event
from app.services.ai_service import AIService

router = APIRouter(prefix="/pickups", tags=["Pickup Operations & Workflow"])

@router.post("/ai-classify", response_model=AIClassificationResponse)
async def classify_material_stream(
    payload: AIClassificationRequest,
    current_user: User = Depends(get_current_user)
):
    """Customer / Collector: AI Computer Vision classification with confidence score and advisory pricing."""
    result = AIService.classify_waste_image(
        image_url=payload.image_url,
        hint=payload.stream_hint
    )
    return AIClassificationResponse(**result)


@router.post("", response_model=PickupDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_pickup(
    payload: PickupCreateRequest,
    request: Request,
    current_user: User = Depends(require_roles(["CUSTOMER", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """Customer: Create a new recyclable waste pickup request."""
    tracking_no = f"SP-{datetime.now(timezone.utc).strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"

    pickup = PickupRequest(
        id=uuid.uuid4(),
        tracking_number=tracking_no,
        customer_id=current_user.id,
        material_code=payload.material_code,
        estimated_quantity_kg=payload.estimated_quantity_kg,
        street_address=payload.street_address,
        city=payload.city,
        latitude=payload.latitude,
        longitude=payload.longitude,
        preferred_time=payload.preferred_time,
        notes=payload.notes,
        status=PickupStatus.REQUESTED.value
    )
    db.add(pickup)
    await db.flush()

    # If an initial waste photo was attached
    if payload.photo_url:
        img = WasteImage(
            id=uuid.uuid4(),
            pickup_id=pickup.id,
            uploaded_by_user_id=current_user.id,
            image_type=ImageType.CUSTOMER_UPLOAD.value,
            image_url=payload.photo_url,
            caption="Customer initial waste preview"
        )
        db.add(img)

    # Initial estimated pricing calculation
    await calculate_pickup_pricing(
        db=db,
        pickup_id=pickup.id,
        material_code=payload.material_code,
        verified_weight_kg=payload.estimated_quantity_kg,
        quality_factor=1.00,
        is_estimated=True
    )

    await db.commit()
    await db.refresh(pickup)

    # Log audit event
    client_ip = request.client.host if request.client else None
    await log_audit_event(
        db=db,
        action_name="PICKUP_CREATED",
        entity_name="pickup_requests",
        actor_id=str(current_user.id),
        entity_id=str(pickup.id),
        details=f"Customer created pickup {tracking_no} for {payload.estimated_quantity_kg}kg {payload.material_code}",
        ip_address=client_ip
    )

    return pickup

@router.get("/my-requests", response_model=List[PickupDetailResponse])
async def list_customer_requests(
    current_user: User = Depends(require_roles(["CUSTOMER"])),
    db: AsyncSession = Depends(get_db)
):
    """Customer: List all pickup requests created by the authenticated customer."""
    query = select(PickupRequest).where(
        PickupRequest.customer_id == current_user.id
    ).order_by(PickupRequest.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/available", response_model=List[PickupDetailResponse])
async def list_available_jobs_for_collector(
    current_user: User = Depends(require_roles(["COLLECTOR", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """Collector: View available nearby jobs (status REQUESTED or ASSIGNED to self)."""
    query = select(PickupRequest).where(
        or_(
            PickupRequest.status == PickupStatus.REQUESTED.value,
            (PickupRequest.status == PickupStatus.ASSIGNED.value) & (PickupRequest.assigned_collector_id == current_user.id)
        )
    ).order_by(PickupRequest.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{id}", response_model=PickupDetailResponse)
async def get_pickup_details(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get pickup details. Accessible by owner customer, assigned collector, or Admin."""
    query = select(PickupRequest).where(PickupRequest.id == id)
    result = await db.execute(query)
    pickup = result.scalar_one_or_none()

    if not pickup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pickup with ID '{id}' not found."
        )

    # Permission check: customer, assigned collector, or admin
    is_owner = str(pickup.customer_id) == str(current_user.id)
    is_assigned = str(pickup.assigned_collector_id) == str(current_user.id)
    is_admin = "ADMIN" in current_user.role_names
    is_open = pickup.status == PickupStatus.REQUESTED.value and "COLLECTOR" in current_user.role_names

    if not (is_owner or is_assigned or is_admin or is_open):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to view this pickup."
        )

    return pickup

@router.post("/{id}/assign", response_model=PickupDetailResponse)
async def assign_collector(
    id: str,
    payload: PickupAssignRequest,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """Admin: Assign or reassign a collector to a pickup request."""
    query = select(PickupRequest).where(PickupRequest.id == id)
    pickup = (await db.execute(query)).scalar_one_or_none()

    if not pickup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pickup not found.")

    # Validate target collector exists
    query_coll = select(User).where(User.id == payload.collector_id)
    coll = (await db.execute(query_coll)).scalar_one_or_none()
    if not coll or "COLLECTOR" not in coll.role_names:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Target user is not a verified collector.")

    validate_and_apply_transition(pickup, PickupStatus.ASSIGNED)
    pickup.assigned_collector_id = coll.id

    assignment = PickupAssignment(
        id=uuid.uuid4(),
        pickup_id=pickup.id,
        collector_id=coll.id,
        assigned_by=current_user.id,
        status="PENDING",
        rejection_reason=None
    )
    db.add(assignment)
    await db.commit()
    await db.refresh(pickup)

    # Notify collector
    await create_notification(
        db=db,
        user_id=coll.id,
        title="New Pickup Assigned",
        message=f"Pickup {pickup.tracking_number} has been assigned to you at {pickup.street_address}.",
        related_entity_id=str(pickup.id)
    )

    return pickup

@router.post("/{id}/accept", response_model=PickupDetailResponse)
async def accept_job(
    id: str,
    current_user: User = Depends(require_roles(["COLLECTOR"])),
    db: AsyncSession = Depends(get_db)
):
    """Collector: Accept an assigned or requested pickup job."""
    query = select(PickupRequest).where(PickupRequest.id == id)
    pickup = (await db.execute(query)).scalar_one_or_none()
    if not pickup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pickup not found.")

    # If pickup was in REQUESTED state, assign directly to this collector first
    if pickup.status == PickupStatus.REQUESTED.value:
        pickup.assigned_collector_id = current_user.id
        validate_and_apply_transition(pickup, PickupStatus.ASSIGNED)

    # Check collector assignment
    if str(pickup.assigned_collector_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not assigned to this job."
        )

    validate_and_apply_transition(pickup, PickupStatus.ACCEPTED)

    # Update assignment record status
    q_assign = select(PickupAssignment).where(
        PickupAssignment.pickup_id == pickup.id,
        PickupAssignment.collector_id == current_user.id
    ).order_by(PickupAssignment.created_at.desc())
    assign = (await db.execute(q_assign)).scalar_one_or_none()
    if assign:
        assign.status = "ACCEPTED"

    await db.commit()
    await db.refresh(pickup)

    # Notify customer
    await create_notification(
        db=db,
        user_id=pickup.customer_id,
        title="Collector Accepted Pickup",
        message=f"Collector '{current_user.full_name}' accepted your pickup {pickup.tracking_number}.",
        related_entity_id=str(pickup.id)
    )

    return pickup

@router.post("/{id}/reject", response_model=PickupDetailResponse)
async def reject_job(
    id: str,
    payload: PickupRejectRequest,
    current_user: User = Depends(require_roles(["COLLECTOR"])),
    db: AsyncSession = Depends(get_db)
):
    """Collector: Reject an assigned pickup job."""
    query = select(PickupRequest).where(PickupRequest.id == id)
    pickup = (await db.execute(query)).scalar_one_or_none()
    if not pickup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pickup not found.")

    if str(pickup.assigned_collector_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not assigned to this job.")

    validate_and_apply_transition(pickup, PickupStatus.REJECTED)

    # Update assignment
    q_assign = select(PickupAssignment).where(
        PickupAssignment.pickup_id == pickup.id,
        PickupAssignment.collector_id == current_user.id
    ).order_by(PickupAssignment.created_at.desc())
    assign = (await db.execute(q_assign)).scalar_one_or_none()
    if assign:
        assign.status = "REJECTED"
        assign.rejection_reason = payload.reason

    await db.commit()
    await db.refresh(pickup)
    return pickup

@router.post("/{id}/start", response_model=PickupDetailResponse)
async def start_pickup(
    id: str,
    payload: PickupStartRequest,
    current_user: User = Depends(require_roles(["COLLECTOR"])),
    db: AsyncSession = Depends(get_db)
):
    """Collector: Start pickup journey / mark in-progress with GPS coordinates."""
    query = select(PickupRequest).where(PickupRequest.id == id)
    pickup = (await db.execute(query)).scalar_one_or_none()
    if not pickup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pickup not found.")

    if str(pickup.assigned_collector_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not the assigned collector.")

    validate_and_apply_transition(pickup, PickupStatus.IN_PROGRESS)

    verification = PickupVerification(
        id=uuid.uuid4(),
        pickup_id=pickup.id,
        collector_id=current_user.id,
        gps_latitude=payload.gps_latitude,
        gps_longitude=payload.gps_longitude,
        notes=payload.notes
    )
    db.add(verification)
    await db.commit()
    await db.refresh(pickup)

    return pickup

@router.post("/{id}/upload-photo", response_model=PickupDetailResponse)
async def upload_pickup_photo(
    id: str,
    payload: WasteImageUploadRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload before, after, or scale display photo evidence."""
    query = select(PickupRequest).where(PickupRequest.id == id)
    pickup = (await db.execute(query)).scalar_one_or_none()
    if not pickup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pickup not found.")

    img = WasteImage(
        id=uuid.uuid4(),
        pickup_id=pickup.id,
        uploaded_by_user_id=current_user.id,
        image_type=payload.image_type,
        image_url=payload.image_url,
        caption=payload.caption
    )
    db.add(img)
    await db.commit()
    await db.refresh(pickup)
    return pickup

@router.post("/{id}/verify-weight", response_model=PickupDetailResponse)
async def verify_pickup_weight(
    id: str,
    payload: WeightVerificationRequest,
    current_user: User = Depends(require_roles(["COLLECTOR", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """Collector / Admin: Record verified physical weight and quality factor.
    Security Rule: Customer CANNOT change collector-verified weight.
    """
    query = select(PickupRequest).where(PickupRequest.id == id)
    pickup = (await db.execute(query)).scalar_one_or_none()
    if not pickup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pickup not found.")

    # If collector, must be the assigned collector
    if "ADMIN" not in current_user.role_names and str(pickup.assigned_collector_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the assigned collector or admin can verify weight.")

    # Validate weight and quality factor
    if payload.verified_weight_kg <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verified weight must be greater than zero.")
    if payload.quality_factor < 0.0 or payload.quality_factor > 1.0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quality factor must be between 0.0 and 1.0.")

    # State transition
    validate_and_apply_transition(pickup, PickupStatus.WEIGHT_VERIFIED)

    # Save weight record
    weight_rec = WeightRecord(
        id=uuid.uuid4(),
        pickup_id=pickup.id,
        recorded_by_user_id=current_user.id,
        material_code=pickup.material_code,
        verified_weight_kg=payload.verified_weight_kg,
        scale_display_verified=True,
        notes=payload.notes
    )
    db.add(weight_rec)

    # Save scale photo if provided
    if payload.scale_photo_url:
        scale_img = WasteImage(
            id=uuid.uuid4(),
            pickup_id=pickup.id,
            uploaded_by_user_id=current_user.id,
            image_type=ImageType.SCALE_DISPLAY.value,
            image_url=payload.scale_photo_url,
            caption="Scale LCD display verification"
        )
        db.add(scale_img)

    # Calculate verified deterministic price
    await calculate_pickup_pricing(
        db=db,
        pickup_id=pickup.id,
        material_code=pickup.material_code,
        verified_weight_kg=payload.verified_weight_kg,
        quality_factor=payload.quality_factor,
        is_estimated=False
    )

    await db.commit()
    await db.refresh(pickup)

    # Notify customer that weight and price are ready for confirmation
    await create_notification(
        db=db,
        user_id=pickup.customer_id,
        title="Weight Verified - Confirm Pickup",
        message=f"Verified weight: {payload.verified_weight_kg}kg. Please review the price and confirm completion.",
        related_entity_id=str(pickup.id)
    )

    return pickup

@router.post("/{id}/confirm-completion", response_model=PickupDetailResponse)
async def confirm_completion_by_customer(
    id: str,
    payload: CustomerConfirmRequest,
    current_user: User = Depends(require_roles(["CUSTOMER", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """Customer: Confirm verified weight and price breakdown, advancing to customer_confirmed and triggering mock payment intent."""
    query = select(PickupRequest).where(PickupRequest.id == id)
    pickup = (await db.execute(query)).scalar_one_or_none()
    if not pickup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pickup not found.")

    if "ADMIN" not in current_user.role_names and str(pickup.customer_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the booking customer or admin can confirm completion.")

    validate_and_apply_transition(pickup, PickupStatus.CUSTOMER_CONFIRMED)

    # Get latest pricing calculation
    q_calc = select(PricingCalculation).where(
        PricingCalculation.pickup_id == pickup.id,
        PricingCalculation.is_estimated == False
    ).order_by(PricingCalculation.created_at.desc())
    calc = (await db.execute(q_calc)).scalar_one_or_none()

    total_amount = float(calc.total_price) if calc else 0.0

    # Create mock payment intent
    if pickup.assigned_collector_id:
        await MockPaymentService.create_payment_intent(
            db=db,
            pickup=pickup,
            amount_pkr=total_amount,
            payer_id=pickup.customer_id,
            payee_id=pickup.assigned_collector_id
        )

    await db.commit()
    await db.refresh(pickup)
    return pickup

@router.post("/{id}/cancel", response_model=PickupDetailResponse)
async def cancel_pickup(
    id: str,
    payload: PickupCancelRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Customer or Admin: Cancel a pickup request."""
    query = select(PickupRequest).where(PickupRequest.id == id)
    pickup = (await db.execute(query)).scalar_one_or_none()
    if not pickup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pickup not found.")

    is_customer = str(pickup.customer_id) == str(current_user.id)
    is_admin = "ADMIN" in current_user.role_names

    if not (is_customer or is_admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the booking customer or admin can cancel this request.")

    validate_and_apply_transition(pickup, PickupStatus.CANCELLED)
    pickup.cancellation_reason = payload.reason
    await db.commit()
    await db.refresh(pickup)
    return pickup

@router.post("/{id}/rate", status_code=status.HTTP_201_CREATED)
async def rate_collector(
    id: str,
    payload: RatingCreateRequest,
    current_user: User = Depends(require_roles(["CUSTOMER"])),
    db: AsyncSession = Depends(get_db)
):
    """Customer: Rate collector after completion."""
    query = select(PickupRequest).where(PickupRequest.id == id)
    pickup = (await db.execute(query)).scalar_one_or_none()
    if not pickup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pickup not found.")

    if str(pickup.customer_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the customer can rate this pickup.")

    if not pickup.assigned_collector_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No collector assigned to rate.")

    rating = Rating(
        id=uuid.uuid4(),
        pickup_id=pickup.id,
        rater_id=current_user.id,
        rated_user_id=pickup.assigned_collector_id,
        score=payload.score,
        review_text=payload.review_text
    )
    db.add(rating)
    await db.commit()
    return {"message": "Rating submitted successfully.", "score": payload.score}

@router.post("/{id}/dispute", response_model=DisputeResponse, status_code=status.HTTP_201_CREATED)
async def raise_dispute(
    id: str,
    payload: DisputeCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Raise a dispute ticket regarding verified weight, quality deduction, or no-show."""
    query = select(PickupRequest).where(PickupRequest.id == id)
    pickup = (await db.execute(query)).scalar_one_or_none()
    if not pickup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pickup not found.")

    # Validate transition to disputed
    validate_and_apply_transition(pickup, PickupStatus.DISPUTED)

    dispute = Dispute(
        id=uuid.uuid4(),
        pickup_id=pickup.id,
        raised_by_user_id=current_user.id,
        reason_category=payload.reason_category,
        description=payload.description,
        status="OPEN"
    )
    db.add(dispute)
    await db.commit()
    await db.refresh(dispute)
    return dispute
