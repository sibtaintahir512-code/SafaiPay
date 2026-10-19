from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.pickup import Notification
from app.models.user import User
from app.schemas.payment import NotificationResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/notifications", tags=["In-App Notifications"])

@router.get("", response_model=List[NotificationResponse])
async def list_my_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve notifications for the current authenticated user."""
    query = select(Notification).where(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.patch("/{id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark a specific notification as read."""
    query = select(Notification).where(Notification.id == id, Notification.user_id == current_user.id)
    notif = (await db.execute(query)).scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")

    notif.is_read = True
    await db.commit()
    await db.refresh(notif)
    return notif
