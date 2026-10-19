"""Material batch marketplace routes."""
from fastapi import APIRouter
from typing import List
from app.schemas.batch import BatchResponse

router = APIRouter(prefix="/batches", tags=["Batches"])

@router.get("", response_model=List[BatchResponse])
async def list_batches():
    return [
        {
            "id": "b-901",
            "batch_code": "BATCH-PET-2026-041",
            "material_code": "PET_PLASTIC",
            "net_weight_kg": 12500.0,
            "purity_percentage": 99.1,
            "status": "AVAILABLE",
            "hub_location": "Korangi Hub, Karachi"
        }
    ]
