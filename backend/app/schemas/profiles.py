from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

# Customer Profile Schemas
class CustomerProfileBase(BaseModel):
    entity_type: str = Field(default="COMMERCIAL_OFFICE", description="COMMERCIAL_OFFICE, HOUSING_SOCIETY, or HOUSEHOLD")
    organization_name: Optional[str] = None
    street_address: str
    city: str = "Karachi"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    contact_person: Optional[str] = None

class CustomerProfileCreate(CustomerProfileBase):
    pass

class CustomerProfileResponse(CustomerProfileBase):
    model_config = ConfigDict(from_attributes=True)
    user_id: str

# Collector Profile Schemas
class CollectorProfileBase(BaseModel):
    cnic_number: str = Field(..., pattern=r"^\d{5}-\d{7}-\d{1}$", description="Pakistani CNIC in format XXXXX-XXXXXXX-X")
    vehicle_type: str = Field(default="MOTOR_TRICYCLE", description="HAND_CART, MOTOR_TRICYCLE, or PICKUP_TRUCK")
    digital_scale_id: Optional[str] = None
    is_online: bool = False
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None

class CollectorProfileCreate(CollectorProfileBase):
    pass

class CollectorProfileResponse(CollectorProfileBase):
    model_config = ConfigDict(from_attributes=True)
    user_id: str
    kyc_status: str
    rating_average: float
    total_pickups_completed: float

# Recycler Profile Schemas
class RecyclerProfileBase(BaseModel):
    company_name: str
    ntn_number: str = Field(..., description="National Tax Number")
    factory_address: str
    city: str = "Karachi"
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class RecyclerProfileCreate(RecyclerProfileBase):
    pass

class RecyclerProfileResponse(RecyclerProfileBase):
    model_config = ConfigDict(from_attributes=True)
    user_id: str
    verification_status: str

# Admin Profile Schemas
class AdminProfileBase(BaseModel):
    department: str = "Platform Operations"
    employee_id: Optional[str] = None
    permissions_level: str = "SUPERADMIN"

class AdminProfileCreate(AdminProfileBase):
    pass

class AdminProfileResponse(AdminProfileBase):
    model_config = ConfigDict(from_attributes=True)
    user_id: str
