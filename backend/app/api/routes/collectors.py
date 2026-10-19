"""Collector specific routes."""
from fastapi import APIRouter, Depends
from app.api.deps import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/collectors", tags=["Collectors"])

@router.get("/me")
async def get_collector_profile(current_user: User = Depends(get_current_active_user)):
    return {"user": current_user.full_name, "role": "collector", "status": "active"}
