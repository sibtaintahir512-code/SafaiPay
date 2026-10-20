from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from app.models.user import RoleEnum
from app.schemas.profiles import (
    CustomerProfileResponse,
    CollectorProfileResponse,
    RecyclerProfileResponse,
    AdminProfileResponse,
)

class UserBase(BaseModel):
    phone_number: str
    full_name: str
    email: Optional[str] = None
    status: str = "ACTIVE"
    is_active: bool = True
    is_phone_verified: bool = False
    profile_photo_url: Optional[str] = None

class UserProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    profile_photo_url: Optional[str] = None

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    roles: List[str]
    created_at: datetime

    @field_validator("roles", mode="before")
    @classmethod
    def transform_roles(cls, v: Any) -> List[str]:
        if isinstance(v, list):
            return [r.role_name if hasattr(r, "role_name") else str(r) for r in v]
        return v

class UserWithProfileResponse(UserResponse):
    model_config = ConfigDict(from_attributes=True)

    customer_profile: Optional[CustomerProfileResponse] = None
    collector_profile: Optional[CollectorProfileResponse] = None
    recycler_profile: Optional[RecyclerProfileResponse] = None
    admin_profile: Optional[AdminProfileResponse] = None

class RoleAssignRequest(BaseModel):
    role: RoleEnum
