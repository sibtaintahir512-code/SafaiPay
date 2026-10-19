import pytest

@pytest.mark.asyncio
async def test_complete_successful_pickup_workflow(client):
    """Test full customer-to-collector lifecycle:
    requested -> assigned -> accepted -> in_progress -> weight_verified ->
    customer_confirmed -> payment_pending -> payment_completed -> inventory_ready
    """
    # 1. Login Customer (+923001110001)
    res_cust = await client.post("/api/v1/auth/login", json={
        "identifier": "+923001110001",
        "password": "SafaiPassword123!"
    })
    assert res_cust.status_code == 200
    cust_token = {"Authorization": f"Bearer {res_cust.json()['access_token']}"}

    # 2. Login Collector (+923002220001)
    res_coll = await client.post("/api/v1/auth/login", json={
        "identifier": "+923002220001",
        "password": "SafaiPassword123!"
    })
    assert res_coll.status_code == 200
    coll_id = res_coll.json()["user"]["id"]
    coll_token = {"Authorization": f"Bearer {res_coll.json()['access_token']}"}

    # 3. Login Admin (+923000000000)
    res_adm = await client.post("/api/v1/auth/login", json={
        "identifier": "admin@safaipay.org",
        "password": "AdminPassword123!"
    })
    assert res_adm.status_code == 200
    adm_token = {"Authorization": f"Bearer {res_adm.json()['access_token']}"}

    # Step A: Customer creates pickup request -> status: requested
    req_payload = {
        "material_code": "PET_PLASTIC",
        "estimated_quantity_kg": 15.0,
        "street_address": "Falcon Complex, PECHS Block 6, Karachi",
        "city": "Karachi",
        "preferred_time": "2026-10-25T10:00:00Z",
        "notes": "15 kg clean plastic bottles"
    }
    create_res = await client.post("/api/v1/pickups", json=req_payload, headers=cust_token)
    assert create_res.status_code == 201
    pickup = create_res.json()
    pickup_id = pickup["id"]
    assert pickup["status"] == "requested"

    # Step B: Admin assigns Collector -> status: assigned
    assign_res = await client.post(
        f"/api/v1/pickups/{pickup_id}/assign",
        json={"collector_id": coll_id},
        headers=adm_token
    )
    assert assign_res.status_code == 200
    assert assign_res.json()["status"] == "assigned"

    # Step C: Collector accepts job -> status: accepted
    accept_res = await client.post(f"/api/v1/pickups/{pickup_id}/accept", headers=coll_token)
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "accepted"

    # Step D: Collector starts pickup with GPS -> status: in_progress
    start_res = await client.post(
        f"/api/v1/pickups/{pickup_id}/start",
        json={"gps_latitude": 24.8640, "gps_longitude": 67.0600},
        headers=coll_token
    )
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "in_progress"

    # Step E: Collector uploads photo proof
    photo_res = await client.post(
        f"/api/v1/pickups/{pickup_id}/upload-photo",
        json={
            "image_type": "before_pickup",
            "image_url": "https://storage.safaipay.org/photos/before_01.jpg",
            "caption": "Sorted PET bottles at society gate"
        },
        headers=coll_token
    )
    assert photo_res.status_code == 200

    # Step F: Collector inputs verified weight (20.0 kg, Q=0.95) -> status: weight_verified
    weigh_res = await client.post(
        f"/api/v1/pickups/{pickup_id}/verify-weight",
        json={
            "verified_weight_kg": 20.0,
            "quality_factor": 0.95,
            "scale_photo_url": "https://storage.safaipay.org/photos/scale_proof.jpg",
            "notes": "Weighed on digital scale"
        },
        headers=coll_token
    )
    assert weigh_res.status_code == 200
    weighed_pickup = weigh_res.json()
    assert weighed_pickup["status"] == "weight_verified"
    calc = weighed_pickup["pricing_calculations"][-1]
    rate_applied = float(calc["material_rate_applied"])
    expected_total = round(20.0 * rate_applied * 0.95, 2)
    assert calc["total_price"] == expected_total
    assert calc["is_estimated"] is False

    # Step G: Customer confirms completion -> status: payment_pending
    confirm_res = await client.post(
        f"/api/v1/pickups/{pickup_id}/confirm-completion",
        json={"notes": "Weight and price confirmed"},
        headers=cust_token
    )
    assert confirm_res.status_code == 200
    confirmed_pickup = confirm_res.json()
    assert confirmed_pickup["status"] == "payment_pending"

    # Step H: Process Mock Payment -> status: payment_completed
    # Fetch pending payment ID
    pay_res = await client.get("/api/v1/admin/payments", headers=adm_token)
    assert pay_res.status_code == 200
    payments = [p for p in pay_res.json() if p["pickup_id"] == pickup_id]
    assert len(payments) == 1
    payment_id = payments[0]["id"]
    assert payments[0]["amount_pkr"] == expected_total

    process_res = await client.post(f"/api/v1/payments/{payment_id}/process-mock", headers=adm_token)
    assert process_res.status_code == 200
    assert process_res.json()["status"] == "completed"

    # Verify pickup status is now payment_completed
    details = await client.get(f"/api/v1/pickups/{pickup_id}", headers=cust_token)
    assert details.json()["status"] == "payment_completed"

    # Step I: Mark Inventory Ready -> status: inventory_ready
    ready_res = await client.post(
        f"/api/v1/payments/pickups/{pickup_id}/ready-for-inventory",
        headers=coll_token
    )
    assert ready_res.status_code == 200
    assert ready_res.json()["status"] == "inventory_ready"

    # Step J: Customer rates collector 5 stars
    rate_res = await client.post(
        f"/api/v1/pickups/{pickup_id}/rate",
        json={"score": 5, "review_text": "Excellent service and punctual weighing"},
        headers=cust_token
    )
    assert rate_res.status_code == 201

    # Step K: Verify Collector Earnings Summary includes PKR 1520.00
    earn_res = await client.get("/api/v1/earnings/summary", headers=coll_token)
    assert earn_res.status_code == 200
    summary = earn_res.json()
    assert summary["today_earnings_pkr"] >= 1520.00
    assert summary["completed_jobs_count"] >= 1

