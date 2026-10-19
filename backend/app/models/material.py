import uuid
from sqlalchemy import Column, String, Boolean, Numeric, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import GUID, TimestampMixin

class Material(Base, TimestampMixin):
    __tablename__ = "materials"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    unit = Column(String(20), default="kg", nullable=False)
    description = Column(Text, nullable=True)
    benchmark_rate_pkr = Column(Numeric(10, 2), nullable=False)
    tier_a_factor = Column(Numeric(4, 2), default=1.00, nullable=False)
    tier_b_factor = Column(Numeric(4, 2), default=0.90, nullable=False)
    tier_c_factor = Column(Numeric(4, 2), default=0.75, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    price_history = relationship("MaterialPriceHistory", back_populates="material", cascade="all, delete-orphan")

class MaterialPriceHistory(Base, TimestampMixin):
    __tablename__ = "material_price_history"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    material_id = Column(GUID, ForeignKey("materials.id", ondelete="CASCADE"), nullable=False, index=True)
    benchmark_rate_pkr = Column(Numeric(10, 2), nullable=False)
    changed_by_user_id = Column(GUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes = Column(String(255), nullable=True)

    material = relationship("Material", back_populates="price_history")
