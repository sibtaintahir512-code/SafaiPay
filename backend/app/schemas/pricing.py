"""Pricing schemas."""
from pydantic import BaseModel
from typing import Optional

class PricingCalculationRequest(BaseModel):
    material_code: str
    weight_kg: float
    quality_grade: str = "A"

class PricingCalculationResponse(BaseModel):
    material_code: str
    weight_kg: float
    rate_applied: float
    quality_factor: float
    total_price: float
    calculation_breakdown: str