@pytest.mark.asyncio
async def test_invalid_state_transition_rejection(client):
    """Verify state machine blocks invalid transition jumps."""
    res_cust = await client.post("/api/v1/auth/login", json={
        "identifier": "+923001110001",
        "password": "SafaiPassword123!"
    })
    cust_token = {"Authorization": f"Bearer {res_cust.json()['access_token']}"}

    # Create pickup (status: requested)
    create_res = await client.post("/api/v1/pickups", json={
        "material_code": "CARDBOARD_OCC",
        "estimated_quantity_kg": 10.0,
        "street_address": "Test Address Karachi",
        "preferred_time": "2026-10-25T10:00:00Z"
    }, headers=cust_token)
    pickup_id = create_res.json()["id"]

    # Attempt to jump straight from 'requested' to 'customer_confirmed' -> 400 Bad Request
    invalid_jump = await client.post(
        f"/api/v1/pickups/{pickup_id}/confirm-completion",
        json={},
        headers=cust_token
    )
    assert invalid_jump.status_code == 400
    assert "Invalid workflow state transition" in invalid_jump.json()["detail"]

@pytest.mark.asyncio
async def test_customer_cannot_change_collector_verified_weight(client):
    """Security check: Customer is forbidden from modifying verified weight."""
    res_cust = await client.post("/api/v1/auth/login", json={
        "identifier": "+923001110001",
        "password": "SafaiPassword123!"
    })
    cust_token = {"Authorization": f"Bearer {res_cust.json()['access_token']}"}

    # Customer attempts to verify weight -> 403 Forbidden
    res = await client.post(
        "/api/v1/pickups/some-random-id/verify-weight",
        json={"verified_weight_kg": 50.0, "quality_factor": 1.0},
        headers=cust_token
    )
    assert res.status_code == 403

