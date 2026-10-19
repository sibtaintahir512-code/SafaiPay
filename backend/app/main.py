from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.api.v1.router import api_v1_router
from app.api.v1.health import router as root_health_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist
    await init_db()
    yield
    # Shutdown logic if any

app = FastAPI(
    title="SafaiPay Core Backend API",
    description="""
# SafaiPay Phase 2 Foundation API
Circular economy waste collection & digital financial identity platform for informal waste workers.

## Key Capabilities:
- **Authentication & Authorization:** Phone OTP ready, bcrypt password hashing, JWT with embedded role claims.
- **Role-Based Access Control (RBAC):** Customer, Collector, Recycler, Admin.
- **Material Catalog & Scrap Pricing:** Daily benchmark rates for PET Plastic and Cardboard.
- **Security & Auditing:** Immutable audit logs, strict privacy boundaries.
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# CORS Middleware
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 Router
app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)

# Direct root-level health router for container orchestrators
app.include_router(root_health_router)

@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to SafaiPay Core API Foundation",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "openapi_url": "/openapi.json",
        "version": "1.0.0",
        "status": "OPERATIONAL"
    }
