"""Analytics and ESG report schemas."""
from pydantic import BaseModel
from typing import Dict, Any, List

class ESGMetricsResponse(BaseModel):
    total_diverted_kg: float
    total_co2_offset_kg: float
    landfill_diversion_rate: float
    registered_households: int

class DistrictTonnageResponse(BaseModel):
    district: str
    tonnage: float
    active_collectors: int

class ESGImpactSummaryResponse(BaseModel):
    total_diverted_kg: float
    diverted_tonnage: float
    total_co2_offset_kg: float
    active_collectors_count: int
    partner_enterprises_count: int
    total_disbursed_pkr: float
    material_breakdown: Dict[str, float]
    disclaimer: str

