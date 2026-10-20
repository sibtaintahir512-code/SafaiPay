"""Recycler Marketplace & Inventory Schemas."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field

# Demand Schemas
class RecyclerDemandCreate(BaseModel):
    material_type: str = Field(..., description="PET plastic, cardboard, mixed metal, etc.")
    required_quantity_kg: float = Field(..., gt=0, description="Quantity in kg")
    minimum_quality: str = Field(default="Tier A", description="Tier A, Tier B, Tier C")
    location: str = Field(..., min_length=3, description="Delivery target industrial zone")
    offered_price_per_kg: float = Field(..., gt=0, description="Offered benchmark price in PKR/kg")
    deadline: datetime = Field(..., description="Procurement deadline")
    notes: Optional[str] = None

class RecyclerDemandResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    recycler_id: str
    material_type: str
    required_quantity_kg: float
    minimum_quality: str
    location: str
    offered_price_per_kg: float
    deadline: datetime
    status: str
    notes: Optional[str] = None
    created_at: datetime

# Offer Schemas
class SupplyOfferCreate(BaseModel):
    offered_quantity_kg: float = Field(..., gt=0)
    offered_price_per_kg: float = Field(..., gt=0)
    inventory_item_id: Optional[str] = None
    notes: Optional[str] = None

class SupplyOfferResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    demand_id: str
    collector_id: str
    inventory_item_id: Optional[str] = None
    offered_quantity_kg: float
    offered_price_per_kg: float
    notes: Optional[str] = None
    status: str
    created_at: datetime

# Transaction Schemas
class SupplyTransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    offer_id: str
    demand_id: str
    recycler_id: str
    collector_id: str
    inventory_item_id: Optional[str] = None
    agreed_quantity_kg: float
    agreed_price_per_kg: float
    total_amount_pkr: float
    status: str
    delivery_proof_url: Optional[str] = None
    dispute_reason: Optional[str] = None
    cancellation_reason: Optional[str] = None
    created_at: datetime

class ActionWithReasonRequest(BaseModel):
    reason: str = Field(..., min_length=3)

# Inventory Schemas
class InventoryItemCreate(BaseModel):
    pickup_id: Optional[str] = None
    material_type: str
    verified_weight_kg: float = Field(..., gt=0)
    quality_factor: float = Field(default=1.0, ge=0.0, le=1.0)
    quality_grade: str = "Tier A"
    location: str = "Korangi Central Aggregation Hub, Karachi"
    hub_sector: Optional[str] = "District East"

class InventoryItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    pickup_id: Optional[str] = None
    material_type: str
    verified_weight_kg: float
    quality_factor: float
    quality_grade: str
    location: str
    hub_sector: Optional[str] = None
    status: str
    created_at: datetime
