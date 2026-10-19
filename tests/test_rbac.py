import pytest

@pytest.mark.asyncio
async def test_role_based_access_checks(client):
    """Verify role-based route protection across Customer, Collector, Recycler."""
    # 1. Login as seeded Collector
    res_coll = await client.post("/api/v1/auth/login", json={
        "identifier": "+923002220001",
        "password": "SafaiPassword123!"
    })
    assert res_coll.status_code == 200
    coll_token = {"Authorization": f"Bearer {res_coll.json()['access_token']}"}

    # 2. Login as seeded Customer
    res_cust = await client.post("/api/v1/auth/login", json={
        "identifier": "+923001110001",
        "password": "SafaiPassword123!"
    })
    assert res_cust.status_code == 200
    cust_token = {"Authorization": f"Bearer {res_cust.json()['access_token']}"}

    # 3. Collector portal access
    coll_ok = await client.get("/api/v1/users/role/collector-portal", headers=coll_token)
    assert coll_ok.status_code == 200
    assert coll_ok.json()["cnic_number"] == "42101-1000001-1"

    # 4. Customer attempting to access collector portal -> 403 Forbidden
    cust_blocked = await client.get("/api/v1/users/role/collector-portal", headers=cust_token)
    assert cust_blocked.status_code == 403
    assert "Forbidden" in cust_blocked.json()["detail"]

    # 5. Customer portal access
    cust_ok = await client.get("/api/v1/users/role/customer-portal", headers=cust_token)
    assert cust_ok.status_code == 200
    assert cust_ok.json()["entity_type"] == "HOUSING_SOCIETY"

    # 6. Collector attempting to access customer portal -> 403 Forbidden
    coll_blocked = await client.get("/api/v1/users/role/customer-portal", headers=coll_token)
    assert coll_blocked.status_code == 403

@pytest.mark.asyncio
async def test_admin_only_endpoint_protection(client):
    """Verify admin endpoints are strictly protected from non-admin roles."""
    # Login as Customer
    res_cust = await client.post("/api/v1/auth/login", json={
        "identifier": "+923001110001",
        "password": "SafaiPassword123!"
    })
    cust_token = {"Authorization": f"Bearer {res_cust.json()['access_token']}"}

    # Login as Superadmin
    res_admin = await client.post("/api/v1/auth/login", json={
        "identifier": "admin@safaipay.org",
        "password": "AdminPassword123!"
    })
    assert res_admin.status_code == 200
    admin_token = {"Authorization": f"Bearer {res_admin.json()['access_token']}"}

    # Customer accessing /admin/users -> 403 Forbidden
    cust_admin_blocked = await client.get("/api/v1/admin/users", headers=cust_token)
    assert cust_admin_blocked.status_code == 403

    # Customer accessing /admin/audit-logs -> 403 Forbidden
    cust_audit_blocked = await client.get("/api/v1/admin/audit-logs", headers=cust_token)
    assert cust_audit_blocked.status_code == 403

    # Admin accessing /admin/users -> 200 OK
    admin_users_ok = await client.get("/api/v1/admin/users", headers=admin_token)
    assert admin_users_ok.status_code == 200
    assert len(admin_users_ok.json()) >= 18  # 1 admin + 5 customers + 10 collectors + 2 recyclers

    # Admin accessing /admin/audit-logs -> 200 OK
    admin_audit_ok = await client.get("/api/v1/admin/audit-logs", headers=admin_token)
    assert admin_audit_ok.status_code == 200
    assert len(admin_audit_ok.json()) >= 1

@pytest.mark.asyncio
async def test_private_profile_access_rule(client):
    """Verify security rule: A user may access only their own private profile unless authorized by role."""
    # Customer 1 (+923001110001)
    res_c1 = await client.post("/api/v1/auth/login", json={
        "identifier": "+923001110001",
        "password": "SafaiPassword123!"
    })
    c1_id = res_c1.json()["user"]["id"]
    c1_token = {"Authorization": f"Bearer {res_c1.json()['access_token']}"}

    # Customer 2 (+923001110002)
    res_c2 = await client.post("/api/v1/auth/login", json={
        "identifier": "+923001110002",
        "password": "SafaiPassword123!"
    })
    c2_id = res_c2.json()["user"]["id"]
    c2_token = {"Authorization": f"Bearer {res_c2.json()['access_token']}"}

    # Admin (+923000000000)
    res_adm = await client.post("/api/v1/auth/login", json={
        "identifier": "admin@safaipay.org",
        "password": "AdminPassword123!"
    })
    adm_token = {"Authorization": f"Bearer {res_adm.json()['access_token']}"}

    # Customer 1 accesses own profile -> 200 OK
    own_res = await client.get(f"/api/v1/users/{c1_id}/profile", headers=c1_token)
    assert own_res.status_code == 200
    assert own_res.json()["phone_number"] == "+923001110001"

    # Customer 1 accesses Customer 2 profile -> 403 Forbidden
    other_res = await client.get(f"/api/v1/users/{c2_id}/profile", headers=c1_token)
    assert other_res.status_code == 403
    assert "Forbidden" in other_res.json()["detail"]

    # Admin accesses Customer 2 profile -> 200 OK (Allowed by role)
    admin_view_res = await client.get(f"/api/v1/users/{c2_id}/profile", headers=adm_token)
    assert admin_view_res.status_code == 200
    assert admin_view_res.json()["phone_number"] == "+923001110002"
