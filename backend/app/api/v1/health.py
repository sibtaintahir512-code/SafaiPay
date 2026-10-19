from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.database import get_db
from app.core.config import settings

router = APIRouter(prefix="/health", tags=["System Health & Diagnostics"])

@router.get("", status_code=status.HTTP_200_OK)
async def system_health():
    """Basic health check endpoint returning system status and metadata."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/db", status_code=status.HTTP_200_OK)
async def database_health(response: Response, db: AsyncSession = Depends(get_db)):
    """Database connectivity health check performing a SELECT 1 query."""
    try:
        await db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

@router.get("/ready", status_code=status.HTTP_200_OK)
async def readiness_check(response: Response, db: AsyncSession = Depends(get_db)):
    """Kubernetes/Container readiness probe."""
    try:
        await db.execute(text("SELECT 1"))
        return {
            "ready": True,
            "components": {
                "api": "UP",
                "database": "UP",
                "redis": "MOCK_READY" if settings.REDIS_MOCK_FALLBACK else "UP"
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "ready": False,
            "components": {
                "api": "UP",
                "database": "DOWN"
            },
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
