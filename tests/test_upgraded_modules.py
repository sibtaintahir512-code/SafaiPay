import pytest

@pytest.mark.asyncio
async def test_ai_material_classification_endpoint(client, customer_token):
    """Verify AI classification returns predicted stream, confidence score, and advisory disclaimer."""
    # Test PET Plastic
    res = await client.post(
        "/api/v1/pickups/ai-classify",
        json={"stream_hint": "Clear plastic water bottles"},
        headers=customer_token
    )
    assert res.status_code == 200
    data = res.json()
    assert data["predicted_material"] == "PET_PLASTIC"
    assert data["confidence_score"] >= 0.90
    assert data["quality_tier"] == "Tier A"
    assert "Estimated Value" in data["disclaimer"]
    assert data["manual_override_allowed"] is True

    # Test Cardboard
    res_card = await client.post(
        "/api/v1/pickups/ai-classify",
        json={"stream_hint": "Corrugated carton packaging"},
        headers=customer_token
    )
    assert res_card.status_code == 200
    assert res_card.json()["predicted_material"] == "CARDBOARD_OCC"

    # Test Metal
    res_met = await client.post(
        "/api/v1/pickups/ai-classify",
        json={"stream_hint": "Scrap aluminum beverage cans and tin"},
        headers=customer_token
    )
    assert res_met.status_code == 200
    assert res_met.json()["predicted_material"] == "MIXED_METAL"

@pytest.mark.asyncio
async def test_recycler_batch_marketplace_and_procurement(client, recycler_token, admin_token):
    """Verify listing, creating, and procuring wholesale batches with auto-dispatch manifest."""
    # 1. Recycler views available batches
    list_res = await client.get("/api/v1/batches?status=AVAILABLE", headers=recycler_token)
    assert list_res.status_code == 200
    batches = list_res.json()
    assert len(batches) >= 1
    batch_to_procure = batches[0]
    batch_id = batch_to_procure["id"]

    # 2. Recycler issues purchase order
    procure_res = await client.post(
        f"/api/v1/batches/{batch_id}/procure",
        json={"delivery_destination": "Indus Polymers Factory Plot 42 Korangi", "notes": "Urgent feedstock"},
        headers=recycler_token
    )
    assert procure_res.status_code == 200
    procured = procure_res.json()
    assert procured["status"] == "PROCURED"
    assert procured["procured_by_user_id"] is not None

    # 3. Verify batch cannot be re-procured
    dup_procure = await client.post(
        f"/api/v1/batches/{batch_id}/procure",
        json={},
        headers=recycler_token
    )
    assert dup_procure.status_code == 400
    assert "already in 'PROCURED' status" in dup_procure.json()["detail"]

    # 4. Recycler checks my procurements
    my_orders = await client.get("/api/v1/batches/my-procurements", headers=recycler_token)
    assert my_orders.status_code == 200
    assert any(b["id"] == batch_id for b in my_orders.json())

    # 5. Check dispatch record generated
    disp_res = await client.get("/api/v1/dispatch", headers=recycler_token)
    assert disp_res.status_code == 200
    dispatches = disp_res.json()
    matching_dispatch = next((d for d in dispatches if d["batch_id"] == batch_id), None)
    assert matching_dispatch is not None
    assert matching_dispatch["status"] == "SCHEDULED"

@pytest.mark.asyncio
async def test_digital_financial_identity_and_consent(client, collector_token):
    """Verify explainable financial score, explicit consent enforcement, and disclaimer."""
    # 1. Attempt access without explicit consent -> 400 Bad Request
    no_consent = await client.get("/api/v1/earnings/financial-score?consent=false", headers=collector_token)
    assert no_consent.status_code == 400
    assert "consent is required" in no_consent.json()["detail"]

    # 2. Access with consent -> Returns explainable credit score and pillars
    score_res = await client.get("/api/v1/earnings/financial-score?consent=true", headers=collector_token)
    assert score_res.status_code == 200
    score_data = score_res.json()
    assert 300 <= score_data["credit_score"] <= 850
    assert "AAA" in score_data["score_grade"] or "AA" in score_data["score_grade"] or "A" in score_data["score_grade"]
    assert score_data["eligible_micro_loan_pkr"] > 0
    assert "DISCLAIMER" in score_data["disclaimer"]
    assert "NOT a bank" in score_data["disclaimer"]
    assert len(score_data["pillars"]) == 4

@pytest.mark.asyncio
async def test_financial_ledger_export(client, collector_token):
    """Verify JSON and CSV export of financial ledger with compliance disclaimers."""
    # JSON Export
    json_res = await client.get("/api/v1/earnings/export?format=json", headers=collector_token)
    assert json_res.status_code == 200
    json_data = json_res.json()
    assert "records" in json_data
    assert "disclaimer" in json_data

    # CSV Export
    csv_res = await client.get("/api/v1/earnings/export?format=csv", headers=collector_token)
    assert csv_res.status_code == 200
    assert csv_res.headers["content-type"].startswith("text/csv")
    assert "SafaiPay Verified Digital Earnings Ledger" in csv_res.text

@pytest.mark.asyncio
async def test_collector_kyc_approval_and_rejection(client, admin_token):
    """Verify Admin approval and rejection of collector biometric & scale KYC."""
    # Get a collector ID
    users_res = await client.get("/api/v1/admin/users?role=COLLECTOR", headers=admin_token)
    assert users_res.status_code == 200
    collectors = users_res.json()
    assert len(collectors) > 0
    target_collector_id = collectors[0]["id"]

    # Approve KYC
    approve_res = await client.post(
        f"/api/v1/admin/collectors/{target_collector_id}/approve",
        headers=admin_token
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["kyc_status"] == "VERIFIED"

    # Reject KYC
    reject_res = await client.post(
        f"/api/v1/admin/collectors/{target_collector_id}/reject?reason=Missing+CNIC+back+photo",
        headers=admin_token
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["kyc_status"] == "REJECTED"

@pytest.mark.asyncio
async def test_esg_analytics_impact_summary(client):
    """Verify ESG impact calculation, CO2 abatement, and EPA WARM metrics."""
    res = await client.get("/api/v1/analytics/esg-impact")
    assert res.status_code == 200
    data = res.json()
    assert data["total_diverted_kg"] > 0
    assert data["total_co2_offset_kg"] == round(data["total_diverted_kg"] * 1.35, 2)
    assert data["diverted_tonnage"] == round(data["total_diverted_kg"] / 1000.0, 2)
    assert data["active_collectors_count"] > 0
    assert "Estimated Environmental Impact" in data["disclaimer"]
    assert "PET_PLASTIC" in data["material_breakdown"]
