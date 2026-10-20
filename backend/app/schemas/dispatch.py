"""Dispatch tracking schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class DispatchCreate(BaseModel):
    batch_id: Optional[str] = None
    carrier_name: str
    vehicle_plate: str
    gross_weight_kg: float
    tare_weight_kg: float
    net_weight_kg: float

class DispatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tracking_number: str
    batch_id: Optional[str] = None
    carrier_name: str
    vehicle_plate: str
    gross_weight_kg: Optional[float] = None
    tare_weight_kg: Optional[float] = None
    net_weight_kg: float
    status: str
    created_at: Optional[datetime] = None

