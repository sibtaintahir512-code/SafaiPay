from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.user import User
from app.models.profiles import CustomerProfile, CollectorProfile, RecyclerProfile
from app.schemas.user import UserWithProfileResponse
from app.schemas.profiles import (
    CustomerProfileResponse,
    CollectorProfileResponse,
    RecyclerProfileResponse,
)
from app.api.deps import get_current_user, require_roles, check_user_profile_access

router = APIRouter(prefix="/users", tags=["User Profiles & RBAC"])

@router.get("/me", response_model=UserWithProfileResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """Retrieve private profile details for the authenticated user."""
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
