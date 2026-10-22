"""Recycler specific routes."""
from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/recyclers", tags=["Recyclers"])

@router.get("/me")
async def get_recycler_profile(current_user: User = Depends(get_current_user)):
    return {
        "user_id": str(current_user.id),
        "user": current_user.full_name,
        "phone_number": current_user.phone_number,
        "role": "recycler",
        "verified": True,
        "status": "active" if current_user.is_active else "inactive"
    }
