from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.config import settings
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    OTPRequest,
    OTPVerifyRequest,
    OTPResponse,
)
from app.schemas.user import UserResponse, UserWithProfileResponse
from app.services.auth_service import register_new_user, authenticate_user, generate_auth_tokens
from app.services.otp_service import OTPService
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication & Verification"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: UserRegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user with role and profile. Returns JWT access & refresh tokens."""
    client_ip = request.client.host if request.client else None
    user = await register_new_user(db, payload, ip_address=client_ip)
    access_token, refresh_token = generate_auth_tokens(user)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="Bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user={
            "id": str(user.id),
            "phone_number": user.phone_number,
            "full_name": user.full_name,
            "email": user.email,
            "roles": user.role_names,
            "is_phone_verified": user.is_phone_verified,
        }
    )

@router.post("/login", response_model=TokenResponse)
async def login(
    payload: UserLoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate with phone number or email and password. Returns JWT tokens."""
    client_ip = request.client.host if request.client else None
    user = await authenticate_user(db, payload.identifier, payload.password, ip_address=client_ip)
    access_token, refresh_token = generate_auth_tokens(user)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="Bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user={
            "id": str(user.id),
            "phone_number": user.phone_number,
            "full_name": user.full_name,
            "email": user.email,
            "roles": user.role_names,
            "is_phone_verified": user.is_phone_verified,
        }
    )

@router.post("/request-otp", response_model=OTPResponse)
async def request_otp(payload: OTPRequest):
    """Send a phone verification OTP code. In mock mode, uses sandbox default code."""
    code = OTPService.generate_and_send_otp(payload.phone_number)
    return OTPResponse(
        success=True,
        message="OTP sent successfully to mobile number.",
        phone_number=payload.phone_number,
        is_verified=False
    )

@router.post("/verify-otp", response_model=OTPResponse)
async def verify_otp(
    payload: OTPVerifyRequest,
    db: AsyncSession = Depends(get_db)
):
    """Verify submitted phone verification OTP code."""
    is_valid = OTPService.verify_otp(payload.phone_number, payload.otp_code)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code."
        )

    return OTPResponse(
        success=True,
        message="Phone number successfully verified.",
        phone_number=payload.phone_number,
        is_verified=True
    )

@router.get("/me", response_model=UserWithProfileResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve full profile details for the currently authenticated user."""
    return current_user
