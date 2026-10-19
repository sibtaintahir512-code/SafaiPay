import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.pickup import Notification

async def create_notification(
    db: AsyncSession,
    user_id: uuid.UUID,
    title: str,
    message: str,
    notification_type: str = "INFO",
    related_entity_id: Optional[str] = None
) -> Notification:
    """Create an in-app notification record for a user."""
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
    return notif