@pytest.mark.asyncio
async def test_collector_cannot_access_another_collector_earnings(client):
    """Security check: Collector A cannot query Collector B's earnings."""
    # Collector A (+923002220001)
    res_a = await client.post("/api/v1/auth/login", json={
        "identifier": "+923002220001",
        "password": "SafaiPassword123!"
    })
    token_a = {"Authorization": f"Bearer {res_a.json()['access_token']}"}

    # Collector B (+923002220002)
    res_b = await client.post("/api/v1/auth/login", json={
        "identifier": "+923002220002",
        "password": "SafaiPassword123!"
    })
    id_b = res_b.json()["user"]["id"]

    # Collector A attempts to access Collector B earnings -> 403 Forbidden
    res = await client.get(f"/api/v1/earnings/summary?collector_id={id_b}", headers=token_a)
    assert res.status_code == 403
    assert "Forbidden" in res.json()["detail"]

@pytest.mark.asyncio
async def test_invalid_weight_rejection(client):
    """Business rule: Weight <= 0 must be rejected."""
    res_adm = await client.post("/api/v1/auth/login", json={
        "identifier": "admin@safaipay.org",
        "password": "AdminPassword123!"
    })
    adm_token = {"Authorization": f"Bearer {res_adm.json()['access_token']}"}

    # Create and advance pickup to in_progress
    cust = await client.post("/api/v1/pickups", json={
        "material_code": "PET_PLASTIC",
        "estimated_quantity_kg": 10.0,
        "street_address": "Test Street",
        "preferred_time": "2026-10-25T10:00:00Z"
    }, headers=adm_token)
    pid = cust.json()["id"]

    # Advance state
    await client.post(f"/api/v1/pickups/{pid}/assign", json={"collector_id": cust.json()["customer_id"]}, headers=adm_token)
    
    # Negative weight -> 422 or 400
    neg_res = await client.post(
        f"/api/v1/pickups/{pid}/verify-weight",
        json={"verified_weight_kg": -10.0, "quality_factor": 1.0},
        headers=adm_token
    )
    assert neg_res.status_code in (400, 422)

@pytest.mark.asyncio
async def test_invalid_quality_factor_rejection(client):
    """Business rule: Quality factor must be between 0.0 and 1.0."""
    res_adm = await client.post("/api/v1/auth/login", json={
        "identifier": "admin@safaipay.org",
        "password": "AdminPassword123!"
    })
    adm_token = {"Authorization": f"Bearer {res_adm.json()['access_token']}"}

    res_q_high = await client.post(
        "/api/v1/pickups/dummy-id/verify-weight",
        json={"verified_weight_kg": 10.0, "quality_factor": 1.50},
        headers=adm_token
    )
    assert res_q_high.status_code in (400, 422)

    res_q_low = await client.post(
        "/api/v1/pickups/dummy-id/verify-weight",
        json={"verified_weight_kg": 10.0, "quality_factor": -0.20},
        headers=adm_token
    )
    assert res_q_low.status_code in (400, 422)

