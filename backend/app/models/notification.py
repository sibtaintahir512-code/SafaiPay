"""Notification models."""
import uuid
from sqlalchemy import Column, String, Boolean, ForeignKey, Text
from app.core.database import Base
from app.models.base import GUID, TimestampMixin

class Notification(Base, TimestampMixin):
    __tablename__ = "notifications"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    channel = Column(String(20), default="IN_APP")  # SMS, PUSH, IN_APP
    is_read = Column(Boolean, default=False, nullable=False)

__all__ = ["Notification"]
