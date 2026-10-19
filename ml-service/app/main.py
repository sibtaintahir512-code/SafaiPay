"""SafaiPay AI/ML Microservice Interface
Provides waste image classification inference and Roman Urdu NLP request parsing.
Enforces the mandatory business rule: All AI predictions are advisory estimates only.
"""

from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional
import datetime

app = FastAPI(
    title="SafaiPay AI Microservice",
    description="Autonomous ML Service for Waste Classification and Roman Urdu NLP Extraction",
    version="1.0.0",
)

class ClassifyWasteRequest(BaseModel):
    image_url: str
    requested_categories: Optional[List[str]] = ["PET_PLASTIC", "CARDBOARD"]
    model_version: Optional[str] = "v1.2.0-karachi-pilot"

class DetectedObject(BaseModel):
    label: str
    bounding_box: List[int]
    score: float

class PredictionResult(BaseModel):
    material_code: str
    material_name: str
    confidence_score: float
    suggested_quality_tier: str
    is_estimate: bool = True
    disclaimer: str

class ClassifyWasteResponse(BaseModel):
    status: str
    inference_timestamp: str
    prediction: PredictionResult
    detected_objects: List[DetectedObject]

class ParseRequestInput(BaseModel):
    raw_text: str
    sender_id: Optional[str] = None

class MaterialEntity(BaseModel):
    material_code: str
    raw_token: str
    estimated_weight_kg: Optional[float] = None

class ScheduleEntity(BaseModel):
    raw_temporal: str
    inferred_time: Optional[str] = None

class ParsedEntities(BaseModel):
    intent: str
    intent_confidence: float
    materials: List[MaterialEntity]
    schedule: ScheduleEntity
    location_hint: Optional[str] = None

class ParseRequestResponse(BaseModel):
    status: str
    parsed_entities: ParsedEntities

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SafaiPay AI Microservice",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
    }

@app.post("/v1/classify-waste", response_model=ClassifyWasteResponse)
def classify_waste(payload: ClassifyWasteRequest):
    """Advisory Computer Vision classification for uploaded waste images."""
    # Deterministic mock inference for Phase 2 foundation
    image_lower = payload.image_url.lower()
    if "cardboard" in image_lower or "gatta" in image_lower or "box" in image_lower:
        mat_code = "CARDBOARD_OCC"
        mat_name = "Corrugated Cardboard"
        tier = "TIER_A"
        conf = 0.94
        label = "corrugated_box"
    else:
        mat_code = "PET_PLASTIC"
        mat_name = "PET Plastic Bottles"
        tier = "TIER_A"
        conf = 0.92
        label = "clear_plastic_bottle"

    return ClassifyWasteResponse(
        status="SUCCESS",
        inference_timestamp=datetime.datetime.utcnow().isoformat() + "Z",
        prediction=PredictionResult(
            material_code=mat_code,
            material_name=mat_name,
            confidence_score=conf,
            suggested_quality_tier=tier,
            is_estimate=True,
            disclaimer="AI classification is an advisory estimate only. Final verification is performed on-site by the verified collector."
        ),
        detected_objects=[
            DetectedObject(
                label=label,
                bounding_box=[100, 80, 400, 550],
                score=conf
            )
        ]
    )

@app.post("/v1/parse-request", response_model=ParseRequestResponse)
def parse_request(payload: ParseRequestInput):
    """Roman Urdu and English NLP request parser."""
    text = payload.raw_text.lower()
    materials = []
    
    if "gatta" in text or "cardboard" in text:
        materials.append(MaterialEntity(
            material_code="CARDBOARD_OCC",
            raw_token="gatta",
            estimated_weight_kg=15.0 if "15" in text else 10.0
        ))
    if "plastic" in text or "botal" in text or "bottle" in text:
        materials.append(MaterialEntity(
            material_code="PET_PLASTIC",
            raw_token="plastic botlein",
            estimated_weight_kg=10.0 if "10" in text else None
        ))

    return ParseRequestResponse(
        status="SUCCESS",
        parsed_entities=ParsedEntities(
            intent="PICKUP_REQUEST",
            intent_confidence=0.95,
            materials=materials if materials else [MaterialEntity(material_code="PET_PLASTIC", raw_token="recyclable waste")],
            schedule=ScheduleEntity(
                raw_temporal="kal subah" if "kal" in text else "today",
                inferred_time=datetime.datetime.utcnow().isoformat() + "Z"
            ),
            location_hint="Clifton / Karachi"
        )
    )