@pytest.mark.asyncio
async def test_duplicate_payment_confirmation(client):
    """Verify duplicate payment confirmation is rejected."""
    res_adm = await client.post("/api/v1/auth/login", json={
        "identifier": "admin@safaipay.org",
        "password": "AdminPassword123!"
    })
    adm_token = {"Authorization": f"Bearer {res_adm.json()['access_token']}"}

    pay_list = await client.get("/api/v1/admin/payments?status=completed", headers=adm_token)
    if not pay_list.json():
        create = await client.post("/api/v1/pickups", json={
            "material_code": "PET_PLASTIC",
            "estimated_quantity_kg": 10.0,
            "street_address": "Test Street",
            "preferred_time": "2026-10-25T10:00:00Z"
        }, headers=adm_token)
        pid = create.json()["id"]
        res_coll = await client.post("/api/v1/auth/login", json={"identifier": "+923002220001", "password": "SafaiPassword123!"})
        cid = res_coll.json()["user"]["id"]
        ctok = {"Authorization": f"Bearer {res_coll.json()['access_token']}"}
        await client.post(f"/api/v1/pickups/{pid}/assign", json={"collector_id": cid}, headers=adm_token)
        await client.post(f"/api/v1/pickups/{pid}/accept", headers=ctok)
        await client.post(f"/api/v1/pickups/{pid}/start", json={"gps_latitude": 24.8, "gps_longitude": 67.0}, headers=ctok)
        await client.post(f"/api/v1/pickups/{pid}/verify-weight", json={"verified_weight_kg": 10.0, "quality_factor": 1.0}, headers=ctok)
        await client.post(f"/api/v1/pickups/{pid}/confirm-completion", json={}, headers=adm_token)
        p_res = await client.get("/api/v1/admin/payments?status=pending", headers=adm_token)
        pay_id = next(p["id"] for p in p_res.json() if p["pickup_id"] == pid)
        await client.post(f"/api/v1/payments/{pay_id}/process-mock", headers=adm_token)
        completed_payment_id = pay_id
    else:
        completed_payment_id = pay_list.json()[0]["id"]

    # Re-process -> 409 Conflict
    dup_res = await client.post(f"/api/v1/payments/{completed_payment_id}/process-mock", headers=adm_token)
    assert dup_res.status_code == 409
    assert "already completed" in dup_res.json()["detail"]

@pytest.mark.asyncio
async def test_payment_failure_and_retry(client):
    """Verify payment failure and successful retry flow."""
    # 1. Create pickup and advance to payment_pending
    res_adm = await client.post("/api/v1/auth/login", json={
        "identifier": "admin@safaipay.org",
        "password": "AdminPassword123!"
    })
    adm_token = {"Authorization": f"Bearer {res_adm.json()['access_token']}"}

    create = await client.post("/api/v1/pickups", json={
        "material_code": "CARDBOARD_OCC",
        "estimated_quantity_kg": 25.0,
        "street_address": "Askari IV Karachi",
        "preferred_time": "2026-10-25T11:00:00Z"
    }, headers=adm_token)
    pid = create.json()["id"]

    # Assign collector
    res_coll = await client.post("/api/v1/auth/login", json={
        "identifier": "+923002220001",
        "password": "SafaiPassword123!"
    })
    coll_id = res_coll.json()["user"]["id"]
    coll_token = {"Authorization": f"Bearer {res_coll.json()['access_token']}"}

    await client.post(f"/api/v1/pickups/{pid}/assign", json={"collector_id": coll_id}, headers=adm_token)
    await client.post(f"/api/v1/pickups/{pid}/accept", headers=coll_token)
    await client.post(f"/api/v1/pickups/{pid}/start", json={"gps_latitude": 24.9, "gps_longitude": 67.1}, headers=coll_token)
    await client.post(f"/api/v1/pickups/{pid}/verify-weight", json={"verified_weight_kg": 30.0, "quality_factor": 1.0}, headers=coll_token)
    await client.post(f"/api/v1/pickups/{pid}/confirm-completion", json={}, headers=adm_token)

    # 2. Get pending payment
    payments = await client.get("/api/v1/admin/payments?status=pending", headers=adm_token)
    p_rec = next(p for p in payments.json() if p["pickup_id"] == pid)
    pay_id = p_rec["id"]

    # 3. Simulate failure
    fail_res = await client.post(
        f"/api/v1/payments/{pay_id}/process-mock",
        json={"simulate_failure": True, "failure_reason": "Bank sandbox mock timeout"},
        headers=adm_token
    )
    assert fail_res.status_code == 200
    assert fail_res.json()["status"] == "failed"

    # Pickup status is payment_failed
    check_pickup = await client.get(f"/api/v1/pickups/{pid}", headers=adm_token)
    assert check_pickup.json()["status"] == "payment_failed"

    # 4. Retry failed payment
    retry_res = await client.post(f"/api/v1/payments/{pay_id}/retry", headers=adm_token)
    assert retry_res.status_code == 200
    assert retry_res.json()["status"] == "completed"
    assert retry_res.json()["retry_count"] == 1

    # Pickup status is now payment_completed
    check_pickup2 = await client.get(f"/api/v1/pickups/{pid}", headers=adm_token)
    assert check_pickup2.json()["status"] == "payment_completed"

