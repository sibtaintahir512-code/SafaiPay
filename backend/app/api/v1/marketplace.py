"""Recycler Demand Management, Supply Offers & Transaction Lifecycle Routes."""
import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.models.marketplace import (
    RecyclerDemand,
    SupplyOffer,
    SupplyTransaction,
    InventoryItem,
)
from app.models.user import User
from app.schemas.marketplace import (
    RecyclerDemandCreate,
    RecyclerDemandResponse,
    SupplyOfferCreate,
    SupplyOfferResponse,
    SupplyTransactionResponse,
    ActionWithReasonRequest,
)
from app.api.deps import get_current_user, require_roles
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/marketplace", tags=["Recycler Marketplace & Supply Transactions"])

# ---------------------------------------------------------------------------
# Recycler Demands
# ---------------------------------------------------------------------------
@router.post("/demands", response_model=RecyclerDemandResponse, status_code=status.HTTP_201_CREATED)
async def create_recycler_demand(
    payload: RecyclerDemandCreate,
    request: Request = None,
    current_user: User = Depends(require_roles(["RECYCLER", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """Recycler / Admin: Create a B2B feedstock procurement demand post."""
    demand = RecyclerDemand(
        id=uuid.uuid4(),
        recycler_id=current_user.id,
        material_type=payload.material_type,
        required_quantity_kg=payload.required_quantity_kg,
        minimum_quality=payload.minimum_quality,
        location=payload.location,
        offered_price_per_kg=payload.offered_price_per_kg,
        deadline=payload.deadline,
        status="OPEN",
        notes=payload.notes
    )
    db.add(demand)
    await db.commit()
    await db.refresh(demand)

    client_ip = request.client.host if request and request.client else None
    await log_audit_event(
        db=db,
        action_name="RECYCLER_DEMAND_CREATED",
        entity_name="recycler_demands",
        actor_id=str(current_user.id),
        entity_id=str(demand.id),
        details=f"Recycler posted demand for {payload.required_quantity_kg}kg {payload.material_type} at Rs {payload.offered_price_per_kg}/kg",
        ip_address=client_ip
    )
    return demand

@router.get("/demands", response_model=List[RecyclerDemandResponse])
async def list_recycler_demands(
    material_type: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """List open and active industrial recycler demand posts."""
    query = select(RecyclerDemand).order_by(RecyclerDemand.created_at.desc()).offset(skip).limit(limit)
    if material_type:
        query = query.where(RecyclerDemand.material_type == material_type)
    if status_filter:
        query = query.where(RecyclerDemand.status == status_filter)

    result = await db.execute(query)
    return result.scalars().all()

@router.get("/demands/my-demands", response_model=List[RecyclerDemandResponse])
async def list_my_demands(
    current_user: User = Depends(require_roles(["RECYCLER", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """Recycler: Retrieve own posted procurement demands."""
    query = select(RecyclerDemand).where(
        RecyclerDemand.recycler_id == current_user.id
    ).order_by(RecyclerDemand.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

# ---------------------------------------------------------------------------
# Supply Offers
# ---------------------------------------------------------------------------
@router.post("/demands/{demand_id}/offers", response_model=SupplyOfferResponse, status_code=status.HTTP_201_CREATED)
async def submit_supply_offer(
    demand_id: str,
    payload: SupplyOfferCreate,
    request: Request = None,
    current_user: User = Depends(require_roles(["COLLECTOR", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """Collector or Hub: Submit a supply offer against an active recycler demand post.
    Enforces duplicate inventory sale prevention.
    """
    # 1. Validate demand exists and is open
    q_dem = select(RecyclerDemand).where(RecyclerDemand.id == demand_id)
    demand = (await db.execute(q_dem)).scalar_one_or_none()
    if not demand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recycler demand post not found.")

    if demand.status not in ["OPEN", "PARTIALLY_FULFILLED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot submit offer to demand in '{demand.status}' status."
        )

    # 2. If inventory_item_id is specified, enforce duplicate sale prevention
    inventory_item = None
    if payload.inventory_item_id:
        q_inv = select(InventoryItem).where(InventoryItem.id == payload.inventory_item_id)
        inventory_item = (await db.execute(q_inv)).scalar_one_or_none()
        if not inventory_item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Referenced inventory item not found.")

        if inventory_item.status != "AVAILABLE":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Duplicate sale prevention: Inventory item '{payload.inventory_item_id}' is already {inventory_item.status} and cannot be offered."
            )

        # Mark inventory as offer submitted
        inventory_item.status = "OFFER_SUBMITTED"

    offer = SupplyOffer(
        id=uuid.uuid4(),
        demand_id=demand.id,
        collector_id=current_user.id,
        inventory_item_id=inventory_item.id if inventory_item else None,
        offered_quantity_kg=payload.offered_quantity_kg,
        offered_price_per_kg=payload.offered_price_per_kg,
        notes=payload.notes,
        status="OFFER_SUBMITTED"
    )
    db.add(offer)
    await db.commit()
    await db.refresh(offer)

    client_ip = request.client.host if request and request.client else None
    await log_audit_event(
        db=db,
        action_name="SUPPLY_OFFER_SUBMITTED",
        entity_name="supply_offers",
        actor_id=str(current_user.id),
        entity_id=str(offer.id),
        details=f"Offered {payload.offered_quantity_kg}kg at Rs {payload.offered_price_per_kg}/kg against demand {demand_id}",
        ip_address=client_ip
    )
    return offer

@router.get("/offers", response_model=List[SupplyOfferResponse])
async def list_supply_offers(
    demand_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List supply offers for a demand or user's submitted offers."""
    query = select(SupplyOffer).order_by(SupplyOffer.created_at.desc())
    if demand_id:
        query = query.where(SupplyOffer.demand_id == demand_id)
    elif "ADMIN" not in current_user.role_names and "RECYCLER" not in current_user.role_names:
        query = query.where(SupplyOffer.collector_id == current_user.id)

    result = await db.execute(query)
    return result.scalars().all()

@router.post("/offers/{offer_id}/accept", response_model=SupplyTransactionResponse)
async def accept_supply_offer(
    offer_id: str,
    request: Request = None,
    current_user: User = Depends(require_roles(["RECYCLER", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """Recycler / Admin: Accept a supply offer and form a binding transaction.
    State Transition: offer_submitted -> accepted
    """
    q_off = select(SupplyOffer).where(SupplyOffer.id == offer_id)
    offer = (await db.execute(q_off)).scalar_one_or_none()
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supply offer not found.")

    if offer.status != "OFFER_SUBMITTED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Offer is already '{offer.status}' and cannot be accepted."
        )

    # Validate demand ownership if recycler
    q_dem = select(RecyclerDemand).where(RecyclerDemand.id == offer.demand_id)
    demand = (await db.execute(q_dem)).scalar_one_or_none()
    if "ADMIN" not in current_user.role_names and demand.recycler_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the demand owner can accept this offer.")

    offer.status = "ACCEPTED"

    # Lock associated inventory
    if offer.inventory_item_id:
        q_inv = select(InventoryItem).where(InventoryItem.id == offer.inventory_item_id)
        inv = (await db.execute(q_inv)).scalar_one_or_none()
        if inv:
            inv.status = "RESERVED"

    total_amount = round(float(offer.offered_quantity_kg) * float(offer.offered_price_per_kg), 2)

    txn = SupplyTransaction(
        id=uuid.uuid4(),
        offer_id=offer.id,
        demand_id=demand.id,
        recycler_id=demand.recycler_id,
        collector_id=offer.collector_id,
        inventory_item_id=offer.inventory_item_id,
        agreed_quantity_kg=offer.offered_quantity_kg,
        agreed_price_per_kg=offer.offered_price_per_kg,
        total_amount_pkr=total_amount,
        status="ACCEPTED"
    )
    db.add(txn)
    await db.commit()
    await db.refresh(txn)

    client_ip = request.client.host if request and request.client else None
    await log_audit_event(
        db=db,
        action_name="SUPPLY_OFFER_ACCEPTED",
        entity_name="supply_transactions",
        actor_id=str(current_user.id),
        entity_id=str(txn.id),
        details=f"Recycler accepted offer {offer.id}. Created transaction {txn.id} for PKR {total_amount}",
        ip_address=client_ip
    )
    return txn

@router.post("/offers/{offer_id}/reject", response_model=SupplyOfferResponse)
async def reject_supply_offer(
    offer_id: str,
    request: Request = None,
    current_user: User = Depends(require_roles(["RECYCLER", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """Recycler / Admin: Reject a supply offer and release inventory."""
    q_off = select(SupplyOffer).where(SupplyOffer.id == offer_id)
    offer = (await db.execute(q_off)).scalar_one_or_none()
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supply offer not found.")

    offer.status = "REJECTED"

    # Release inventory item back to AVAILABLE
    if offer.inventory_item_id:
        q_inv = select(InventoryItem).where(InventoryItem.id == offer.inventory_item_id)
        inv = (await db.execute(q_inv)).scalar_one_or_none()
        if inv:
            inv.status = "AVAILABLE"

    await db.commit()
    await db.refresh(offer)
    return offer

# ---------------------------------------------------------------------------
# Supply Transactions & State Transitions
# ---------------------------------------------------------------------------
@router.post("/transactions/{id}/deliver", response_model=SupplyTransactionResponse)
async def mark_transaction_delivered(
    id: str,
    delivery_proof_url: Optional[str] = Query(None),
    current_user: User = Depends(require_roles(["COLLECTOR", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """Collector / Admin: Confirm material delivery at recycler aggregation facility.
    State Transition: accepted -> delivered
    """
    query = select(SupplyTransaction).where(SupplyTransaction.id == id)
    txn = (await db.execute(query)).scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found.")

    if txn.status != "ACCEPTED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot mark transaction delivered from status '{txn.status}'."
        )

    txn.status = "DELIVERED"
    if delivery_proof_url:
        txn.delivery_proof_url = delivery_proof_url

    await db.commit()
    await db.refresh(txn)
    return txn

@router.post("/transactions/{id}/complete", response_model=SupplyTransactionResponse)
async def complete_supply_transaction(
    id: str,
    request: Request = None,
    current_user: User = Depends(require_roles(["RECYCLER", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """Recycler / Admin: Acknowledge verified weight receipt and complete settlement.
    State Transition: delivered -> completed
    """
    query = select(SupplyTransaction).where(SupplyTransaction.id == id)
    txn = (await db.execute(query)).scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found.")

    if txn.status != "DELIVERED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transaction must be in 'DELIVERED' status before completion. Current status: '{txn.status}'."
        )

    txn.status = "COMPLETED"

    # Mark inventory item as permanently SOLD
    if txn.inventory_item_id:
        q_inv = select(InventoryItem).where(InventoryItem.id == txn.inventory_item_id)
        inv = (await db.execute(q_inv)).scalar_one_or_none()
        if inv:
            inv.status = "SOLD"

    # Update demand fulfilled status
    q_dem = select(RecyclerDemand).where(RecyclerDemand.id == txn.demand_id)
    demand = (await db.execute(q_dem)).scalar_one_or_none()
    if demand:
        demand.status = "FULFILLED"

    await db.commit()
    await db.refresh(txn)

    client_ip = request.client.host if request and request.client else None
    await log_audit_event(
        db=db,
        action_name="SUPPLY_TRANSACTION_COMPLETED",
        entity_name="supply_transactions",
        actor_id=str(current_user.id),
        entity_id=str(txn.id),
        details=f"Completed transaction {txn.id}. Settled PKR {txn.total_amount_pkr} for {txn.agreed_quantity_kg}kg",
        ip_address=client_ip
    )
    return txn

@router.post("/transactions/{id}/cancel", response_model=SupplyTransactionResponse)
async def cancel_supply_transaction(
    id: str,
    payload: ActionWithReasonRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Recycler, Collector, or Admin: Cancel an active transaction before completion."""
    query = select(SupplyTransaction).where(SupplyTransaction.id == id)
    txn = (await db.execute(query)).scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found.")

    if txn.status in ["COMPLETED", "CANCELLED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel transaction in '{txn.status}' state."
        )

    txn.status = "CANCELLED"
    txn.cancellation_reason = payload.reason

    # Release inventory back to AVAILABLE
    if txn.inventory_item_id:
        q_inv = select(InventoryItem).where(InventoryItem.id == txn.inventory_item_id)
        inv = (await db.execute(q_inv)).scalar_one_or_none()
        if inv:
            inv.status = "AVAILABLE"

    await db.commit()
    await db.refresh(txn)
    return txn

@router.post("/transactions/{id}/dispute", response_model=SupplyTransactionResponse)
async def dispute_supply_transaction(
    id: str,
    payload: ActionWithReasonRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Flag weighbridge weight discrepancy or quality grade dispute."""
    query = select(SupplyTransaction).where(SupplyTransaction.id == id)
    txn = (await db.execute(query)).scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found.")

    txn.status = "DISPUTED"
    txn.dispute_reason = payload.reason

    await db.commit()
    await db.refresh(txn)
    return txn

@router.get("/transactions", response_model=List[SupplyTransactionResponse])
async def list_supply_transactions(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List marketplace supply transactions with role-based visibility."""
    query = select(SupplyTransaction).order_by(SupplyTransaction.created_at.desc())
    if "ADMIN" not in current_user.role_names:
        query = query.where(
            or_(
                SupplyTransaction.recycler_id == current_user.id,
                SupplyTransaction.collector_id == current_user.id
            )
        )

    if status_filter:
        query = query.where(SupplyTransaction.status == status_filter)

    result = await db.execute(query)
    return result.scalars().all()
