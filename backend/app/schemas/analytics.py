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
