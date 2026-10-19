import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "SafaiPay"
    ENVIRONMENT: str = "development"
    API_V1_PREFIX: str = "/api/v1"

    # Security & Tokens
    SECRET_KEY: str = "safai-pay-phase-2-foundation-insecure-dev-secret-key-32-bytes-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = f"sqlite+aiosqlite:///{os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'safaipay.db'))}"
    SYNC_DATABASE_URL: str = f"sqlite:///{os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'safaipay.db'))}"

    # Redis Cache & Queues
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_MOCK_FALLBACK: bool = True

    # Phone / SMS / OTP
    OTP_MOCK_MODE: bool = True
    OTP_DEFAULT_CODE: str = "123456"
    OTP_EXPIRATION_SECONDS: int = 300

    # CORS
    CORS_ORIGINS: Union[str, List[str]] = ["*"]

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
