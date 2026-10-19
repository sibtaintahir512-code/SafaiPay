"""Fraud alert models."""
import uuid
from sqlalchemy import Column, String, Numeric, ForeignKey, Text
from app.core.database import Base
from app.models.base import GUID, TimestampMixin

class FraudAlert(Base, TimestampMixin):
    __tablename__ = "fraud_alerts"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    pickup_id = Column(GUID, ForeignKey("pickups.id", ondelete="SET NULL"), nullable=True)
    alert_type = Column(String(50), nullable=False)  # WEIGHT_VARIANCE, DUPLICATE_PHOTO, GPS_DEVIATION
    severity = Column(String(20), default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    description = Column(Text, nullable=False)
    status = Column(String(30), default="ACTIVE")  # ACTIVE, RESOLVED, DISMISSED

__all__ = ["FraudAlert"]
