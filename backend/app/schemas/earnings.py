"""Earnings summary schema."""
from pydantic import BaseModel

class EarningsSummary(BaseModel):
    today_earnings_pkr: float
    week_earnings_pkr: float
    month_earnings_pkr: float
    completed_jobs_count: int
    total_verified_kg: float
