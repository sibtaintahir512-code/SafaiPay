"""Fraud alert schemas."""
from pydantic import BaseModel
from typing import Optional

class FraudAlertResponse(BaseModel):
    id: str
    alert_type: str
    severity: str
    description: str
    status: str
    pickup_id: Optional[str] = None
