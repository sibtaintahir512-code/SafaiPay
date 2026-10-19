from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    actor_id: Optional[str] = None
    action_name: str
    entity_name: str
    entity_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime
