from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class MaterialBase(BaseModel):
    code: str = Field(..., description="Unique material identifier, e.g. PET_PLASTIC")
    name: str = Field(..., description="Display title")
    unit: str = "kg"
    description: Optional[str] = None
    benchmark_rate_pkr: float = Field(..., ge=0.0)
    tier_a_factor: float = Field(default=1.00, ge=0, le=1.5)
    tier_b_factor: float = Field(default=0.90, ge=0, le=1.5)
    tier_c_factor: float = Field(default=0.75, ge=0, le=1.5)
    is_active: bool = True

class MaterialCreate(MaterialBase):
    pass

class MaterialResponse(MaterialBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime

class BenchmarkRateUpdate(BaseModel):
    benchmark_rate_pkr: float = Field(..., ge=0.0, description="New wholesale rate per kg in PKR")
    notes: Optional[str] = None
