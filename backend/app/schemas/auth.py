from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from app.models.user import RoleEnum
from app.schemas.profiles import (
    CustomerProfileCreate,
    CollectorProfileCreate,
    RecyclerProfileCreate,
    AdminProfileCreate,
)

class UserRegisterRequest(BaseModel):
    phone_number: str = Field(..., pattern=r"^\+92\d{10}$", description="E.164 phone number, e.g. +923001234567")
    full_name: str = Field(..., min_length=2, max_length=150)
    email: Optional[EmailStr] = None
    password: str = Field(..., min_length=8, description="Minimum 8 characters")
    role: RoleEnum = RoleEnum.CUSTOMER

    # Optional role profiles embedded in registration
    customer_profile: Optional[CustomerProfileCreate] = None
    collector_profile: Optional[CollectorProfileCreate] = None
    recycler_profile: Optional[RecyclerProfileCreate] = None
    admin_profile: Optional[AdminProfileCreate] = None

class UserLoginRequest(BaseModel):
    identifier: str = Field(..., description="Phone number (+92...) or registered email address")
    password: str = Field(..., min_length=1)

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int
    user: dict

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class OTPRequest(BaseModel):
    phone_number: str = Field(..., pattern=r"^\+92\d{10}$")

class OTPVerifyRequest(BaseModel):
    phone_number: str = Field(..., pattern=r"^\+92\d{10}$")
    otp_code: str = Field(..., min_length=4, max_length=6)

class OTPResponse(BaseModel):
    success: bool
    message: str
    phone_number: str
    is_verified: bool

class ForgotPasswordRequest(BaseModel):
    identifier: str = Field(..., description="Phone number or registered email address")

class ResetPasswordRequest(BaseModel):
    identifier: str = Field(..., description="Phone number or registered email address")
    otp_code: str = Field(..., min_length=4, max_length=6)
    new_password: str = Field(..., min_length=8, description="Minimum 8 characters with numbers/symbols")

class AuthSuccessResponse(BaseModel):
    success: bool
    message: str

