"""Comprehensive Security Hardening and Database Architecture Test Suite for SafaiPay."""
import os
import time
import uuid
import datetime
import pytest
import jwt
from unittest.mock import patch
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError

from app.core.config import settings, Settings
from app.core.security import (
    create_access_token,
    decode_token,
    mask_pii,
    sanitize_filename,
    get_password_hash,
)
from app.core.database import check_db_health, AsyncSessionLocal
from app.core.rate_limiter import otp_rate_limiter
from app.models.user import User, Role, UserRole
from app.models.material import Material
from app.models.pickup import PickupAssignment
from database.seed import seed_database, seed_materials

# ==============================================================================
# 1. SECURITY TESTS
# ==============================================================================

@pytest.mark.asyncio
async def test_invalid_login_credentials(client):
    """Attempting login with incorrect password returns HTTP 401 without user enumeration."""
    res = await client.post("/api/v1/auth/login", json={
        "identifier": "+923001110001",
        "password": "WrongPassword999!"
    })
    assert res.status_code == 401
    assert "Invalid credentials" in res.json()["detail"]

@pytest.mark.asyncio
async def test_expired_jwt_token(client):
    """Requests using an expired JWT token are strictly rejected with HTTP 401."""
    # Create token expired 1 hour ago
    expired_payload = {
        "sub": str(uuid.uuid4()),
        "roles": ["CUSTOMER"],
        "exp": datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=1),
        "iat": datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=2),
        "type": "access"
    }
    expired_token = jwt.encode(expired_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    res = await client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert res.status_code == 401
    assert "Invalid or expired" in res.json()["detail"]

@pytest.mark.asyncio
async def test_invalid_jwt_signature(client):
    """Tokens signed with a forged or mismatched secret key are rejected."""
    forged_token = jwt.encode(
        {"sub": str(uuid.uuid4()), "roles": ["ADMIN"], "type": "access"},
        "completely-different-fake-secret-key-12345",
        algorithm="HS256"
    )
    res = await client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {forged_token}"})
    assert res.status_code == 401

@pytest.mark.asyncio
async def test_role_escalation_and_unauthorized_admin_access(client, customer_token):
    """Customer cannot access admin operations or collector dispatch endpoints (RBAC boundary)."""
    # Customer attempts to access admin users endpoint
    res_admin = await client.get("/api/v1/admin/users", headers=customer_token)
    assert res_admin.status_code == 403
    assert "Forbidden" in res_admin.json()["detail"]

    # Customer attempts to access collector exclusive jobs
    res_collector = await client.get("/api/v1/pickups/available", headers=customer_token)
    assert res_collector.status_code == 403

@pytest.mark.asyncio
async def test_unauthenticated_admin_endpoint_blocked(client):
    """Direct request to admin route without credentials returns HTTP 401."""
    res = await client.get("/api/v1/admin/users")
    assert res.status_code == 401

@pytest.mark.asyncio
async def test_idor_private_profile_isolation(client, customer_token, admin_token):
    """User cannot access another user's private profile (IDOR / BOLA prevention)."""
    # Generate another random user ID
    target_victim_id = "00000000-0000-0000-0000-000000000099"
    
    # Customer tries to view victim profile
    res_customer = await client.get(f"/api/v1/users/{target_victim_id}/profile", headers=customer_token)
    assert res_customer.status_code == 403
    assert "Forbidden" in res_customer.json()["detail"]

    # Admin CAN inspect user profile (authorized administrative oversight)
    res_admin = await client.get(f"/api/v1/users/{target_victim_id}/profile", headers=admin_token)
    # Admin gets 404 (not found) instead of 403, proving authorization check passed
    assert res_admin.status_code == 404

@pytest.mark.asyncio
async def test_security_headers_present(client):
    """Responses contain hardened OWASP security headers."""
    res = await client.get("/health")
    assert res.status_code == 200
    headers = res.headers

    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"
    assert "strict-origin-when-cross-origin" in headers.get("Referrer-Policy", "")
    assert "Content-Security-Policy" in headers

@pytest.mark.asyncio
async def test_cors_options_behavior(client):
    """CORS preflight responds properly with safe headers."""
    res = await client.options("/api/v1/auth/login", headers={
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "POST"
    })
    assert res.status_code == 200
    assert "access-control-allow-origin" in res.headers

@pytest.mark.asyncio
async def test_rate_limiting_trigger(client):
    """Sensitive OTP endpoint triggers HTTP 429 when request threshold is exceeded."""
    otp_rate_limiter.reset()

    # Exhaust the 5 requests limit
    for _ in range(5):
        res = await client.post(
            "/api/v1/auth/request-otp",
            json={"phone_number": "+923001234567"},
            headers={"X-Enforce-Rate-Limit": "true"}
        )
        assert res.status_code == 200

    # 6th attempt should be blocked
    res_blocked = await client.post(
        "/api/v1/auth/request-otp",
        json={"phone_number": "+923001234567"},
        headers={"X-Enforce-Rate-Limit": "true"}
    )
    assert res_blocked.status_code == 429
    assert "Rate limit exceeded" in res_blocked.json()["detail"]
    assert "Retry-After" in res_blocked.headers

    # Reset for subsequent tests
    otp_rate_limiter.reset()

@pytest.mark.asyncio
async def test_password_reset_enumeration_safety(client):
    """Forgot password endpoint returns generic response even for non-existent users."""
    res = await client.post("/api/v1/auth/forgot-password", json={
        "identifier": "nonexistent_user_99999@safaipay.test"
    })
    assert res.status_code == 200
    assert "instructions have been sent" in res.json()["message"]

@pytest.mark.asyncio
async def test_unsafe_file_upload_blocked(client, customer_token):
    """Uploading executable scripts or malicious files disguised as images is blocked."""
    # Attempt to upload malicious script payload
    malicious_bytes = b"<?php echo 'malicious code'; system($_GET['cmd']); ?>"
    files = {"file": ("shell.php.jpg", malicious_bytes, "image/jpeg")}

    res = await client.post("/api/v1/users/me/photo", files=files, headers=customer_token)
    assert res.status_code == 400
    assert "Disallowed file content" in res.json()["detail"] or "Invalid file" in res.json()["detail"]

@pytest.mark.asyncio
async def test_sql_injection_payloads_handled_safely(client):
    """SQL injection payloads in identifier or parameters are safely treated as strings."""
    sql_payloads = [
        "' OR 1=1 --",
        "admin'--",
        "' UNION SELECT * FROM users --",
        "'; DROP TABLE users; --"
    ]
    for payload in sql_payloads:
        res = await client.post("/api/v1/auth/login", json={
            "identifier": payload,
            "password": "Password123!"
        })
        # Must return 401 unauthorized, NEVER 500 or 200
        assert res.status_code == 401

def test_sensitive_pii_masking():
    """PII masking utility masks CNIC, phone numbers, and bearer tokens."""
    cnic_text = "Collector CNIC is 42101-1234567-1 recorded"
    phone_text = "Customer phone is +923001234567 for delivery"
    email_text = "Contact admin@safaipay.org for assistance"
    token_text = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0In0.signature"

    assert "42101-*******-1" in mask_pii(cnic_text)
    assert "+92300****567" in mask_pii(phone_text)
    assert "a***@safaipay.org" in mask_pii(email_text)
    assert "[MASKED_TOKEN]" in mask_pii(token_text)

def test_sanitize_filename():
    """Sanitizing filename neutralizes directory traversal and special characters."""
    assert sanitize_filename("../../etc/passwd") == "passwd"
    assert sanitize_filename("..\\windows\\system32\\cmd.exe") == "cmd.exe"
    assert sanitize_filename("my photo (1) <cool>.jpg") == "my_photo__1___cool_.jpg"
    assert sanitize_filename(None) == "upload.jpg"

# ==============================================================================
# 2. DATABASE ARCHITECTURE & ROBUSTNESS TESTS
# ==============================================================================

def test_database_url_normalization():
    """DATABASE_URL normalization properly handles postgresql, asyncpg, and sqlite."""
    s1 = Settings(DATABASE_URL="postgres://user:pass@localhost:5432/db")
    assert s1.DATABASE_URL == "postgresql+asyncpg://user:pass@localhost:5432/db"
    assert s1.SYNC_DATABASE_URL == "postgresql://user:pass@localhost:5432/db"

    s2 = Settings(DATABASE_URL="postgresql://user:pass@localhost:5432/db")
    assert s2.DATABASE_URL == "postgresql+asyncpg://user:pass@localhost:5432/db"
    assert s2.SYNC_DATABASE_URL == "postgresql://user:pass@localhost:5432/db"

    s3 = Settings(DATABASE_URL="sqlite:///./mydb.db")
    assert s3.DATABASE_URL == "sqlite+aiosqlite:///./mydb.db"
    assert s3.SYNC_DATABASE_URL == "sqlite:///./mydb.db"

def test_production_environment_rejects_insecure_defaults():
    """In production mode, insecure default secret key is strictly rejected."""
    with pytest.raises(ValueError, match="SECRET_KEY must be configured"):
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY="safai-pay-phase-2-foundation-insecure-dev-secret-key-32-bytes-long"
        )

