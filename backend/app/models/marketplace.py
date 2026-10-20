"""Recycler Marketplace, Demand Management & Supply Inventory Models."""
import uuid
from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import GUID, TimestampMixin

class InventoryItem(Base, TimestampMixin):
    __tablename__ = "inventory_items"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    pickup_id = Column(GUID, ForeignKey("pickup_requests.id", ondelete="SET NULL"), nullable=True, unique=True)
    material_type = Column(String(100), nullable=False, index=True)
    verified_weight_kg = Column(Numeric(12, 2), nullable=False)
    quality_factor = Column(Numeric(3, 2), default=1.00, nullable=False)
    quality_grade = Column(String(50), default="Tier A", nullable=False)
    location = Column(String(200), default="Korangi Central Aggregation Hub, Karachi", nullable=False)
    hub_sector = Column(String(100), default="District East", nullable=True)
    status = Column(String(50), default="AVAILABLE", nullable=False, index=True)  # AVAILABLE, OFFER_SUBMITTED, RESERVED, SOLD
    created_by_user_id = Column(GUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

class RecyclerDemand(Base, TimestampMixin):
    __tablename__ = "recycler_demands"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    recycler_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    material_type = Column(String(100), nullable=False, index=True)
    required_quantity_kg = Column(Numeric(12, 2), nullable=False)
    minimum_quality = Column(String(50), default="Tier A", nullable=False)
    location = Column(String(200), default="Karachi Industrial Area", nullable=False)
    offered_price_per_kg = Column(Numeric(10, 2), nullable=False)
    deadline = Column(DateTime, nullable=False)
    status = Column(String(50), default="OPEN", nullable=False, index=True)  # OPEN, PARTIALLY_FULFILLED, FULFILLED, CANCELLED, EXPIRED
    notes = Column(String(500), nullable=True)

class SupplyOffer(Base, TimestampMixin):
    __tablename__ = "supply_offers"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    demand_id = Column(GUID, ForeignKey("recycler_demands.id", ondelete="CASCADE"), nullable=False, index=True)
    collector_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    inventory_item_id = Column(GUID, ForeignKey("inventory_items.id", ondelete="SET NULL"), nullable=True, index=True)
    offered_quantity_kg = Column(Numeric(12, 2), nullable=False)
    offered_price_per_kg = Column(Numeric(10, 2), nullable=False)
    notes = Column(String(500), nullable=True)
    status = Column(String(50), default="OFFER_SUBMITTED", nullable=False, index=True)  # OFFER_SUBMITTED, ACCEPTED, REJECTED, CANCELLED

class SupplyTransaction(Base, TimestampMixin):
    __tablename__ = "supply_transactions"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    offer_id = Column(GUID, ForeignKey("supply_offers.id", ondelete="CASCADE"), nullable=False, index=True)
    demand_id = Column(GUID, ForeignKey("recycler_demands.id", ondelete="CASCADE"), nullable=False, index=True)
    recycler_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    collector_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    inventory_item_id = Column(GUID, ForeignKey("inventory_items.id", ondelete="SET NULL"), nullable=True, index=True)
    agreed_quantity_kg = Column(Numeric(12, 2), nullable=False)
    agreed_price_per_kg = Column(Numeric(10, 2), nullable=False)
    total_amount_pkr = Column(Numeric(14, 2), nullable=False)
    status = Column(String(50), default="ACCEPTED", nullable=False, index=True)  # OFFER_SUBMITTED, ACCEPTED, DELIVERED, COMPLETED, REJECTED, CANCELLED, DISPUTED
    delivery_proof_url = Column(String(500), nullable=True)
    dispute_reason = Column(String(500), nullable=True)
    cancellation_reason = Column(String(500), nullable=True)

__all__ = [
    "InventoryItem",
    "RecyclerDemand",
    "SupplyOffer",
    "SupplyTransaction",
]
