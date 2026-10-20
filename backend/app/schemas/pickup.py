from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field, ConfigDict, field_validator
from app.models.pickup import PickupStatus, ImageType

class PickupCreateRequest(BaseModel):
    material_code: str = Field(..., description="PET_PLASTIC or CARDBOARD_OCC")
    estimated_quantity_kg: float = Field(..., gt=0, description="Approximate quantity in kg")
    street_address: str = Field(..., min_length=5)
    city: str = Field(default="Karachi")
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    preferred_time: datetime = Field(..., description="Scheduled collection window")
    notes: Optional[str] = None
    photo_url: Optional[str] = None

class PickupAssignRequest(BaseModel):
    collector_id: str = Field(..., description="UUID of verified collector")
    notes: Optional[str] = None

class PickupRejectRequest(BaseModel):
    reason: str = Field(..., min_length=3, description="Reason for rejecting job")

class PickupStartRequest(BaseModel):
    gps_latitude: float
    gps_longitude: float
    notes: Optional[str] = None

class WeightVerificationRequest(BaseModel):
    verified_weight_kg: float = Field(..., gt=0, le=2500.0, description="Physical weight from calibrated scale (max 2500kg)")
    quality_factor: float = Field(default=1.00, ge=0.0, le=1.0, description="Quality multiplier (0.0 to 1.0)")
    scale_photo_url: Optional[str] = None
    before_photo_url: Optional[str] = None
    after_photo_url: Optional[str] = None
    notes: Optional[str] = None

class CustomerConfirmRequest(BaseModel):
    notes: Optional[str] = None

class PickupCancelRequest(BaseModel):
    reason: str = Field(..., min_length=3)

class WasteImageUploadRequest(BaseModel):
    image_type: str = Field(..., description="customer_upload, before_pickup, after_pickup, scale_display")
    image_url: str = Field(..., min_length=5)
    caption: Optional[str] = None

class RatingCreateRequest(BaseModel):
    score: int = Field(..., ge=1, le=5, description="1 to 5 stars")
    review_text: Optional[str] = None

class DisputeCreateRequest(BaseModel):
    reason_category: str = Field(..., description="WEIGHT_MISMATCH, QUALITY_DEDUCTION, NO_SHOW, etc.")
    description: str = Field(..., min_length=5)

class DisputeResolveRequest(BaseModel):
    status: str = Field(..., description="RESOLVED or DISMISSED")
    resolution_notes: str = Field(..., min_length=5)

class WasteImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    image_type: str
    image_url: str
    caption: Optional[str] = None
    created_at: datetime

class PricingCalculationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    material_code: str
    verified_weight_kg: float
    material_rate_applied: float
    quality_factor: float
    total_price: float
    calculation_breakdown: str
    is_estimated: bool

class PickupDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tracking_number: str
    customer_id: str
    assigned_collector_id: Optional[str] = None
    material_code: str
    estimated_quantity_kg: float
    street_address: str
    city: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    preferred_time: datetime
    notes: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    images: List[WasteImageResponse] = []
    pricing_calculations: List[PricingCalculationResponse] = []

class AIClassificationRequest(BaseModel):
    image_url: Optional[str] = None
    stream_hint: Optional[str] = None

class AIClassificationResponse(BaseModel):
    predicted_material: str
    confidence_score: float
    quality_tier: str
    quality_factor: float
    estimated_rate_pkr: float
    disclaimer: str
    manual_override_allowed: bool = True