@pytest.mark.asyncio
async def test_pickup_cancellation(client):
    """Verify pickup cancellation flow."""
    res_adm = await client.post("/api/v1/auth/login", json={
        "identifier": "admin@safaipay.org",
        "password": "AdminPassword123!"
    })
    adm_token = {"Authorization": f"Bearer {res_adm.json()['access_token']}"}

    create = await client.post("/api/v1/pickups", json={
        "material_code": "PET_PLASTIC",
        "estimated_quantity_kg": 5.0,
        "street_address": "PECHS Block 2",
        "preferred_time": "2026-10-25T14:00:00Z"
    }, headers=adm_token)
    pid = create.json()["id"]

    cancel_res = await client.post(
        f"/api/v1/pickups/{pid}/cancel",
        json={"reason": "Customer no longer requires pickup"},
        headers=adm_token
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"

@pytest.mark.asyncio
async def test_dispute_creation_and_resolution(client):
    """Verify raising and resolving a dispute."""
    res_adm = await client.post("/api/v1/auth/login", json={
        "identifier": "admin@safaipay.org",
        "password": "AdminPassword123!"
    })
    adm_token = {"Authorization": f"Bearer {res_adm.json()['access_token']}"}

    # Create and advance to weight_verified
    create = await client.post("/api/v1/pickups", json={
        "material_code": "PET_PLASTIC",
        "estimated_quantity_kg": 20.0,
        "street_address": "Clifton Block 4",
        "preferred_time": "2026-10-25T15:00:00Z"
    }, headers=adm_token)
    pid = create.json()["id"]

    res_coll = await client.post("/api/v1/auth/login", json={"identifier": "+923002220001", "password": "SafaiPassword123!"})
    coll_id = res_coll.json()["user"]["id"]
    coll_token = {"Authorization": f"Bearer {res_coll.json()['access_token']}"}

    await client.post(f"/api/v1/pickups/{pid}/assign", json={"collector_id": coll_id}, headers=adm_token)
    await client.post(f"/api/v1/pickups/{pid}/accept", headers=coll_token)
    await client.post(f"/api/v1/pickups/{pid}/start", json={"gps_latitude": 24.8, "gps_longitude": 67.0}, headers=coll_token)
    await client.post(f"/api/v1/pickups/{pid}/verify-weight", json={"verified_weight_kg": 12.0, "quality_factor": 0.75}, headers=coll_token)

    # Customer disputes weight deduction
    disp_res = await client.post(
        f"/api/v1/pickups/{pid}/dispute",
        json={"reason_category": "WEIGHT_MISMATCH", "description": "Customer claims 20kg was handed over"},
        headers=adm_token
    )
    assert disp_res.status_code == 201
    disp_id = disp_res.json()["id"]
    assert disp_res.json()["status"] == "OPEN"

    # Pickup status is now disputed
    pickup_disp = await client.get(f"/api/v1/pickups/{pid}", headers=adm_token)
    assert pickup_disp.json()["status"] == "disputed"

    # Admin resolves dispute
    resolve_res = await client.patch(
        f"/api/v1/admin/disputes/{disp_id}/resolve",
        json={"status": "RESOLVED", "resolution_notes": "Scale photo reviewed; customer confirmed revised amount"},
        headers=adm_token
    )
    assert resolve_res.status_code == 200
    assert resolve_res.json()["status"] == "RESOLVED"