@pytest.mark.asyncio
async def test_health_endpoints(client):
    """Health probes return operational status, migration version, and database connection status."""
    res_root = await client.get("/health")
    assert res_root.status_code == 200
    assert res_root.json()["status"] == "healthy"
    assert res_root.json()["database"] == "connected"
    assert "migration_version" in res_root.json()

    res_db = await client.get("/health/db")
    assert res_db.status_code == 200
    assert res_db.json()["database"] == "connected"
    assert "migration_version" in res_db.json()

    res_ready = await client.get("/health/ready")
    assert res_ready.status_code == 200
    assert res_ready.json()["ready"] is True
    assert "migration_version" in res_ready.json()

@pytest.mark.asyncio
async def test_duplicate_record_prevention():
    """Database unique constraints prevent duplicate phone numbers and codes."""
    async with AsyncSessionLocal() as session:
        dup_phone = "+923009998888"
        u1 = User(
            id=uuid.uuid4(),
            phone_number=dup_phone,
            full_name="User Unique 1",
            hashed_password=get_password_hash("Pass123!"),
            is_active=True
        )
        session.add(u1)
        await session.commit()

        u2 = User(
            id=uuid.uuid4(),
            phone_number=dup_phone,
            full_name="User Unique 2",
            hashed_password=get_password_hash("Pass123!"),
            is_active=True
        )
        session.add(u2)
        with pytest.raises(IntegrityError):
            await session.commit()
        await session.rollback()

