"""Recyclable material batch models."""
import uuid
from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime
from app.core.database import Base
from app.models.base import GUID, TimestampMixin

class MaterialBatch(Base, TimestampMixin):
    __tablename__ = "material_batches"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    batch_code = Column(String(50), unique=True, nullable=False, index=True)
    material_code = Column(String(50), nullable=False)
    net_weight_kg = Column(Numeric(12, 2), nullable=False)
    purity_percentage = Column(Numeric(5, 2), default=99.00)
    status = Column(String(30), default="AVAILABLE", nullable=False)
    hub_location = Column(String(200), default="Korangi Hub, Karachi")
    procured_by_user_id = Column(GUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    procured_at = Column(DateTime(timezone=True), nullable=True)

__all__ = ["MaterialBatch"]

