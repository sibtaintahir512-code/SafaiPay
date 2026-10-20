import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.user import User
from app.models.batch import MaterialBatch
from app.models.dispatch import DispatchRecord
from app.schemas.batch import BatchCreate, BatchResponse, BatchProcureRequest
from app.api.deps import get_current_user, require_roles
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/batches", tags=["Recycler Marketplace & Material Batches"])

@router.get("", response_model=List[BatchResponse])
async def list_material_batches(
    material_code: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """List recyclable wholesale material batches with optional material and status filter."""
    query = select(MaterialBatch).order_by(MaterialBatch.created_at.desc()).offset(skip).limit(limit)
    if material_code:
        query = query.where(MaterialBatch.material_code == material_code)
    if status_filter:
        query = query.where(MaterialBatch.status == status_filter)

    result = await db.execute(query)
    return result.scalars().all()

@router.get("/my-procurements", response_model=List[BatchResponse])
async def list_my_procurement_orders(
    current_user: User = Depends(require_roles(["RECYCLER", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """Recycler: List material lots procured by the authenticated recycler."""
    query = select(MaterialBatch).where(
        MaterialBatch.procured_by_user_id == current_user.id
    ).order_by(MaterialBatch.procured_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{id}", response_model=BatchResponse)
async def get_batch_by_id(
    id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get single batch specifications by UUID."""
    query = select(MaterialBatch).where(MaterialBatch.id == id)
    result = await db.execute(query)
    batch = result.scalar_one_or_none()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Material batch with ID '{id}' not found."
        )
    return batch

@router.post("", response_model=BatchResponse, status_code=status.HTTP_201_CREATED)
async def create_material_batch(
    payload: BatchCreate,
    request: Request,
    current_user: User = Depends(require_roles(["ADMIN", "COLLECTOR"])),
    db: AsyncSession = Depends(get_db)
):
    """Admin / Collector: Aggregate baled or sorted materials into a wholesale lot."""
    batch_num = f"BATCH-{payload.material_code[:3]}-{datetime.now(timezone.utc).strftime('%Y%m')}-{uuid.uuid4().hex[:4].upper()}"

    batch = MaterialBatch(
        id=uuid.uuid4(),
        batch_code=batch_num,
        material_code=payload.material_code,
        net_weight_kg=payload.net_weight_kg,
        purity_percentage=payload.purity_percentage,
        status="AVAILABLE",
        hub_location=payload.hub_location
    )
    db.add(batch)
    await db.commit()
    await db.refresh(batch)

    client_ip = request.client.host if request.client else None
    await log_audit_event(
        db=db,
        action_name="BATCH_CREATED",
        entity_name="material_batches",
        actor_id=str(current_user.id),
        entity_id=str(batch.id),
        details=f"Created {batch_num} for {payload.net_weight_kg}kg {payload.material_code}",
        ip_address=client_ip
    )

    return batch

@router.post("/{id}/procure", response_model=BatchResponse)
async def procure_material_batch(
    id: str,
    payload: BatchProcureRequest,
    request: Request,
    current_user: User = Depends(require_roles(["RECYCLER", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """Recycler / Admin: Issue formal purchase order for an available batch."""
    query = select(MaterialBatch).where(MaterialBatch.id == id)
    batch = (await db.execute(query)).scalar_one_or_none()

    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material batch not found."
        )

    if batch.status != "AVAILABLE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Batch {batch.batch_code} is already in '{batch.status}' status and cannot be procured."
        )

    batch.status = "PROCURED"
    batch.procured_by_user_id = current_user.id
    batch.procured_at = datetime.now(timezone.utc)

    # Automatically generate dispatch transport manifest
    dispatch_tracking = f"DISPATCH-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:5].upper()}"
    dispatch = DispatchRecord(
        id=uuid.uuid4(),
        tracking_number=dispatch_tracking,
        batch_id=batch.id,
        carrier_name="Indus Eco-Logistics",
        vehicle_plate="KHI-TK-8821",
        gross_weight_kg=float(batch.net_weight_kg) + 4500.0,
        tare_weight_kg=4500.0,
        net_weight_kg=float(batch.net_weight_kg),
        status="SCHEDULED"
    )
    db.add(dispatch)

    await db.commit()
    await db.refresh(batch)

    client_ip = request.client.host if request.client else None
    await log_audit_event(
        db=db,
        action_name="BATCH_PROCURED",
        entity_name="material_batches",
        actor_id=str(current_user.id),
        entity_id=str(batch.id),
        details=f"Recycler '{current_user.full_name}' placed order for batch {batch.batch_code}",
        ip_address=client_ip
    )

    return batch
