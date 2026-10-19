"""Dispatch tracking schemas."""
from pydantic import BaseModel
from typing import Optional

class DispatchCreate(BaseModel):
    carrier_name: str
    vehicle_plate: str
    gross_weight_kg: float
    tare_weight_kg: float
    net_weight_kg: float

class DispatchResponse(BaseModel):
    id: str
    tracking_number: str
    carrier_name: str
    vehicle_plate: str
    net_weight_kg: float
    status: str
