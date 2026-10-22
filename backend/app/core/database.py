"""Database configuration, connection pooling, and session management for SafaiPay."""
import logging
from typing import AsyncGenerator, Tuple, Optional
from sqlalchemy import text
from sqlalchemy.engine.url import make_url
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool
from app.core.config import settings

logger = logging.getLogger("safaipay.database")

# Build engine arguments based on dialect & runtime environment
engine_kwargs = {
    "echo": False,
    "future": True,
}

connect_args = {}
effective_database_url = settings.DATABASE_URL

if "sqlite" in settings.DATABASE_URL:
    connect_args["check_same_thread"] = False
    engine_kwargs["connect_args"] = connect_args
    engine_kwargs["poolclass"] = NullPool
else:
    # Production / Staging PostgreSQL with asyncpg (Supabase, RDS, etc.)
    parsed_url = make_url(settings.DATABASE_URL)
    query_params = dict(parsed_url.query)
    has_ssl = (
        "ssl" in query_params
        or "sslmode" in query_params
        or settings.DB_SSL_MODE is not None
        or (parsed_url.host and "supabase" in parsed_url.host.lower())
    )

    # Clean query parameters unsupported by asyncpg
    clean_query = {k: v for k, v in query_params.items() if k not in ("sslmode", "ssl")}
    clean_url = parsed_url.set(query=clean_query)
    effective_database_url = str(clean_url)

    # Handle SSL configuration safely based on environment & provider
    if settings.DB_SSL_MODE:
        connect_args["ssl"] = settings.DB_SSL_MODE
    elif has_ssl:
        connect_args["ssl"] = "require"

    # Supabase PgBouncer Transaction Pooler compatibility (Port 6543)
    if (parsed_url.port == 6543) or (parsed_url.host and "pooler.supabase.com" in parsed_url.host.lower()):
        connect_args["statement_cache_size"] = 0

    if connect_args:
        engine_kwargs["connect_args"] = connect_args

    # Check if running in serverless mode or explicit NullPool requested
    if settings.DB_USE_NULL_POOL or settings.SERVERLESS_MODE or settings.DB_POOL_CLASS == "NullPool":
        engine_kwargs["poolclass"] = NullPool
    else:
        # Standard persistent container / server connection pool
        engine_kwargs["pool_size"] = settings.DB_POOL_SIZE
        engine_kwargs["max_overflow"] = settings.DB_MAX_OVERFLOW
        engine_kwargs["pool_timeout"] = settings.DB_POOL_TIMEOUT
        engine_kwargs["pool_recycle"] = settings.DB_POOL_RECYCLE
        engine_kwargs["pool_pre_ping"] = True

engine = create_async_engine(effective_database_url, **engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding an asynchronous SQLAlchemy database session with automatic cleanup."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def get_db_migration_version() -> Optional[str]:
    """Query the alembic_version table to report current migration schema revision."""
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT version_num FROM alembic_version LIMIT 1"))
            row = result.scalar_one_or_none()
            return str(row) if row else None
    except Exception:
        return None

async def check_db_health() -> Tuple[bool, str]:
    """Probe database connectivity by running a lightweight ping query.
    
    In production and staging, hides internal connection strings and database host traces.
    """
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
            return True, "Database connection operational."
    except Exception as e:
        logger.error("Database health check ping failed.")
        if settings.ENVIRONMENT in ("production", "staging"):
            return False, "Database connectivity error."
        return False, f"Database connectivity error: {str(e)}"

async def init_db() -> None:
    """Initialize database tables for local development and test environments with SQLite.
    
    In staging and production environments, automatic schema creation is strictly bypassed
    in favor of versioned Alembic migrations.
    """
    if settings.ENVIRONMENT in ("production", "staging") or "sqlite" not in settings.DATABASE_URL:
        logger.info(f"{settings.ENVIRONMENT} mode / remote database detected: skipping automatic DDL table creation. Use Alembic migrations.")
        return

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
