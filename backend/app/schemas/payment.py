from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class MockPaymentProcessRequest(BaseModel):
    simulate_failure: bool = False
    failure_reason: Optional[str] = None

class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    pickup_id: str
    transaction_reference: str
    payer_id: str
    payee_id: str
    amount_pkr: float
    status: str
    failure_reason: Optional[str] = None
    retry_count: int
    completed_at: Optional[datetime] = None
    created_at: datetime

class CollectorEarningRecord(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    collector_id: str
    pickup_id: str
    payment_id: str
    gross_amount_pkr: float
    net_earnings_pkr: float
    earned_date: date
    created_at: datetime

class CollectorEarningsSummary(BaseModel):
    today_earnings_pkr: float
    week_earnings_pkr: float
    month_earnings_pkr: float
    completed_jobs_count: int
    total_verified_kg: float

class DisputeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    pickup_id: str
    raised_by_user_id: str
    reason_category: str
    description: str
    status: str
    resolution_notes: Optional[str] = None
    resolved_by_admin_id: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime

class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    message: str
    notification_type: str
    is_read: bool
    related_entity_id: Optional[str] = None
    created_at: datetime