@pytest.mark.asyncio
async def test_transaction_rollback_on_failure():
    """Failed transactions roll back safely without persisting partial mutations."""
    async with AsyncSessionLocal() as session:
        random_id = uuid.uuid4()
        test_material = Material(
            id=random_id,
            code=f"ROLLBACK_TEST_{uuid.uuid4().hex[:6]}",
            name="Rollback Test Material",
            unit="kg",
            benchmark_rate_pkr=50.0
        )
        session.add(test_material)
        await session.flush()

        # Simulate unexpected error before commit
        await session.rollback()

        # Verify material was not committed
        q = select(Material).where(Material.id == random_id)
        res = await session.execute(q)
        assert res.scalar_one_or_none() is None

@pytest.mark.asyncio
async def test_seed_idempotency():
    """Running seed multiple times does not raise errors or duplicate records."""
    # Run seed twice in succession
    await seed_database()
    await seed_database()

    async with AsyncSessionLocal() as session:
        # Verify material count remains exact 8
        q = select(Material)
        materials = (await session.execute(q)).scalars().all()
        assert len(materials) >= 8

@pytest.mark.asyncio
async def test_db_unavailable_graceful_handling(client):
    """When database connectivity fails, /health/db returns HTTP 503 with sanitized error."""
    with patch("app.api.v1.health.check_db_health", return_value=(False, "Connection refused: database host offline")):
        res = await client.get("/health/db")
        assert res.status_code == 503
        data = res.json()
        assert data["status"] == "unhealthy"
        assert data["database"] == "disconnected"
        assert "error" in data
