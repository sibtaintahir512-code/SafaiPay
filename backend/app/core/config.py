import os
from typing import List, Union, Optional
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "SafaiPay"
    ENVIRONMENT: str = "development"
    APP_ENV: Optional[str] = None
    LOG_LEVEL: str = "INFO"
    API_V1_PREFIX: str = "/api/v1"

    # Security & Tokens
    SECRET_KEY: str = "safai-pay-phase-2-foundation-insecure-dev-secret-key-32-bytes-long"
    ALGORITHM: str = "HS256"
    JWT_ALGORITHM: Optional[str] = None
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = f"sqlite+aiosqlite:///{os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'safaipay.db'))}"
    SYNC_DATABASE_URL: Optional[str] = None

    # Connection Pooling
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800
    DB_SSL_MODE: Optional[str] = None
    SERVERLESS_MODE: bool = False
    DB_POOL_CLASS: Optional[str] = None
    DB_USE_NULL_POOL: bool = False

    # Redis Cache & Queues
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_MOCK_FALLBACK: bool = True
    REDIS_FALLBACK_MODE: str = "warning"  # Options: 'warning', 'fallback', 'fail_closed'

    # External Service Provider Adapters
    STORAGE_PROVIDER: str = "local"
    MAPS_PROVIDER: str = "osm"
    AI_PROVIDER: str = "mock"
    PAYMENT_PROVIDER: str = "mock"
    EMAIL_PROVIDER: str = "mock"
    SMS_PROVIDER: str = "mock"
    WHATSAPP_PROVIDER: str = "mock"

    # Standard Demo Test Accounts
    DEMO_CUSTOMER_EMAIL: str = "customer@safaipay.test"
    DEMO_CUSTOMER_PASSWORD: str = "SafaiPassword123!"
    DEMO_COLLECTOR_EMAIL: str = "collector@safaipay.test"
    DEMO_COLLECTOR_PASSWORD: str = "SafaiPassword123!"
    DEMO_RECYCLER_EMAIL: str = "recycler@safaipay.test"
    DEMO_RECYCLER_PASSWORD: str = "SafaiPassword123!"
    DEMO_ADMIN_EMAIL: str = "admin@safaipay.test"
    DEMO_ADMIN_PASSWORD: str = "AdminPassword123!"

    # Phone / SMS / OTP
    OTP_MOCK_MODE: bool = True
    OTP_DEFAULT_CODE: str = "123456"
    OTP_EXPIRATION_SECONDS: int = 300

    # CORS
    CORS_ORIGINS: Union[str, List[str]] = ["*"]

    @field_validator("ENVIRONMENT", mode="before")
    def sync_environment(cls, v: str) -> str:
        return os.getenv("APP_ENV", v)

    @field_validator("ALGORITHM", mode="before")
    def sync_algorithm(cls, v: str) -> str:
        return os.getenv("JWT_ALGORITHM", v)

    @field_validator("DATABASE_URL", mode="before")
    def normalize_database_url(cls, v: str) -> str:
        if not v:
            return v
        val = str(v).strip()
        if val.startswith("postgres://"):
            val = "postgresql+asyncpg://" + val[len("postgres://"):]
        elif val.startswith("postgresql://") and not val.startswith("postgresql+"):
            val = "postgresql+asyncpg://" + val[len("postgresql://"):]
        elif val.startswith("sqlite:///") and not val.startswith("sqlite+"):
            val = "sqlite+aiosqlite:///" + val[len("sqlite:///"):]
        return val

    @field_validator("SYNC_DATABASE_URL", mode="before")
    def compute_sync_database_url(cls, v: Optional[str], info) -> str:
        db_url = info.data.get("DATABASE_URL", "")
        if db_url:
            if db_url.startswith("postgresql+asyncpg://"):
                return "postgresql://" + db_url[len("postgresql+asyncpg://"):]
            if db_url.startswith("sqlite+aiosqlite:///"):
                return "sqlite:///" + db_url[len("sqlite+aiosqlite:///"):]
        if v:
            val = str(v).strip()
            if val.startswith("postgresql+asyncpg://"):
                return "postgresql://" + val[len("postgresql+asyncpg://"):]
            if val.startswith("sqlite+aiosqlite:///"):
                return "sqlite:///" + val[len("sqlite+aiosqlite:///"):]
            return val
        return "sqlite:///./safaipay.db"

    @field_validator("SECRET_KEY")
    def validate_secret_key(cls, v: str, info) -> str:
        env = info.data.get("APP_ENV") or info.data.get("ENVIRONMENT", "development")
        if env == "production" and ("insecure-dev" in v or len(v) < 32):
            raise ValueError("SECRET_KEY must be configured with a strong secret (at least 32 characters) in production!")
        return v

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Superadmin Defaults for Seed
    DEFAULT_ADMIN_EMAIL: str = "admin@safaipay.org"
    DEFAULT_ADMIN_PHONE: str = "+923000000000"
    DEFAULT_ADMIN_PASSWORD: str = "AdminPassword123!"
    DEFAULT_DEMO_PASSWORD: str = "SafaiPassword123!"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
