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
    ForgotPasswordRequest,
    ResetPasswordRequest,
    AuthSuccessResponse,
    ChangePasswordRequest,
)
from app.schemas.user import UserResponse, UserWithProfileResponse
from app.services.auth_service import register_new_user, authenticate_user, generate_auth_tokens, change_user_password
from app.services.otp_service import OTPService
from app.api.deps import get_current_user
from app.models.user import User
from app.core.rate_limiter import rate_limit_auth, rate_limit_otp, rate_limit_password_reset

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

@router.post("/login", response_model=TokenResponse, dependencies=[Depends(rate_limit_auth)])
@router.post("/token", response_model=TokenResponse, dependencies=[Depends(rate_limit_auth)])
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

@router.post("/request-otp", response_model=OTPResponse, dependencies=[Depends(rate_limit_otp)])
async def request_otp(payload: OTPRequest):
    """Send a phone verification OTP code. In mock mode, uses sandbox default code."""
    code = OTPService.generate_and_send_otp(payload.phone_number)
    return OTPResponse(
        success=True,
        message="OTP sent successfully to mobile number.",
        phone_number=payload.phone_number,
        is_verified=False
    )

@router.post("/verify-otp", response_model=OTPResponse, dependencies=[Depends(rate_limit_otp)])
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

@router.post("/logout", response_model=AuthSuccessResponse)
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Securely log out the authenticated user and record audit log."""
    from app.services.audit_service import log_audit_event
    client_ip = request.client.host if request.client else None
    await log_audit_event(
        db=db,
        action_name="USER_LOGOUT",
        entity_name="users",
        actor_id=str(current_user.id),
        entity_id=str(current_user.id),
        details="User successfully logged out and session terminated",
        ip_address=client_ip
    )
    return AuthSuccessResponse(
        success=True,
        message="Session successfully terminated."
    )

@router.post("/change-password", response_model=AuthSuccessResponse)
async def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Change authenticated user password after verifying current password."""
    if payload.new_password != payload.confirm_new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and password confirmation do not match."
        )
    client_ip = request.client.host if request.client else None
    await change_user_password(
        db=db,
        user=current_user,
        current_password=payload.current_password,
        new_password=payload.new_password,
        ip_address=client_ip
    )
    return AuthSuccessResponse(
        success=True,
        message="Password has been successfully changed."
    )

@router.post("/forgot-password", response_model=AuthSuccessResponse, dependencies=[Depends(rate_limit_password_reset)])
async def forgot_password(
    payload: ForgotPasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Request password reset. Sends expiring OTP to registered phone/email with generic response to avoid enumeration."""
    from app.services.audit_service import log_audit_event
    client_ip = request.client.host if request.client else None
    
    # Generate and send OTP if user exists
    OTPService.generate_and_send_otp(payload.identifier)

    await log_audit_event(
        db=db,
        action_name="PASSWORD_RESET_REQUEST",
        entity_name="users",
        details=f"Password reset OTP requested for identifier '{payload.identifier}'",
        ip_address=client_ip
    )

    return AuthSuccessResponse(
        success=True,
        message="If an account matches this identifier, password reset instructions have been sent."
    )

@router.post("/reset-password", response_model=AuthSuccessResponse, dependencies=[Depends(rate_limit_password_reset)])
async def reset_password(
    payload: ResetPasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Verify OTP and update user password with secure complexity validation."""
    from app.services.auth_service import reset_user_password
    is_valid = OTPService.verify_otp(payload.identifier, payload.otp_code)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code."
        )

    client_ip = request.client.host if request.client else None
    await reset_user_password(db, payload.identifier, payload.new_password, ip_address=client_ip)

    return AuthSuccessResponse(
        success=True,
        message="Password has been successfully updated. You may now sign in."
    )

@router.get("/me", response_model=UserWithProfileResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve full profile details for the currently authenticated user."""
    return current_user

