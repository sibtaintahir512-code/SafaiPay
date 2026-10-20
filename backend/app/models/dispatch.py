"""Freight dispatch tracking models."""
import uuid
from sqlalchemy import Column, String, Numeric, ForeignKey
from app.core.database import Base
from app.models.base import GUID, TimestampMixin

class DispatchRecord(Base, TimestampMixin):
    __tablename__ = "dispatch_records"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    tracking_number = Column(String(50), unique=True, nullable=False, index=True)
    batch_id = Column(GUID, ForeignKey("material_batches.id", ondelete="SET NULL"), nullable=True)
    carrier_name = Column(String(100), default="Indus Eco-Logistics")
    vehicle_plate = Column(String(30), nullable=False)
    gross_weight_kg = Column(Numeric(12, 2), nullable=True)
    tare_weight_kg = Column(Numeric(12, 2), nullable=True)
    net_weight_kg = Column(Numeric(12, 2), nullable=False)
    status = Column(String(30), default="IN_TRANSIT", nullable=False)

__all__ = ["DispatchRecord"]

