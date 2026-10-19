"""Recycler specific routes."""
from fastapi import APIRouter, Depends
from app.api.deps import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/recyclers", tags=["Recyclers"])

@router.get("/me")
async def get_recycler_profile(current_user: User = Depends(get_current_active_user)):
    return {"user": current_user.full_name, "role": "recycler", "verified": True}
