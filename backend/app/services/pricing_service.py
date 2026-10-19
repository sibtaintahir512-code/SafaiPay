import json
import uuid
from typing import Dict, Any, Tuple
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.material import Material
from app.models.payment import PricingCalculation
from app.models.pickup import PickupRequest

def validate_pricing_inputs(weight_kg: float, quality_factor: float) -> None:
    """Validate physical weighing inputs according to business rules."""
    if weight_kg <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid verified weight: {weight_kg} kg. Weight must be greater than 0."
        )

    if quality_factor < 0.0 or quality_factor > 1.0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid quality factor: {quality_factor}. Quality factor must be between 0.0 and 1.0."
        )

async def calculate_pickup_pricing(
    db: AsyncSession,
    pickup_id: uuid.UUID,
    material_code: str,
    verified_weight_kg: float,
    quality_factor: float = 1.0,
    is_estimated: bool = False
) -> Tuple[PricingCalculation, Dict[str, Any]]:
    """Compute deterministic price and persist calculation snapshot.
    Formula: Total Price = Verified Weight × Material Rate × Quality Factor
    """
    validate_pricing_inputs(verified_weight_kg, quality_factor)

    query = select(Material).where(Material.code == material_code)
    result = await db.execute(query)
    material = result.scalar_one_or_none()

    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Material category '{material_code}' not found."
        )

    rate_applied = float(material.benchmark_rate_pkr)
    total_price = round(verified_weight_kg * rate_applied * quality_factor, 2)

    tier_label = "TIER_A"
    if quality_factor <= 0.0:
        tier_label = "REJECTED"
    elif quality_factor < 0.85:
        tier_label = "TIER_C"
    elif quality_factor < 1.0:
        tier_label = "TIER_B"

    breakdown_data = {
        "material_code": material_code,
        "material_name": material.name,
        "unit": material.unit,
        "verified_weight_kg": verified_weight_kg,
        "benchmark_rate_pkr": rate_applied,
        "quality_factor": quality_factor,
        "quality_tier": tier_label,
        "formula": f"{verified_weight_kg} kg × PKR {rate_applied:.2f}/kg × {quality_factor:.2f}",
        "total_price_pkr": total_price,
        "status_label": "Estimated" if is_estimated else "Verified"
    }

    pricing_calc = PricingCalculation(
        id=uuid.uuid4(),
        pickup_id=pickup_id,
        material_code=material_code,
        verified_weight_kg=verified_weight_kg,
        material_rate_applied=rate_applied,
        quality_factor=quality_factor,
        total_price=total_price,
        calculation_breakdown=json.dumps(breakdown_data),
        is_estimated=is_estimated
    )
    db.add(pricing_calc)
    await db.flush()

    return pricing_calc, breakdown_data
