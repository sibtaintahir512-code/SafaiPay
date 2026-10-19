from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditLog

async def log_audit_event(
    db: AsyncSession,
    action_name: str,
    entity_name: str,
    actor_id: Optional[str] = None,
    entity_id: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None
) -> AuditLog:
    """Record an immutable security or administrative audit event."""
    audit_entry = AuditLog(
        actor_id=actor_id,
        action_name=action_name,
        entity_name=entity_name,
        entity_id=str(entity_id) if entity_id else None,
        details=details,
        ip_address=ip_address
    )
    db.add(audit_entry)
    await db.commit()
    await db.refresh(audit_entry)
    return audit_entry
