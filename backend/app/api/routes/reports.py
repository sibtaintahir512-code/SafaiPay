"""Executive reports routes."""
from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/summary")
async def get_reports_summary() -> Dict[str, Any]:
    return {
        "monthly_tonnage_diverted": 142.8,
        "disbursed_pkr": 8420000,
        "co2e_abatement_tons": 194.2,
        "active_citizen_hubs": 2840
    }
