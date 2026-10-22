import time
import uuid
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db, check_db_health, engine
from app.api.v1.router import api_v1_router
from app.api.v1.health import router as root_health_router

logger = logging.getLogger("safaipay.core")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Verify database readiness on startup
    is_healthy, db_msg = await check_db_health()
    if is_healthy:
        logger.info(f"Database readiness verified: {db_msg}")
    else:
        logger.warning(f"Database connection warning on startup: {db_msg}")

    # In local development or testing with SQLite, ensure baseline tables exist
    if settings.ENVIRONMENT not in ("production", "staging") and "sqlite" in settings.DATABASE_URL:
        await init_db()
    yield
    # Graceful shutdown: release connection pool
    await engine.dispose()

app = FastAPI(
    title="SafaiPay Core Backend API",
    description="""
# SafaiPay Enterprise Circular Economy Platform API
Circular economy waste collection & digital financial identity platform for informal waste workers.
    """,
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
    openapi_url="/openapi.json" if settings.ENVIRONMENT != "production" else None,
    lifespan=lifespan
)

# 1. Request Correlation ID & Performance Monitoring Middleware
@app.middleware("http")
async def correlation_id_middleware(request: Request, call_next):
    correlation_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    request.state.correlation_id = correlation_id
    start_time = time.time()

    response: Response = await call_next(request)
    duration_ms = round((time.time() - start_time) * 1000, 2)
    response.headers["X-Request-ID"] = correlation_id

    # Structured observability trace
    client_ip = request.client.host if request.client else "127.0.0.1"
    logger.info(
        f"[{correlation_id}] {request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms) [client={client_ip}]"
    )
    return response

# 2. Security Headers Middleware (OWASP Secure Configuration)
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "img-src 'self' data: https:; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline'; "
        "frame-ancestors 'none';"
    )
    if settings.ENVIRONMENT == "production" or request.url.scheme == "https":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    return response

# 3. CORS Security Configuration
configured_origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [
    o.strip() for o in settings.CORS_ORIGINS.split(",")
]
# Forbid wildcard when credentials are allowed in production
if "*" in configured_origins and settings.ENVIRONMENT == "production":
    configured_origins = ["https://safaipay.vercel.app"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=configured_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Length", "Retry-After", "X-Request-ID"],
)

# 4. Global Exception Handler: Prevent Sensitive Information Leakage in Production
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    correlation_id = getattr(request.state, "correlation_id", "unknown")
    logger.error(f"[{correlation_id}] Unhandled exception on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    if settings.ENVIRONMENT in ("production", "staging"):
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "An internal error occurred. Please contact SafaiPay support.", "request_id": correlation_id},
            headers={"X-Request-ID": correlation_id}
        )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Internal Server Error: {str(exc)}", "request_id": correlation_id},
        headers={"X-Request-ID": correlation_id}
    )

# Include API v1 Router
app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)

# Direct root-level health router for container orchestrators
app.include_router(root_health_router)

@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to SafaiPay Core API Foundation",
        "docs_url": "/docs" if settings.ENVIRONMENT != "production" else "Disabled in production",
        "version": "1.0.0",
        "status": "OPERATIONAL"
    }
