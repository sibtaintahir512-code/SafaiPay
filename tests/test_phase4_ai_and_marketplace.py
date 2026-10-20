"""Phase 4 Automated Test Suite: AI Classification, Inventory & Recycler Marketplace."""
import io
import pytest

@pytest.mark.asyncio
async def test_valid_image_classification(client, customer_token):
    """Test AI image upload with valid JPEG/PNG files."""
    # 1. Classify PET plastic image
    fake_pet_bytes = b"\xFF\xD8\xFF\xE0\x00\x10JFIF" + b"A" * 500  # Valid JPEG header
    files = {"file": ("pet_bottle_sample.jpg", fake_pet_bytes, "image/jpeg")}
    res_pet = await client.post("/api/v1/ai/classify", files=files, headers=customer_token)
    assert res_pet.status_code == 200
    pet_data = res_pet.json()
    assert pet_data["material"] == "PET plastic"
    assert pet_data["confidence"] >= 0.70
    assert pet_data["requires_manual_verification"] is False
    assert pet_data["model_version"] == "demo-v1"
    assert pet_data["id"] is not None

    # 2. Classify Cardboard image
    fake_card_bytes = b"\x89PNG\r\n\x1a\n" + b"B" * 500  # Valid PNG header
    files_card = {"file": ("cardboard_carton.png", fake_card_bytes, "image/png")}
    res_card = await client.post("/api/v1/ai/classify", files=files_card, headers=customer_token)
    assert res_card.status_code == 200
    card_data = res_card.json()
    assert card_data["material"] == "cardboard"
    assert card_data["confidence"] >= 0.70
    assert card_data["requires_manual_verification"] is False

@pytest.mark.asyncio
async def test_invalid_image_rejection(client, customer_token):
    """Test validation blocks invalid file formats and size boundaries."""
    # A. Unsupported MIME type (PDF)
    pdf_bytes = b"%PDF-1.4 " + b"C" * 200
    res_pdf = await client.post(
        "/api/v1/ai/classify",
        files={"file": ("document.pdf", pdf_bytes, "application/pdf")},
        headers=customer_token
    )
    assert res_pdf.status_code == 400
    assert "Unsupported file format" in res_pdf.json()["detail"]

    # B. Empty / corrupt file (< 100 bytes)
    empty_bytes = b"\xFF\xD8\xFF"  # Only 3 bytes
    res_empty = await client.post(
        "/api/v1/ai/classify",
        files={"file": ("empty.jpg", empty_bytes, "image/jpeg")},
        headers=customer_token
    )
    assert res_empty.status_code == 400
    assert "empty or corrupted" in res_empty.json()["detail"]

    # C. File size exceeding 10 MB limit
    oversized_bytes = b"\xFF\xD8\xFF" + b"0" * (10 * 1024 * 1024 + 1024)
    res_large = await client.post(
        "/api/v1/ai/classify",
        files={"file": ("oversized.jpg", oversized_bytes, "image/jpeg")},
        headers=customer_token
    )
    assert res_large.status_code == 400
    assert "exceeds maximum allowed limit" in res_large.json()["detail"]

@pytest.mark.asyncio
async def test_low_confidence_manual_review_flow(client, customer_token, admin_token):
    """Test ambiguous/unknown image triggers low-confidence flag and admin review."""
    # 1. Upload ambiguous image that triggers other/unknown with confidence < 0.70
    ambiguous_bytes = b"\xFF\xD8\xFF\xE0" + b"unknown_debris_material" * 15
    files = {"file": ("unknown_debris.jpg", ambiguous_bytes, "image/jpeg")}
    res = await client.post("/api/v1/ai/classify", files=files, headers=customer_token)
    assert res.status_code == 200
    pred = res.json()
    assert pred["material"] == "other/unknown"
    assert pred["confidence"] < 0.70
    assert pred["requires_manual_verification"] is True
    pred_id = pred["id"]

    # 2. Admin queries low-confidence queue
    low_conf_list = await client.get("/api/v1/ai/predictions/low-confidence", headers=admin_token)
    assert low_conf_list.status_code == 200
    found = any(p["id"] == pred_id for p in low_conf_list.json())
    assert found is True

    # 3. Admin performs Human-In-The-Loop verification
    verify_res = await client.post(
        f"/api/v1/ai/predictions/{pred_id}/verify",
        json={"verified_material": "PET plastic", "verification_notes": "Supervisor verified high-density plastic"},
        headers=admin_token
    )
    assert verify_res.status_code == 200
    verified = verify_res.json()
    assert verified["verified_material"] == "PET plastic"
    assert verified["requires_manual_verification"] is False
    assert verified["status"] == "VERIFIED"

