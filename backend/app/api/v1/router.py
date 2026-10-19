from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.admin import router as admin_router
from app.api.v1.materials import router as materials_router
from app.api.v1.health import router as health_router
from app.api.v1.pickups import router as pickups_router
from app.api.v1.payments import router as payments_router
from app.api.v1.earnings import router as earnings_router
from app.api.v1.notifications import router as notifications_router

api_v1_router = APIRouter()

api_v1_router.include_router(auth_router)
api_v1_router.include_router(users_router)
api_v1_router.include_router(admin_router)
api_v1_router.include_router(materials_router)
api_v1_router.include_router(health_router)
api_v1_router.include_router(pickups_router)
api_v1_router.include_router(payments_router)
api_v1_router.include_router(earnings_router)
api_v1_router.include_router(notifications_router)
