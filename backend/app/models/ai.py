"""AI Classification & Model Governance Models."""
import uuid
from sqlalchemy import Column, String, Float, Boolean, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import GUID, TimestampMixin

class AIModelVersion(Base, TimestampMixin):
    __tablename__ = "ai_model_versions"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    version_name = Column(String(50), unique=True, nullable=False, index=True)
    architecture = Column(String(100), default="MobileNetV3-Small-FineTuned")
    classes = Column(String(500), default='["PET plastic", "cardboard", "other/unknown"]')
    description = Column(String(500), default="Demo classifier for recyclable waste pre-screening")
    accuracy = Column(Float, default=0.912)
    precision = Column(Float, default=0.905)
    recall = Column(Float, default=0.898)
    f1_score = Column(Float, default=0.901)
    is_active = Column(Boolean, default=True, nullable=False)

class AIPrediction(Base, TimestampMixin):
    __tablename__ = "ai_predictions"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    pickup_id = Column(GUID, ForeignKey("pickup_requests.id", ondelete="SET NULL"), nullable=True, index=True)
    image_url = Column(String(500), nullable=True)
    image_hash = Column(String(64), nullable=True)
    file_name = Column(String(255), nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)
    predicted_material = Column(String(100), nullable=False)
    confidence = Column(Float, nullable=False)
    requires_manual_verification = Column(Boolean, default=False, nullable=False)
    status = Column(String(50), default="PREDICTED", nullable=False)  # PREDICTED, VERIFIED, CORRECTED, FLAGGED
    verified_material = Column(String(100), nullable=True)
    verified_by_user_id = Column(GUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    verification_notes = Column(String(500), nullable=True)
    is_corrected = Column(Boolean, default=False, nullable=False)
    corrected_by_user_id = Column(GUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    model_version = Column(String(50), default="demo-v1", nullable=False)

__all__ = ["AIModelVersion", "AIPrediction"]