@pytest.mark.asyncio
async def test_customer_correction_of_ai_result(client, customer_token):
    """Test customer overrides inaccurate AI material classification."""
    fake_bytes = b"\xFF\xD8\xFF\xE0" + b"X" * 300
    files = {"file": ("sample_photo.jpg", fake_bytes, "image/jpeg")}
    res = await client.post("/api/v1/ai/classify", files=files, headers=customer_token)
    assert res.status_code == 200
    pred_id = res.json()["id"]

    # Customer corrects to "cardboard"
    correct_res = await client.post(
        f"/api/v1/ai/predictions/{pred_id}/correct",
        json={"corrected_material": "cardboard", "notes": "Actually dry packaging cartons"},
        headers=customer_token
    )
    assert correct_res.status_code == 200
    corrected = correct_res.json()
    assert corrected["verified_material"] == "cardboard"
    assert corrected["is_corrected"] is True
    assert corrected["status"] == "CORRECTED"

@pytest.mark.asyncio
async def test_inventory_creation_after_completed_pickup(client, customer_token, collector_token, admin_token):
    """Test completed pickup automatically creates inventory with verified weight & quality factor."""
    # 1. Login to get collector ID
    coll_res = await client.post("/api/v1/auth/login", json={
        "identifier": "+923002220001",
        "password": "SafaiPassword123!"
    })
    coll_id = coll_res.json()["user"]["id"]

    # Create pickup
    create_res = await client.post("/api/v1/pickups", json={
        "material_code": "PET_PLASTIC",
        "estimated_quantity_kg": 25.0,
        "street_address": "Korangi Sector 15 Karachi",
        "preferred_time": "2026-10-25T10:00:00Z"
    }, headers=customer_token)
    assert create_res.status_code == 201
    pickup = create_res.json()
    pickup_id = pickup["id"]

    # Admin assigns collector
    assign_res = await client.post(
        f"/api/v1/pickups/{pickup_id}/assign",
        json={"collector_id": coll_id},
        headers=admin_token
    )
    assert assign_res.status_code == 200

    # Collector accepts, starts, and verifies physical weight
    await client.post(f"/api/v1/pickups/{pickup_id}/accept", headers=collector_token)
    await client.post(f"/api/v1/pickups/{pickup_id}/start", json={"gps_latitude": 24.8, "gps_longitude": 67.1}, headers=collector_token)
    weigh_res = await client.post(
        f"/api/v1/pickups/{pickup_id}/verify-weight",
        json={"verified_weight_kg": 30.0, "quality_factor": 0.95},
        headers=collector_token
    )
    assert weigh_res.status_code == 200

    # Customer confirms completion
    confirm_res = await client.post(f"/api/v1/pickups/{pickup_id}/confirm-completion", json={}, headers=customer_token)
    assert confirm_res.status_code == 200

    # 2. Create inventory item from pickup
    inv_res = await client.post(f"/api/v1/inventory/from-pickup/{pickup_id}", headers=collector_token)
    assert inv_res.status_code == 201
    inv_item = inv_res.json()
    assert inv_item["pickup_id"] == pickup_id
    assert inv_item["verified_weight_kg"] == 30.0
    assert inv_item["quality_factor"] == 0.95
    assert inv_item["status"] == "AVAILABLE"

    # 3. Idempotency check: Calling again returns existing item (no duplicate creation)
    dup_res = await client.post(f"/api/v1/inventory/from-pickup/{pickup_id}", headers=collector_token)
    assert dup_res.status_code in [200, 201]
    assert dup_res.json()["id"] == inv_item["id"]


@pytest.mark.asyncio
async def test_duplicate_inventory_sale_prevention(client, collector_token, recycler_token):
    """Verify that an inventory item cannot be offered or sold twice."""
    # 1. Create an available inventory item
    inv_res = await client.post("/api/v1/inventory", json={
        "material_type": "PET plastic",
        "verified_weight_kg": 500.0,
        "quality_factor": 1.0,
        "quality_grade": "Tier A",
        "location": "Korangi Aggregation Hub"
    }, headers=collector_token)
    assert inv_res.status_code == 201
    inv_id = inv_res.json()["id"]

    # 2. Recycler creates a demand
    demand_res = await client.post("/api/v1/marketplace/demands", json={
        "material_type": "PET plastic",
        "required_quantity_kg": 500.0,
        "minimum_quality": "Tier A",
        "location": "Korangi Industrial Area",
        "offered_price_per_kg": 85.0,
        "deadline": "2026-11-01T18:00:00Z"
    }, headers=recycler_token)
    assert demand_res.status_code == 201
    demand_id = demand_res.json()["id"]

    # 3. Collector submits offer with this inventory item -> Success
    offer1 = await client.post(f"/api/v1/marketplace/demands/{demand_id}/offers", json={
        "offered_quantity_kg": 500.0,
        "offered_price_per_kg": 85.0,
        "inventory_item_id": inv_id
    }, headers=collector_token)
    assert offer1.status_code == 201

    # 4. Attempt to submit a second offer using the SAME inventory item -> 409 Conflict
    offer2 = await client.post(f"/api/v1/marketplace/demands/{demand_id}/offers", json={
        "offered_quantity_kg": 500.0,
        "offered_price_per_kg": 85.0,
        "inventory_item_id": inv_id
    }, headers=collector_token)
    assert offer2.status_code == 409
    assert "Duplicate sale prevention" in offer2.json()["detail"]

