"""Material batch procurement schemas."""
from pydantic import BaseModel
from typing import Optional

class BatchCreate(BaseModel):
    material_code: str
    net_weight_kg: float
    purity_percentage: float = 99.0
    hub_location: str = "Korangi Hub, Karachi"

class BatchResponse(BaseModel):
    id: str
    batch_code: str
    material_code: str
    net_weight_kg: float
    purity_percentage: float
    status: str
    hub_location: str
