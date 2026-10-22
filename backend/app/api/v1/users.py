from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.user import User
from app.models.profiles import CustomerProfile, CollectorProfile, RecyclerProfile
from app.schemas.user import UserWithProfileResponse, UserProfileUpdateRequest
from app.schemas.profiles import (
    CustomerProfileResponse,
    CollectorProfileResponse,
    RecyclerProfileResponse,
)
from app.api.deps import get_current_user, require_roles, check_user_profile_access
from app.services.ai_service import AIService
from app.core.security import sanitize_filename
from app.core.rate_limiter import rate_limit_file_upload

router = APIRouter(prefix="/users", tags=["User Profiles & RBAC"])

@router.get("/me", response_model=UserWithProfileResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """Retrieve private profile details for the authenticated user."""
    return current_user

@router.put("/me", response_model=UserWithProfileResponse)
async def update_my_profile(
    payload: UserProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update profile full_name, email, and/or profile photo URL."""
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.email is not None:
        current_user.email = payload.email
    if payload.profile_photo_url is not None:
        current_user.profile_photo_url = payload.profile_photo_url

    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.post("/me/photo", response_model=UserWithProfileResponse, dependencies=[Depends(rate_limit_file_upload)])
async def upload_my_profile_photo(
    file: UploadFile = File(..., description="Profile photo (JPEG, PNG, WebP, max 5MB)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload user profile photo with strict MIME and size validation."""
    file_bytes = await file.read()
    filename = sanitize_filename(file.filename, default="avatar.jpg")
    mime_type = file.content_type or "image/jpeg"

    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum allowed limit of 5MB."
        )

    try:
        AIService.validate_image_file(file_bytes, filename, mime_type)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    image_hash = AIService.compute_sha256(file_bytes)
    current_user.profile_photo_url = f"/uploads/profiles/{image_hash[:16]}_{filename}"

    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.get("/{user_id}/profile", response_model=UserWithProfileResponse)
async def get_user_profile_by_id(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve private profile by ID.
    Enforces Security Rule: A user may access only their own private profile unless authorized as ADMIN.
    """
    check_user_profile_access(user_id, current_user)

    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' does not exist."
        )

    return user

@router.get("/role/collector-portal", response_model=CollectorProfileResponse)
async def get_collector_portal(
    current_user: User = Depends(require_roles(["COLLECTOR"]))
):
    """Collector-only protected route."""
    if not current_user.collector_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collector profile not found."
        )
    return current_user.collector_profile

@router.get("/role/customer-portal", response_model=CustomerProfileResponse)
async def get_customer_portal(
    current_user: User = Depends(require_roles(["CUSTOMER"]))
):
    """Customer-only protected route."""
    if not current_user.customer_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer profile not found."
        )
    return current_user.customer_profile

@router.get("/role/recycler-portal", response_model=RecyclerProfileResponse)
async def get_recycler_portal(
    current_user: User = Depends(require_roles(["RECYCLER"]))
):
    """Recycler-only protected route."""
    if not current_user.recycler_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recycler profile not found."
        )
    return current_user.recycler_profile
