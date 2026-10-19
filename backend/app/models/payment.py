import uuid
from enum import Enum
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, Boolean, Numeric, Float, ForeignKey, Text, DateTime, Integer, Date
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import GUID, TimestampMixin

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    DISPUTED = "disputed"

class PricingCalculation(Base, TimestampMixin):
    __tablename__ = "pricing_calculations"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    pickup_id = Column(GUID, ForeignKey("pickup_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    material_code = Column(String(50), nullable=False)
    verified_weight_kg = Column(Float, nullable=False)
    material_rate_applied = Column(Numeric(10, 2), nullable=False)
    quality_factor = Column(Float, nullable=False)  # Must be between 0.0 and 1.0
    total_price = Column(Numeric(12, 2), nullable=False)
    calculation_breakdown = Column(Text, nullable=False)  # JSON string or human-readable formula
    is_estimated = Column(Boolean, default=False, nullable=False)

    pickup = relationship("PickupRequest", back_populates="pricing_calculations")

class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    pickup_id = Column(GUID, ForeignKey("pickup_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_reference = Column(String(64), unique=True, nullable=False, index=True)
    payer_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    payee_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount_pkr = Column(Numeric(12, 2), nullable=False)
    status = Column(String(30), default=PaymentStatus.PENDING.value, nullable=False, index=True)
    failure_reason = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    pickup = relationship("PickupRequest", back_populates="payments")
    collector_earning = relationship("CollectorEarning", back_populates="payment", uselist=False, cascade="all, delete-orphan")

class CollectorEarning(Base, TimestampMixin):
    __tablename__ = "collector_earnings"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    collector_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    pickup_id = Column(GUID, ForeignKey("pickup_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    payment_id = Column(GUID, ForeignKey("payments.id", ondelete="CASCADE"), nullable=False, unique=True)
    gross_amount_pkr = Column(Numeric(12, 2), nullable=False)
    net_earnings_pkr = Column(Numeric(12, 2), nullable=False)
    earned_date = Column(Date, default=lambda: datetime.now(timezone.utc).date(), nullable=False, index=True)

    payment = relationship("Payment", back_populates="collector_earning")
    collector = relationship("User", foreign_keys=[collector_id])
    pickup = relationship("PickupRequest")
