import uuid
from enum import Enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, Numeric, Float, ForeignKey, Text, DateTime, Integer
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import GUID, TimestampMixin

class PickupStatus(str, Enum):
    REQUESTED = "requested"
    ASSIGNED = "assigned"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    WEIGHT_VERIFIED = "weight_verified"
    CUSTOMER_CONFIRMED = "customer_confirmed"
    PAYMENT_PENDING = "payment_pending"
    PAYMENT_COMPLETED = "payment_completed"
    INVENTORY_READY = "inventory_ready"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    DISPUTED = "disputed"
    PAYMENT_FAILED = "payment_failed"

class ImageType(str, Enum):
    CUSTOMER_UPLOAD = "customer_upload"
    BEFORE_PICKUP = "before_pickup"
    AFTER_PICKUP = "after_pickup"
    SCALE_DISPLAY = "scale_display"

class PickupRequest(Base, TimestampMixin):
    __tablename__ = "pickup_requests"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    tracking_number = Column(String(32), unique=True, nullable=False, index=True)
    customer_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_collector_id = Column(GUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    material_code = Column(String(50), nullable=False)  # PET_PLASTIC, CARDBOARD_OCC
    estimated_quantity_kg = Column(Float, nullable=False)
    street_address = Column(String(500), nullable=False)
    city = Column(String(100), default="Karachi", nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    preferred_time = Column(DateTime, nullable=False)
    notes = Column(Text, nullable=True)
    status = Column(String(30), default=PickupStatus.REQUESTED.value, nullable=False, index=True)
    cancellation_reason = Column(Text, nullable=True)
    
    # Relationships
    customer = relationship("User", foreign_keys=[customer_id], backref="customer_pickups")
    assigned_collector = relationship("User", foreign_keys=[assigned_collector_id], backref="collector_pickups")
    assignments = relationship("PickupAssignment", back_populates="pickup", cascade="all, delete-orphan", order_by="desc(PickupAssignment.created_at)", lazy="selectin")
    images = relationship("WasteImage", back_populates="pickup", cascade="all, delete-orphan", lazy="selectin")
    verifications = relationship("PickupVerification", back_populates="pickup", cascade="all, delete-orphan", lazy="selectin")
    weight_records = relationship("WeightRecord", back_populates="pickup", cascade="all, delete-orphan", lazy="selectin")
    pricing_calculations = relationship("PricingCalculation", back_populates="pickup", cascade="all, delete-orphan", lazy="selectin")
    payments = relationship("Payment", back_populates="pickup", cascade="all, delete-orphan", lazy="selectin")
    disputes = relationship("Dispute", back_populates="pickup", cascade="all, delete-orphan", lazy="selectin")
    ratings = relationship("Rating", back_populates="pickup", cascade="all, delete-orphan", lazy="selectin")

class PickupAssignment(Base, TimestampMixin):
    __tablename__ = "pickup_assignments"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    pickup_id = Column(GUID, ForeignKey("pickup_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    collector_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_by = Column(GUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(20), default="PENDING", nullable=False)  # PENDING, ACCEPTED, REJECTED
    rejection_reason = Column(Text, nullable=True)

    pickup = relationship("PickupRequest", back_populates="assignments")
    collector = relationship("User", foreign_keys=[collector_id])

class WasteImage(Base, TimestampMixin):
    __tablename__ = "waste_images"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    pickup_id = Column(GUID, ForeignKey("pickup_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    uploaded_by_user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    image_type = Column(String(30), nullable=False)  # customer_upload, before_pickup, after_pickup, scale_display
    image_url = Column(String(500), nullable=False)
    caption = Column(String(255), nullable=True)

    pickup = relationship("PickupRequest", back_populates="images")

class PickupVerification(Base, TimestampMixin):
    __tablename__ = "pickup_verifications"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    pickup_id = Column(GUID, ForeignKey("pickup_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    collector_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    gps_latitude = Column(Float, nullable=False)
    gps_longitude = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)

    pickup = relationship("PickupRequest", back_populates="verifications")

class WeightRecord(Base, TimestampMixin):
    __tablename__ = "weight_records"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    pickup_id = Column(GUID, ForeignKey("pickup_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    recorded_by_user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    material_code = Column(String(50), nullable=False)
    verified_weight_kg = Column(Float, nullable=False)
    scale_display_verified = Column(Boolean, default=True, nullable=False)
    notes = Column(Text, nullable=True)

    pickup = relationship("PickupRequest", back_populates="weight_records")

class Rating(Base, TimestampMixin):
    __tablename__ = "ratings"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    pickup_id = Column(GUID, ForeignKey("pickup_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    rater_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rated_user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    score = Column(Integer, nullable=False)  # 1 to 5
    review_text = Column(Text, nullable=True)

    pickup = relationship("PickupRequest", back_populates="ratings")

class Dispute(Base, TimestampMixin):
    __tablename__ = "disputes"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    pickup_id = Column(GUID, ForeignKey("pickup_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    raised_by_user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reason_category = Column(String(50), nullable=False)  # WEIGHT_MISMATCH, QUALITY_DEDUCTION, NO_SHOW, PRICING_DISAGREEMENT
    description = Column(Text, nullable=False)
    status = Column(String(20), default="OPEN", nullable=False)  # OPEN, UNDER_REVIEW, RESOLVED, DISMISSED
    resolution_notes = Column(Text, nullable=True)
    resolved_by_admin_id = Column(GUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    pickup = relationship("PickupRequest", back_populates="disputes")

class Notification(Base, TimestampMixin):
    __tablename__ = "notifications"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="INFO", nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    related_entity_id = Column(String(100), nullable=True)
