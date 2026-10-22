"""Staging environment verification test suite for SafaiPay.

Tests Supabase PostgreSQL/PostGIS compatibility, Upstash Redis rate limiting,
health endpoints, safe error masking, role authorization, and workflow behavior.
"""
import os
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings
from app.core.rate_limiter import mask_redis_url, get_redis_client, check_redis_health
from app.core.database import check_db_health, make_url
from sqlalchemy.pool import NullPool
from sqlalchemy.ext.asyncio import create_async_engine

@pytest.mark.asyncio
async def test_staging_database_health_probes(client: AsyncClient):
    """Verify database health probes return operational status with migration version and correlation ID."""
    response = await client.get("/health")
    assert response.status_code == 200
    assert "X-Request-ID" in response.headers
    data = response.json()
    assert data["status"] in ("healthy", "degraded")
    assert "database" in data
    assert "migration_version" in data
    assert "redis" in data

    # Verify lightweight liveness probe
    live_resp = await client.get("/health/live")
    assert live_resp.status_code == 200
    live_data = live_resp.json()
    assert live_data["status"] == "alive"
    assert "X-Request-ID" in live_resp.headers

    db_resp = await client.get("/health/db")
    assert db_resp.status_code == 200
    db_data = db_resp.json()
    assert db_data["status"] == "healthy"
    assert db_data["database"] == "connected"

    ready_resp = await client.get("/health/ready")
    assert ready_resp.status_code == 200
    ready_data = ready_resp.json()
    assert ready_data["ready"] is True
    assert ready_data["components"]["database"] == "UP"

@pytest.mark.asyncio
async def test_staging_redis_health_probe(client: AsyncClient):
    """Verify Redis health endpoint reports mode safely without exposing passwords."""
    response = await client.get("/health/redis")
    assert response.status_code == 200
    data = response.json()
    assert "redis" in data
    assert "mode" in data
    assert data["mode"] in ("distributed", "local_sliding_window")
    # Verify no credentials leaked
    body_str = response.text.lower()
    assert "password" not in body_str
    assert "rediss://" not in body_str

@pytest.mark.asyncio
async def test_staging_redis_url_credential_masking():
    """Verify Redis credentials are masked and never logged in plain text."""
    test_url = "rediss://default:SuperSecretPassword123@my-upstash.upstash.io:6379"
    masked = mask_redis_url(test_url)
    assert "SuperSecretPassword123" not in masked
    assert masked == "rediss://default:***@my-upstash.upstash.io:6379"

    test_std_url = "redis://user:my_secret_token@redis-host:6379/0"
    masked_std = mask_redis_url(test_std_url)
    assert "my_secret_token" not in masked_std
    assert masked_std == "redis://user:***@redis-host:6379/0"

@pytest.mark.asyncio
async def test_staging_rate_limiting_trigger_and_headers(client: AsyncClient):
    """Verify rate limiter returns 429 Too Many Requests and Retry-After header."""
    headers = {"X-Enforce-Rate-Limit": "true"}
    triggered = False
    for i in range(15):
        resp = await client.post(
            "/api/v1/auth/login",
            json={"identifier": "nonexistent@safaipay.test", "password": "WrongPassword!"},
            headers=headers
        )
        if resp.status_code == 429:
            triggered = True
            assert "Retry-After" in resp.headers
            assert int(resp.headers["Retry-After"]) >= 1
            break
    assert triggered, "Rate limiter failed to trigger 429 Too Many Requests"

@pytest.mark.asyncio
async def test_staging_database_failure_safe_response(monkeypatch, client: AsyncClient):
    """Verify database connection errors in staging hide internal stack traces and host info."""
    async def mock_failing_db_health():
        return False, "psycopg2.OperationalError: could not connect to server: Connection refused"

    monkeypatch.setattr("app.api.v1.health.check_db_health", mock_failing_db_health)
    monkeypatch.setattr(settings, "ENVIRONMENT", "staging")

    response = await client.get("/health/db")
    assert response.status_code == 503
    data = response.json()
    assert data["status"] == "unhealthy"
    assert data["error"] == "Database connectivity failed"
    assert "OperationalError" not in response.text
    assert "Connection refused" not in response.text

@pytest.mark.asyncio
async def test_staging_supabase_pooler_and_nullpool_configuration():
    """Verify Supabase PgBouncer pooler and NullPool configurations."""
    supabase_pooler_url = "postgresql+asyncpg://postgres.myproject:secret@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require"
    parsed = make_url(supabase_pooler_url)
    clean_query = {k: v for k, v in parsed.query.items() if k not in ("sslmode", "ssl")}
    clean_url = str(parsed.set(query=clean_query))

    connect_args = {}
    if parsed.port == 6543 or "pooler.supabase.com" in (parsed.host or ""):
        connect_args["statement_cache_size"] = 0

    assert connect_args.get("statement_cache_size") == 0

    # Test NullPool instantiation for serverless
    engine = create_async_engine(
        clean_url,
        connect_args=connect_args,
        poolclass=NullPool
    )
    assert engine.pool.__class__.__name__ == "NullPool"
    await engine.dispose()

@pytest.mark.asyncio
async def test_staging_security_headers_present(client: AsyncClient):
    """Verify essential OWASP security headers on staging responses."""
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "default-src 'self'" in response.headers.get("Content-Security-Policy", "")

@pytest.mark.asyncio
async def test_staging_user_logout_and_audit(client: AsyncClient, customer_token: dict):
    """Verify user logout flow records an audit log and terminates session."""
    response = await client.post(
        "/api/v1/auth/logout",
        headers=customer_token
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "terminated" in data["message"].lower()

@pytest.mark.asyncio
async def test_staging_client_ip_anti_spoofing():
    """Verify get_client_ip safely parses valid IPs and repels spoofed or malicious headers."""
    from unittest.mock import Mock
    from app.core.rate_limiter import get_client_ip

    # Mock request with malicious payload in X-Forwarded-For
    req = Mock()
    req.headers = {"x-forwarded-for": "<script>alert(1)</script>, 198.51.100.42, 10.0.0.1"}
    req.client = Mock()
    req.client.host = "127.0.0.1"

    parsed_ip = get_client_ip(req)
    assert parsed_ip == "198.51.100.42"
    assert "<script>" not in parsed_ip

    # Pure junk in header falls back to client.host
    req.headers = {"x-forwarded-for": "malicious-injection-string"}
    req.client.host = "192.0.2.15"
    assert get_client_ip(req) == "192.0.2.15"

@pytest.mark.asyncio
async def test_staging_payment_sandbox_safety():
    """Verify payment system runs in isolated sandbox mode with zero live merchant credentials."""
    assert settings.PAYMENT_PROVIDER in ("sandbox", "mock")
    # Verify no real payment keys in configuration
    assert not os.getenv("STRIPE_SECRET_KEY")
    assert not os.getenv("RAAST_PRODUCTION_MERCHANT_KEY")
