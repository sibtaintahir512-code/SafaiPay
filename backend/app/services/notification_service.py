import uuid
from typing import Optional, Dict, Any, List
from enum import Enum
from abc import ABC, abstractmethod
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.pickup import Notification

class NotificationChannel(str, Enum):
    IN_APP = "IN_APP"
    EMAIL = "EMAIL"
    SMS = "SMS"
    WHATSAPP = "WHATSAPP"

class EmailAdapterInterface(ABC):
    @abstractmethod
    async def send_email(self, to_email: str, subject: str, body: str) -> bool:
        pass

class SMSAdapterInterface(ABC):
    @abstractmethod
    async def send_sms(self, to_phone: str, message: str) -> bool:
        pass

class WhatsAppAdapterInterface(ABC):
    @abstractmethod
    async def send_whatsapp(self, to_phone: str, template: str, params: Dict[str, Any]) -> bool:
        pass

class MockEmailAdapter(EmailAdapterInterface):
    async def send_email(self, to_email: str, subject: str, body: str) -> bool:
        # Logging simulated email dispatch for audit
        return True

class MockSMSAdapter(SMSAdapterInterface):
    async def send_sms(self, to_phone: str, message: str) -> bool:
        # Logging simulated SMS dispatch for audit
        return True

class MockWhatsAppAdapter(WhatsAppAdapterInterface):
    async def send_whatsapp(self, to_phone: str, template: str, params: Dict[str, Any]) -> bool:
        # Logging simulated WhatsApp template dispatch
        return True

class NotificationDispatcher:
    email_adapter: EmailAdapterInterface = MockEmailAdapter()
    sms_adapter: SMSAdapterInterface = MockSMSAdapter()
    whatsapp_adapter: WhatsAppAdapterInterface = MockWhatsAppAdapter()

    @classmethod
    async def dispatch(
        cls,
        db: AsyncSession,
        user_id: uuid.UUID,
        title: str,
        message: str,
        notification_type: str = "INFO",
        channels: Optional[List[NotificationChannel]] = None,
        recipient_email: Optional[str] = None,
        recipient_phone: Optional[str] = None,
        related_entity_id: Optional[str] = None
    ) -> Notification:
        # 1. Create In-App record
        notif = Notification(
            id=uuid.uuid4(),
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            related_entity_id=str(related_entity_id) if related_entity_id else None
        )
        db.add(notif)
        await db.commit()
        await db.refresh(notif)

        # 2. Dispatch to external channel adapters if requested
        active_channels = channels or [NotificationChannel.IN_APP]
        if NotificationChannel.EMAIL in active_channels and recipient_email:
            await cls.email_adapter.send_email(recipient_email, title, message)
        if NotificationChannel.SMS in active_channels and recipient_phone:
            await cls.sms_adapter.send_sms(recipient_phone, message)
        if NotificationChannel.WHATSAPP in active_channels and recipient_phone:
            await cls.whatsapp_adapter.send_whatsapp(recipient_phone, "notification_alert", {"title": title, "body": message})

        return notif

async def create_notification(
    db: AsyncSession,
    user_id: uuid.UUID,
    title: str,
    message: str,
    notification_type: str = "INFO",
    related_entity_id: Optional[str] = None
) -> Notification:
    """Create an in-app notification record for a user (backward compatible wrapper)."""
    return await NotificationDispatcher.dispatch(
        db=db,
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        related_entity_id=related_entity_id
    )

__all__ = [
    "create_notification",
    "NotificationDispatcher",
    "NotificationChannel",
    "EmailAdapterInterface",
    "SMSAdapterInterface",
    "WhatsAppAdapterInterface"
]
