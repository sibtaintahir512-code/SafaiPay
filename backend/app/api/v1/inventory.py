"""Warehouse Aggregation & Recyclable Supply Inventory Management."""
import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.marketplace import InventoryItem
from app.models.pickup import PickupRequest, WeightRecord
from app.models.payment import PricingCalculation
from app.models.user import User
from app.schemas.marketplace import InventoryItemCreate, InventoryItemResponse
from app.api.deps import get_current_user, require_roles
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/inventory", tags=["Warehouse & Supply Inventory"])

@router.get("", response_model=List[InventoryItemResponse])
async def list_available_inventory(
    material_type: Optional[str] = None,
    status_filter: Optional[str] = Query("AVAILABLE", alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_roles(["RECYCLER", "COLLECTOR", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """View verified aggregated recyclable inventory available for procurement."""
    query = select(InventoryItem).order_by(InventoryItem.created_at.desc()).offset(skip).limit(limit)
    if status_filter and status_filter.upper() != "ALL":
        query = query.where(InventoryItem.status == status_filter.upper())
    if material_type:
        query = query.where(InventoryItem.material_type == material_type)

    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{id}", response_model=InventoryItemResponse)
async def get_inventory_item(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve specifications of an inventory stock lot."""
    query = select(InventoryItem).where(InventoryItem.id == id)
    item = (await db.execute(query)).scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory item not found.")
    return item

@router.post("", response_model=InventoryItemResponse, status_code=status.HTTP_201_CREATED)
async def create_inventory_item(
    payload: InventoryItemCreate,
    request: Request = None,
    current_user: User = Depends(require_roles(["COLLECTOR", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """Collector Hub / Admin: Register new verified aggregated recyclable inventory."""
    item = InventoryItem(
        id=uuid.uuid4(),
        pickup_id=uuid.UUID(payload.pickup_id) if payload.pickup_id else None,
        material_type=payload.material_type,
        verified_weight_kg=payload.verified_weight_kg,
        quality_factor=payload.quality_factor,
        quality_grade=payload.quality_grade,
        location=payload.location,
        hub_sector=payload.hub_sector,
        status="AVAILABLE",
        created_by_user_id=current_user.id
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)

    client_ip = request.client.host if request and request.client else None
    await log_audit_event(
        db=db,
        action_name="INVENTORY_ITEM_CREATED",
        entity_name="inventory_items",
        actor_id=str(current_user.id),
        entity_id=str(item.id),
        details=f"Stocked {payload.verified_weight_kg}kg {payload.material_type} at {payload.location}",
        ip_address=client_ip
    )
    return item

@router.post("/from-pickup/{pickup_id}", response_model=InventoryItemResponse, status_code=status.HTTP_201_CREATED)
async def create_inventory_from_completed_pickup(
    pickup_id: str,
    request: Request = None,
    current_user: User = Depends(require_roles(["COLLECTOR", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """Automatically convert completed/confirmed pickup into warehouse supply inventory.
    Enforces idempotency and prevents duplicate inventory creation.
    """
    # 1. Check if inventory item already created for this pickup
    q_existing = select(InventoryItem).where(InventoryItem.pickup_id == pickup_id)
    existing = (await db.execute(q_existing)).scalar_one_or_none()
    if existing:
        return existing

    # 2. Query pickup details
    q_pick = select(PickupRequest).where(PickupRequest.id == pickup_id)
    pickup = (await db.execute(q_pick)).scalar_one_or_none()
    if not pickup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pickup request not found.")

    # 3. Retrieve verified weight record or pricing calculation
    q_calc = select(PricingCalculation).where(
        PricingCalculation.pickup_id == pickup.id,
        PricingCalculation.is_estimated == False
    ).order_by(PricingCalculation.created_at.desc())
    calc = (await db.execute(q_calc)).scalars().first()

    weight_kg = float(calc.verified_weight_kg) if calc else float(pickup.estimated_quantity_kg)
    q_factor = float(calc.quality_factor) if calc else 1.00
    q_grade = "Tier A" if q_factor >= 0.95 else ("Tier B" if q_factor >= 0.80 else "Tier C")

    # Map material code to clean name
    mat_map = {
        "PET_PLASTIC": "PET plastic",
        "CARDBOARD_OCC": "cardboard",
        "MIXED_METAL": "mixed metal",
    }
    clean_mat = mat_map.get(pickup.material_code, pickup.material_code)

    item = InventoryItem(
        id=uuid.uuid4(),
        pickup_id=pickup.id,
        material_type=clean_mat,
        verified_weight_kg=weight_kg,
        quality_factor=q_factor,
        quality_grade=q_grade,
        location=f"Central Aggregation Hub ({pickup.city})",
        hub_sector="District East",
        status="AVAILABLE",
        created_by_user_id=current_user.id
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)

    client_ip = request.client.host if request and request.client else None
    await log_audit_event(
        db=db,
        action_name="INVENTORY_CREATED_FROM_PICKUP",
        entity_name="inventory_items",
        actor_id=str(current_user.id),
        entity_id=str(item.id),
        details=f"Created inventory {item.id} from pickup {pickup.tracking_number} ({weight_kg}kg {clean_mat})",
        ip_address=client_ip
    )
    return item
