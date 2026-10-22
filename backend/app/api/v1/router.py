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
from app.api.v1.batches import router as batches_router
from app.api.v1.dispatch import router as dispatch_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.ai import router as ai_router
from app.api.v1.marketplace import router as marketplace_router
from app.api.v1.inventory import router as inventory_router
from app.api.v1.pricing import router as pricing_router
from app.api.v1.collectors import router as collectors_router
from app.api.v1.customers import router as customers_router
from app.api.v1.recyclers import router as recyclers_router
from app.api.v1.reports import router as reports_router
from app.api.v1.fraud import router as fraud_router

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
api_v1_router.include_router(batches_router)
api_v1_router.include_router(dispatch_router)
api_v1_router.include_router(analytics_router)
api_v1_router.include_router(ai_router)
api_v1_router.include_router(marketplace_router)
api_v1_router.include_router(inventory_router)
api_v1_router.include_router(pricing_router)
api_v1_router.include_router(collectors_router)
api_v1_router.include_router(customers_router)
api_v1_router.include_router(recyclers_router)
api_v1_router.include_router(reports_router)
api_v1_router.include_router(fraud_router)


