"""System health, diagnostics, and container readiness probes."""
from datetime import datetime, timezone
from fastapi import APIRouter, status, Response

from app.core.database import check_db_health, get_db_migration_version
from app.core.rate_limiter import check_redis_health
from app.core.config import settings

router = APIRouter(prefix="/health", tags=["System Health & Diagnostics"])

@router.get("", status_code=status.HTTP_200_OK)
async def system_health(response: Response):
    """Basic health check endpoint returning system status, metadata, database and redis state."""
    db_ok, db_msg = await check_db_health()
    redis_ok, redis_msg = check_redis_health()
    version = await get_db_migration_version()
    
    if not db_ok:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": "healthy" if db_ok else "degraded",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "database": "connected" if db_ok else "disconnected",
        "redis": "connected" if redis_ok else "fallback_in_memory",
        "migration_version": version,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/live", status_code=status.HTTP_200_OK)
async def liveness_probe():
    """Kubernetes & Render liveness probe verifying HTTP event loop responsiveness."""
    return {
        "status": "alive",
        "service": settings.PROJECT_NAME,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/db", status_code=status.HTTP_200_OK)
async def database_health(response: Response):
    """Database connectivity health check performing a lightweight query."""
    db_ok, db_msg = await check_db_health()
    version = await get_db_migration_version()
    if not db_ok:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": "Database connectivity failed" if settings.ENVIRONMENT in ("production", "staging") else db_msg,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    return {
        "status": "healthy",
        "database": "connected",
        "message": db_msg,
        "migration_version": version,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/redis", status_code=status.HTTP_200_OK)
async def redis_health(response: Response):
    """Redis distributed rate-limiter health check."""
    redis_ok, redis_msg = check_redis_health()
    if not redis_ok and settings.ENVIRONMENT == "production" and getattr(settings, "REDIS_FALLBACK_MODE", "warning") == "fail_closed":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "unhealthy",
            "redis": "disconnected",
            "error": "Redis rate limiter unavailable",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    return {
        "status": "healthy" if redis_ok else "degraded",
        "redis": "connected" if redis_ok else "fallback_in_memory",
        "mode": "distributed" if redis_ok else "local_sliding_window",
        "message": redis_msg,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/ready", status_code=status.HTTP_200_OK)
async def readiness_check(response: Response):
    """Kubernetes/Container readiness probe."""
    db_ok, db_msg = await check_db_health()
    redis_ok, _ = check_redis_health()
    version = await get_db_migration_version()
    if not db_ok:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "ready": False,
            "components": {
                "api": "UP",
                "database": "DOWN",
                "redis": "UP" if redis_ok else "FALLBACK_READY"
            },
            "error": "Database connectivity failed" if settings.ENVIRONMENT in ("production", "staging") else db_msg,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    return {
        "ready": True,
        "components": {
            "api": "UP",
            "database": "UP",
            "redis": "UP" if redis_ok else "FALLBACK_READY"
        },
        "migration_version": version,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
