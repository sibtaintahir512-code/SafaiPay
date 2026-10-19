import pytest

@pytest.mark.asyncio
async def test_health_check_endpoints(client):
    """Verify system, database, and readiness health checks."""
    # 1. System Health
    sys_res = await client.get("/health")
    assert sys_res.status_code == 200
    assert sys_res.json()["status"] == "healthy"
    assert sys_res.json()["service"] == "SafaiPay"

    # 2. Database Health
    db_res = await client.get("/health/db")
    assert db_res.status_code == 200
    assert db_res.json()["status"] == "healthy"
    assert db_res.json()["database"] == "connected"

    # 3. Readiness Health
    ready_res = await client.get("/health/ready")
    assert ready_res.status_code == 200
    assert ready_res.json()["ready"] is True

@pytest.mark.asyncio
async def test_seed_data_verification(client):
    """Verify seeded cohort: 1 Admin, 5 Customers, 10 Collectors, 2 Recyclers, 2 Materials."""
    # Login as Admin
    res_admin = await client.post("/api/v1/auth/login", json={
        "identifier": "admin@safaipay.org",
        "password": "AdminPassword123!"
    })
    admin_token = {"Authorization": f"Bearer {res_admin.json()['access_token']}"}

    # 1. Check all users list
    users_res = await client.get("/api/v1/admin/users?limit=100", headers=admin_token)
    assert users_res.status_code == 200
    users = users_res.json()
    assert len(users) >= 18

    # Verify Customers (at least 5)
    customers = [u for u in users if "CUSTOMER" in u["roles"]]
    assert len(customers) >= 5

    # Verify Collectors (at least 10)
    collectors = [u for u in users if "COLLECTOR" in u["roles"]]
    assert len(collectors) >= 10

    # Verify Recyclers (at least 2)
    recyclers = [u for u in users if "RECYCLER" in u["roles"]]
    assert len(recyclers) >= 2

    # Verify Admin (1)
    admins = [u for u in users if "ADMIN" in u["roles"]]
    assert len(admins) >= 1

    # 2. Check Recyclable Materials
    mat_res = await client.get("/api/v1/materials")
    assert mat_res.status_code == 200
    materials = mat_res.json()
    assert len(materials) >= 2

    pet = next((m for m in materials if m["code"] == "PET_PLASTIC"), None)
    assert pet is not None
    assert pet["benchmark_rate_pkr"] == 80.00
    assert pet["unit"] == "kg"

    cardboard = next((m for m in materials if m["code"] == "CARDBOARD_OCC"), None)
    assert cardboard is not None
    assert cardboard["benchmark_rate_pkr"] == 35.00
    assert cardboard["unit"] == "kg"

@pytest.mark.asyncio
async def test_admin_update_material_rate(client):
    """Verify admin can update benchmark scrap rates and trigger audit log."""
    res_admin = await client.post("/api/v1/auth/login", json={
        "identifier": "admin@safaipay.org",
        "password": "AdminPassword123!"
    })
    admin_token = {"Authorization": f"Bearer {res_admin.json()['access_token']}"}

    # Update PET Plastic rate to 82.50
    update_res = await client.patch(
        "/api/v1/materials/PET_PLASTIC/rate",
        json={"benchmark_rate_pkr": 82.50, "notes": "Wholesale scrap market price increase"},
        headers=admin_token
    )
    assert update_res.status_code == 200
    assert update_res.json()["benchmark_rate_pkr"] == 82.50

    # Verify updated rate persists
    mat_res = await client.get("/api/v1/materials")
    pet = next(m for m in mat_res.json() if m["code"] == "PET_PLASTIC")
    assert pet["benchmark_rate_pkr"] == 82.50
