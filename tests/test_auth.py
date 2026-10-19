import pytest
from app.core.security import get_password_hash, verify_password

@pytest.mark.asyncio
async def test_password_hashing_verification():
    """Verify password hashing creates secure bcrypt hashes and verifies correctly."""
    pwd = "SecurePassword123!"
    hashed = get_password_hash(pwd)
    
    assert hashed != pwd
    assert hashed.startswith("$2b$") or hashed.startswith("$2a$")
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False

@pytest.mark.asyncio
async def test_successful_registration(client):
    """Verify new user registration with role profile returns 201 and JWT tokens."""
    payload = {
        "phone_number": "+923009990001",
        "full_name": "Test Society Karachi",
        "email": "test.society@karachi.pk",
        "password": "Password12345!",
        "role": "CUSTOMER",
        "customer_profile": {
            "entity_type": "HOUSING_SOCIETY",
            "organization_name": "Test Society",
            "street_address": "Clifton Block 2, Karachi"
        }
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["phone_number"] == "+923009990001"
    assert "CUSTOMER" in data["user"]["roles"]

@pytest.mark.asyncio
async def test_duplicate_phone_rejection(client):
    """Verify duplicate phone registration is rejected with 409 Conflict."""
    payload = {
        "phone_number": "+923009990001",  # Already registered in previous test
        "full_name": "Duplicate User",
        "email": "diff.email@karachi.pk",
        "password": "Password12345!",
        "role": "CUSTOMER"
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]

@pytest.mark.asyncio
async def test_duplicate_email_rejection(client):
    """Verify duplicate email registration is rejected with 409 Conflict."""
    payload = {
        "phone_number": "+923009990002",
        "full_name": "Duplicate Email User",
        "email": "test.society@karachi.pk",  # Already registered
        "password": "Password12345!",
        "role": "CUSTOMER"
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]

@pytest.mark.asyncio
async def test_successful_login_with_phone(client):
    """Verify login with registered phone and password."""
    payload = {
        "identifier": "+923009990001",
        "password": "Password12345!"
    }
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "Bearer"
    assert data["user"]["phone_number"] == "+923009990001"

@pytest.mark.asyncio
async def test_successful_login_with_email(client):
    """Verify login with registered email and password."""
    payload = {
        "identifier": "test.society@karachi.pk",
        "password": "Password12345!"
    }
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data

@pytest.mark.asyncio
async def test_invalid_login_rejection_wrong_password(client):
    """Verify invalid password returns 401 Unauthorized."""
    payload = {
        "identifier": "+923009990001",
        "password": "CompletelyWrongPassword!"
    }
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    assert "Invalid credentials" in response.json()["detail"]

@pytest.mark.asyncio
async def test_invalid_login_rejection_non_existent_user(client):
    """Verify non-existent user returns 401 Unauthorized."""
    payload = {
        "identifier": "+923009999999",
        "password": "AnyPassword123!"
    }
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    assert "Invalid credentials" in response.json()["detail"]

@pytest.mark.asyncio
async def test_otp_request_and_verification(client):
    """Verify phone verification OTP request and validation flow."""
    # 1. Request OTP
    req_res = await client.post("/api/v1/auth/request-otp", json={"phone_number": "+923009990001"})
    assert req_res.status_code == 200
    assert req_res.json()["success"] is True

    # 2. Verify with correct mock code
    verify_res = await client.post("/api/v1/auth/verify-otp", json={
        "phone_number": "+923009990001",
        "otp_code": "123456"
    })
    assert verify_res.status_code == 200
    assert verify_res.json()["is_verified"] is True

    # 3. Verify with wrong code
    wrong_res = await client.post("/api/v1/auth/verify-otp", json={
        "phone_number": "+923009990001",
        "otp_code": "000000"
    })
    assert wrong_res.status_code == 400
