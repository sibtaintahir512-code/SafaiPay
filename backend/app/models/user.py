import uuid
from enum import Enum
from sqlalchemy import Column, String, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import GUID, TimestampMixin

class RoleEnum(str, Enum):
    CUSTOMER = "CUSTOMER"
    COLLECTOR = "COLLECTOR"
    RECYCLER = "RECYCLER"
    ADMIN = "ADMIN"

class UserRole(Base, TimestampMixin):
    __tablename__ = "user_roles"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role_name = Column(String(50), ForeignKey("roles.name", ondelete="CASCADE"), nullable=False, index=True)

class Role(Base):
    __tablename__ = "roles"

    name = Column(String(50), primary_key=True)
    description = Column(String(255), nullable=True)

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    phone_number = Column(String(20), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=True, index=True)
    full_name = Column(String(150), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    status = Column(String(30), default="ACTIVE", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_phone_verified = Column(Boolean, default=False, nullable=False)

    # Relationships
    roles = relationship("UserRole", backref="user", cascade="all, delete-orphan", lazy="selectin")
    customer_profile = relationship("CustomerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan", lazy="selectin")
    collector_profile = relationship("CollectorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan", lazy="selectin")
    recycler_profile = relationship("RecyclerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan", lazy="selectin")
    admin_profile = relationship("AdminProfile", back_populates="user", uselist=False, cascade="all, delete-orphan", lazy="selectin")

    @property
    def role_names(self) -> list[str]:
        return [r.role_name for r in self.roles] if self.roles else []
