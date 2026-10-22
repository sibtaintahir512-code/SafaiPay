"""Pricing calculator routes."""
from fastapi import APIRouter
from app.schemas.pricing import PricingCalculationRequest, PricingCalculationResponse

router = APIRouter(prefix="/pricing", tags=["Pricing"])

@router.post("/calculate", response_model=PricingCalculationResponse)
async def calculate_payout(payload: PricingCalculationRequest):
    factor = 1.0 if payload.quality_grade == "A" else 0.85 if payload.quality_grade == "B" else 0.65
    rate = 80.0
    total = round(payload.weight_kg * rate * factor, 2)
    return {
        "material_code": payload.material_code,
        "weight_kg": payload.weight_kg,
        "rate_applied": rate,
        "quality_factor": factor,
        "total_price": total,
        "calculation_breakdown": f"{payload.weight_kg}kg * {rate} * {factor} = {total} PKR"
    }
