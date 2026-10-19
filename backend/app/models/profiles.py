import uuid
from sqlalchemy import Column, String, Boolean, Numeric, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import GUID, TimestampMixin

class CustomerProfile(Base, TimestampMixin):
    __tablename__ = "customer_profiles"

    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    entity_type = Column(String(50), nullable=False, default="COMMERCIAL_OFFICE")  # COMMERCIAL_OFFICE, HOUSING_SOCIETY, HOUSEHOLD
    organization_name = Column(String(200), nullable=True)
    street_address = Column(String(500), nullable=False)
    city = Column(String(100), default="Karachi", nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    contact_person = Column(String(150), nullable=True)

    user = relationship("User", back_populates="customer_profile")

class CollectorProfile(Base, TimestampMixin):
    __tablename__ = "collector_profiles"

    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    cnic_number = Column(String(15), unique=True, nullable=False, index=True)
    vehicle_type = Column(String(50), nullable=False, default="MOTOR_TRICYCLE")  # HAND_CART, MOTOR_TRICYCLE, PICKUP_TRUCK
    kyc_status = Column(String(30), nullable=False, default="SUBMITTED")  # SUBMITTED, VERIFIED, REJECTED
    digital_scale_id = Column(String(50), nullable=True)
    is_online = Column(Boolean, default=False, nullable=False)
    current_latitude = Column(Float, nullable=True)
    current_longitude = Column(Float, nullable=True)
    rating_average = Column(Numeric(3, 2), default=5.00, nullable=False)
    total_pickups_completed = Column(Numeric(10, 0), default=0, nullable=False)

    user = relationship("User", back_populates="collector_profile")

class RecyclerProfile(Base, TimestampMixin):
    __tablename__ = "recycler_profiles"

    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    company_name = Column(String(200), nullable=False)
    ntn_number = Column(String(30), unique=True, nullable=False, index=True)
    factory_address = Column(String(500), nullable=False)
    city = Column(String(100), default="Karachi", nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    verification_status = Column(String(30), default="VERIFIED", nullable=False)

    user = relationship("User", back_populates="recycler_profile")

class AdminProfile(Base, TimestampMixin):
    __tablename__ = "admin_profiles"

    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    department = Column(String(100), default="Platform Operations", nullable=False)
    employee_id = Column(String(50), unique=True, nullable=True)
    permissions_level = Column(String(50), default="SUPERADMIN", nullable=False)

    user = relationship("User", back_populates="admin_profile")
