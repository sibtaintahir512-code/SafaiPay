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

@pytest.mark.asyncio
async def test_authenticated_logout(client):
    """Verify authenticated user can log out and invalidate session."""
    login_res = await client.post("/api/v1/auth/login", json={
        "identifier": "+923009990001",
        "password": "Password12345!"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    logout_res = await client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert logout_res.status_code == 200
    assert logout_res.json()["success"] is True

@pytest.mark.asyncio
async def test_brute_force_account_lockout(client):
    """Verify 5 consecutive failed login attempts trigger 429 lockout."""
    target_id = "+923008887776"
    # Register user first
    reg = await client.post("/api/v1/auth/register", json={
        "phone_number": target_id,
        "full_name": "Lockout Test User",
        "email": "lockout@karachi.pk",
        "password": "ValidPassword123!",
        "role": "CUSTOMER"
    })
    assert reg.status_code == 201

    # Attempt 5 wrong logins
    for i in range(5):
        fail_res = await client.post("/api/v1/auth/login", json={
            "identifier": target_id,
            "password": "WrongPassword!"
        })
        assert fail_res.status_code == 401

    # 6th attempt must trigger 429 Too Many Requests
    lockout_res = await client.post("/api/v1/auth/login", json={
        "identifier": target_id,
        "password": "ValidPassword123!"
    })
    assert lockout_res.status_code == 429
    assert "temporarily locked" in lockout_res.json()["detail"]

@pytest.mark.asyncio
async def test_forgot_and_reset_password(client):
    """Verify forgot-password OTP request and subsequent password reset."""
    user_id = "+923007776665"
    reg = await client.post("/api/v1/auth/register", json={
        "phone_number": user_id,
        "full_name": "Reset Test User",
        "email": "reset@karachi.pk",
        "password": "OldPassword123!",
        "role": "CUSTOMER"
    })
    assert reg.status_code == 201

    # 1. Forgot password
    forgot_res = await client.post("/api/v1/auth/forgot-password", json={
        "identifier": user_id
    })
    assert forgot_res.status_code == 200
    assert forgot_res.json()["success"] is True

    # 2. Reset password with OTP
    reset_res = await client.post("/api/v1/auth/reset-password", json={
        "identifier": user_id,
        "otp_code": "123456",
        "new_password": "BrandNewPassword123!"
    })
    assert reset_res.status_code == 200
    assert reset_res.json()["success"] is True

    # 3. Login with new password
    new_login = await client.post("/api/v1/auth/login", json={
        "identifier": user_id,
        "password": "BrandNewPassword123!"
    })
    assert new_login.status_code == 200
    assert "access_token" in new_login.json()

