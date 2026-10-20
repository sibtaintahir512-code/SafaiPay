"""Material batch procurement schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class BatchCreate(BaseModel):
    material_code: str
    net_weight_kg: float = Field(..., gt=0)
    purity_percentage: float = Field(default=99.0, ge=0.0, le=100.0)
    hub_location: str = "Korangi Hub, Karachi"

class BatchProcureRequest(BaseModel):
    delivery_destination: Optional[str] = None
    notes: Optional[str] = None

class BatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    batch_code: str
    material_code: str
    net_weight_kg: float
    purity_percentage: float
    status: str
    hub_location: str
    procured_by_user_id: Optional[str] = None
    procured_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

