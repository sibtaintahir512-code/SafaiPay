"""Customer specific routes."""
from fastapi import APIRouter, Depends
from app.api.deps import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("/me")
async def get_customer_profile(current_user: User = Depends(get_current_active_user)):
    return {"user": current_user.full_name, "role": "customer", "verified": current_user.is_phone_verified}
