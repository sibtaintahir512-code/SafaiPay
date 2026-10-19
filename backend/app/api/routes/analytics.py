"""Analytics and impact metrics routes."""
from fastapi import APIRouter
from app.schemas.analytics import ESGMetricsResponse

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/esg", response_model=ESGMetricsResponse)
async def get_esg_impact():
    return {
        "total_diverted_kg": 142800.0,
        "total_co2_offset_kg": 192780.0,
        "landfill_diversion_rate": 99.1,
        "registered_households": 2840
    }
