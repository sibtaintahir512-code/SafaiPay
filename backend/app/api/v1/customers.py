"""Customer specific routes."""
from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("/me")
async def get_customer_profile(current_user: User = Depends(get_current_user)):
    return {
        "user_id": str(current_user.id),
        "user": current_user.full_name,
        "phone_number": current_user.phone_number,
        "role": "customer",
        "verified": current_user.is_phone_verified,
        "status": "active" if current_user.is_active else "inactive"
    }
