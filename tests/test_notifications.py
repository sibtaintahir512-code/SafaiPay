import pytest
import uuid
from httpx import AsyncClient
from app.services.notification_service import create_notification
from tests.conftest import TestingSessionLocal

@pytest.mark.asyncio
async def test_notification_flow(client: AsyncClient, customer_token: dict, collector_token: dict):
    # 1. Customer lists notifications (may be empty initially)
    resp = await client.get("/api/v1/notifications", headers=customer_token)
    assert resp.status_code == 200
    initial_notifs = resp.json()
    assert isinstance(initial_notifs, list)

    # 2. Get unread count
    resp = await client.get("/api/v1/notifications/unread-count", headers=customer_token)
    assert resp.status_code == 200
    assert "unread_count" in resp.json()

    # 3. Create a test notification for the customer
    me_resp = await client.get("/api/v1/auth/me", headers=customer_token)
    customer_id = uuid.UUID(me_resp.json()["id"])

    async with TestingSessionLocal() as db:
        notif = await create_notification(
            db=db,
            user_id=customer_id,
            title="Test In-App Alert",
            message="Your pickup was scheduled.",
            notification_type="PICKUP"
        )
        assert notif.id is not None
        notif_id = str(notif.id)

    # Verify unread count incremented
    count_resp = await client.get("/api/v1/notifications/unread-count", headers=customer_token)
    assert count_resp.status_code == 200
    assert count_resp.json()["unread_count"] >= 1

    # Verify collector cannot mark customer's notification as read (isolation test)
    foreign_resp = await client.post(
        f"/api/v1/notifications/{notif_id}/read",
        headers=collector_token
    )
    assert foreign_resp.status_code == 404

    # 4. Customer marks this notification as read
    read_resp = await client.post(
        f"/api/v1/notifications/{notif_id}/read",
        headers=customer_token
    )
    assert read_resp.status_code == 200
    assert read_resp.json()["is_read"] is True

    # 5. Create another notification and test mark-all-read
    async with TestingSessionLocal() as db:
        await create_notification(
            db=db,
            user_id=customer_id,
            title="Second Alert",
            message="Rate update available.",
            notification_type="RATE"
        )

    mark_all = await client.post(
        "/api/v1/notifications/mark-all-read",
        headers=customer_token
    )
    assert mark_all.status_code == 200
    assert mark_all.json()["success"] is True

    # Final unread count should now be 0
    final_count = await client.get("/api/v1/notifications/unread-count", headers=customer_token)
    assert final_count.json()["unread_count"] == 0
