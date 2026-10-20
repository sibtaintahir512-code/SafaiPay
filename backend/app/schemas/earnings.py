"""Earnings and digital financial identity schemas."""
from typing import List, Optional
from pydantic import BaseModel

class EarningsSummary(BaseModel):
    today_earnings_pkr: float
    week_earnings_pkr: float
    month_earnings_pkr: float
    completed_jobs_count: int
    total_verified_kg: float

class ScorePillarBreakdown(BaseModel):
    pillar_name: str
    weight_percentage: int
    score_earned: float
    max_score: float
    description: str

class FinancialIdentityScoreResponse(BaseModel):
    collector_id: str
    collector_name: str
    credit_score: int
    score_grade: str
    monthly_moving_avg_pkr: float
    total_verified_kg: float
    dispute_free_rate: float
    customer_rating_avg: float
    eligible_micro_loan_pkr: float
    eligible_financing_product: str
    consent_granted: bool
    disclaimer: str
    pillars: List[ScorePillarBreakdown]