@pytest.mark.asyncio
async def test_recycler_demand_and_supply_offer_acceptance(client, collector_token, recycler_token):
    """Test full marketplace flow: demand creation -> offer submission -> acceptance -> delivery -> completion."""
    # 1. Recycler posts demand
    demand_res = await client.post("/api/v1/marketplace/demands", json={
        "material_type": "cardboard",
        "required_quantity_kg": 1000.0,
        "minimum_quality": "Tier A",
        "location": "SITE Industrial Area, Karachi",
        "offered_price_per_kg": 40.0,
        "deadline": "2026-11-15T12:00:00Z"
    }, headers=recycler_token)
    assert demand_res.status_code == 201
    demand = demand_res.json()
    demand_id = demand["id"]
    assert demand["status"] == "OPEN"

    # 2. Collector submits supply offer
    offer_res = await client.post(f"/api/v1/marketplace/demands/{demand_id}/offers", json={
        "offered_quantity_kg": 1000.0,
        "offered_price_per_kg": 40.0,
        "notes": "Baled double-wall corrugated cardboard"
    }, headers=collector_token)
    assert offer_res.status_code == 201
    offer_id = offer_res.json()["id"]

    # 3. Recycler accepts offer -> forms transaction (state: accepted)
    accept_res = await client.post(f"/api/v1/marketplace/offers/{offer_id}/accept", headers=recycler_token)
    assert accept_res.status_code == 200
    txn = accept_res.json()
    txn_id = txn["id"]
    assert txn["status"] == "ACCEPTED"
    assert txn["total_amount_pkr"] == 40000.0

    # 4. Collector marks delivered -> state: delivered
    deliver_res = await client.post(
        f"/api/v1/marketplace/transactions/{txn_id}/deliver?delivery_proof_url=https://safaipay.org/proof/gatepass_01.jpg",
        headers=collector_token
    )
    assert deliver_res.status_code == 200
    assert deliver_res.json()["status"] == "DELIVERED"

    # 5. Recycler completes transaction -> state: completed
    complete_res = await client.post(f"/api/v1/marketplace/transactions/{txn_id}/complete", headers=recycler_token)
    assert complete_res.status_code == 200
    assert complete_res.json()["status"] == "COMPLETED"

@pytest.mark.asyncio
async def test_transaction_cancellation_and_dispute(client, collector_token, recycler_token):
    """Test cancelling transaction and raising weighbridge disputes."""
    # 1. Create demand & offer
    dem_res = await client.post("/api/v1/marketplace/demands", json={
        "material_type": "PET plastic",
        "required_quantity_kg": 300.0,
        "minimum_quality": "Tier B",
        "location": "Landhi Industrial Zone",
        "offered_price_per_kg": 75.0,
        "deadline": "2026-11-20T10:00:00Z"
    }, headers=recycler_token)
    dem_id = dem_res.json()["id"]

    off_res = await client.post(f"/api/v1/marketplace/demands/{dem_id}/offers", json={
        "offered_quantity_kg": 300.0,
        "offered_price_per_kg": 75.0
    }, headers=collector_token)
    off_id = off_res.json()["id"]

    # Accept to create transaction
    txn_res = await client.post(f"/api/v1/marketplace/offers/{off_id}/accept", headers=recycler_token)
    txn_id = txn_res.json()["id"]

    # 2. Raise Dispute regarding weighbridge weight
    disp_res = await client.post(
        f"/api/v1/marketplace/transactions/{txn_id}/dispute",
        json={"reason": "Weighbridge gross weight is 40kg below manifested quantity"},
        headers=recycler_token
    )
    assert disp_res.status_code == 200
    assert disp_res.json()["status"] == "DISPUTED"
    assert "Weighbridge gross weight" in disp_res.json()["dispute_reason"]

    # 3. Cancel transaction
    cancel_res = await client.post(
        f"/api/v1/marketplace/transactions/{txn_id}/cancel",
        json={"reason": "Parties agreed to cancel after dispute mediation"},
        headers=recycler_token
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "CANCELLED"
