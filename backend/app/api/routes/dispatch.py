"""Dispatch tracking routes."""
from fastapi import APIRouter
from typing import List
from app.schemas.dispatch import DispatchResponse

router = APIRouter(prefix="/dispatch", tags=["Dispatch"])

@router.get("", response_model=List[DispatchResponse])
async def list_dispatches():
    return [
        {
            "id": "dsp-101",
            "tracking_number": "PO-REC-2026-081",
            "carrier_name": "Indus Eco-Logistics",
            "vehicle_plate": "TL-8902",
            "net_weight_kg": 12500.0,
            "status": "IN_TRANSIT"
        }
    ]
