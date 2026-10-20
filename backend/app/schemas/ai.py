"""AI Classification & Model Schemas."""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

class PredictionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[str] = None
    material: str
    confidence: float
    requires_manual_verification: bool
    top_predictions: Optional[List[Dict[str, Any]]] = None
    model_version: str
    status: Optional[str] = "PREDICTED"
    verified_material: Optional[str] = None
    is_corrected: Optional[bool] = False
    disclaimer: Optional[str] = "Demo Classifier: Values are advisory estimates."
    created_at: Optional[datetime] = None

class PredictionCorrectionRequest(BaseModel):
    corrected_material: str = Field(..., min_length=2, description="Customer or collector corrected material stream")
    notes: Optional[str] = None

class PredictionVerificationRequest(BaseModel):
    verified_material: str = Field(..., min_length=2, description="Human supervisor verified material stream")
    verification_notes: Optional[str] = None

class ModelVersionResponse(BaseModel):
    version_name: str
    architecture: str
    classes: List[str]
    description: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    is_active: bool
    evaluation_metrics_plan: Dict[str, Any]
