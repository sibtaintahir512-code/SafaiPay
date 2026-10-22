"""Fraud alerts routes."""
from fastapi import APIRouter
from typing import List
from app.schemas.fraud import FraudAlertResponse

router = APIRouter(prefix="/fraud", tags=["Fraud"])

@router.get("/alerts", response_model=List[FraudAlertResponse])
async def list_fraud_alerts():
    return [
        {
            "id": "ALT-101",
            "alert_type": "WEIGHT_VARIANCE",
            "severity": "HIGH",
            "description": "Est: 10 kg vs Weighed: 88 kg (+780% anomaly)",
            "status": "ACTIVE",
            "pickup_id": "SP-JOB-340"
        }
    ]
