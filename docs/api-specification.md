# SafaiPay Phase 1: REST API Specification
**Document Version:** 1.0.0  
**Phase:** Phase 1 MVP Pilot  
**Standard:** OpenAPI 3.1 / RESTful Architecture  
**Base URL:** `https://api.safaipay.org/api/v1`  
**Content-Type:** `application/json`  
**Security Scheme:** HTTP Bearer Authentication (JWT with embedded role claims)  

---

### 1. Global Standards, Error Codes & Conventions

#### 1.1 Standard Response Envelopes
All API responses follow a consistent structured envelope:

**Success Response (200 OK / 201 Created):**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-10-19T14:30:00Z",
    "request_id": "req_8f1a23c4"
  }
}
```

**Error Response (4xx / 5xx):**
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_CONFLICT",
    "message": "This pickup has already been claimed by another collector.",
    "details": []
  },
  "meta": {
    "timestamp": "2026-10-19T14:30:00Z",
    "request_id": "req_8f1a23c4"
  }
}
```

#### 1.2 Common HTTP Status Codes
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Malformed payload or validation error.
- `401 Unauthorized`: Missing or expired Bearer JWT token.
- `403 Forbidden`: User role lacks permission for the endpoint.
- `404 Not Found`: Resource does not exist.
- `409 Conflict`: Concurrency conflict (e.g. job already claimed).
- `422 Unprocessable Entity`: Semantic validation failure (e.g. negative weight).
- `500 Internal Server Error`: Unhandled server exception.

---

### 2. Module 1: Authentication & Authorization

#### 2.1 Request Mobile OTP
`POST /auth/request-otp`
- **Description:** Sends a 6-digit numeric OTP via SMS to a Pakistani mobile number.
- **Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "phone_number": "+923001234567"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "OTP sent successfully",
    "phone_number": "+923001234567",
    "retry_after_seconds": 60
  }
}
```

#### 2.2 Verify Mobile OTP & Issue Tokens
`POST /auth/verify-otp`
- **Description:** Validates OTP, authenticates user, and returns access and refresh JWT tokens.
- **Request Body:**
```json
{
  "phone_number": "+923001234567",
  "otp_code": "849201"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
    "refresh_token": "def502003a8f...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": {
      "id": "e4b2d3c1-0011-4f8a-9231-182390dfae01",
      "phone_number": "+923001234567",
      "full_name": "Muhammad Rafiq",
      "roles": ["COLLECTOR"],
      "kyc_status": "VERIFIED"
    }
  }
}
```

#### 2.3 Refresh Access Token
`POST /auth/refresh`
- **Request Body:** `{"refresh_token": "def502003a8f..."}`
- **Response (200 OK):** Returns new `access_token` and `expires_in`.

---

### 3. Module 2: User & Role Profiles

#### 3.1 Get Current Authenticated Profile
`GET /users/me`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Response (200 OK):** Returns user identity, assigned roles, and linked role profile data.

#### 3.2 Update Collector Availability / Online Status
`PATCH /collectors/status/toggle-online`
- **Headers:** `Authorization: Bearer <TOKEN>` (Role: `COLLECTOR`)
- **Request Body:**
```json
{
  "is_online": true,
  "latitude": 24.8607,
  "longitude": 67.0011
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "collector_id": "e4b2d3c1-0011-4f8a-9231-182390dfae01",
    "is_online": true,
    "updated_at": "2026-10-19T14:32:00Z"
  }
}
```

---

### 4. Module 3: Pickups & Dispatch Operations

#### 4.1 Create Pickup Booking (Customer)
`POST /pickups`
- **Headers:** `Authorization: Bearer <TOKEN>` (Role: `CUSTOMER`)
- **Request Body:**
```json
{
  "address_text": "Suite 402, FTC Building, Shahrah-e-Faisal, Karachi",
  "latitude": 24.8582,
  "longitude": 67.0425,
  "scheduled_time": "2026-10-20T10:00:00+05:00",
  "notes": "4 cardboard boxes near service lift",
  "items": [
    {
      "material_code": "CARDBOARD_OCC",
      "ai_estimated_weight_kg": 20.0,
      "preview_photo_url": "https://storage.safaipay.org/photos/cardboard_pre_01.jpg"
    }
  ]
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "pickup_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "tracking_number": "SP-2026-10024",
    "status": "PENDING",
    "scheduled_time": "2026-10-20T10:00:00+05:00",
    "broadcast_radius_km": 3.0
  }
}
```

#### 4.2 Collector Job Discovery (Open Pickups Radius Feed)
`GET /pickups/available?lat=24.8607&lng=67.0011&radius_km=5.0`
- **Headers:** `Authorization: Bearer <TOKEN>` (Role: `COLLECTOR`)
- **Response (200 OK):** Returns array of available pickups sorted by distance.

#### 4.3 Accept Pickup Job (Atomic Lock)
`POST /pickups/{id}/accept`
- **Headers:** `Authorization: Bearer <TOKEN>` (Role: `COLLECTOR`)
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "pickup_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "status": "ASSIGNED",
    "customer_name": "Al-Rehman Enterprises (Falcon Complex)",
    "customer_phone": "+923219876543",
    "address_text": "Suite 402, FTC Building, Shahrah-e-Faisal, Karachi"
  }
}
```
- **Error (409 Conflict):**
```json
{
  "success": false,
  "error": {
    "code": "JOB_ALREADY_CLAIMED",
    "message": "This pickup has already been accepted by another collector."
  }
}
```

#### 4.4 Record Physical Scale Weight & Quality (Human-in-the-Loop)
`POST /pickups/{id}/verify-weight`
- **Headers:** `Authorization: Bearer <TOKEN>` (Role: `COLLECTOR`)
- **Request Body:**
```json
{
  "items": [
    {
      "material_code": "CARDBOARD_OCC",
      "verified_weight_kg": 22.5,
      "quality_tier": "TIER_A",
      "scale_photo_url": "https://storage.safaipay.org/photos/scale_proof_842.jpg",
      "photo_sha256": "8a35e98214f7b6b023de9124..."
    }
  ]
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "pickup_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "status": "WEIGHED",
    "pricing_breakdown": [
      {
        "material": "Corrugated Cardboard",
        "verified_weight_kg": 22.5,
        "benchmark_rate_pkr": 35.0,
        "quality_factor": 1.0,
        "formula": "22.5 kg * Rs. 35.00 * 1.00",
        "item_price_pkr": 787.50
      }
    ],
    "total_price_pkr": 787.50,
    "otp_required": true
  }
}
```

#### 4.5 Complete Pickup via Customer OTP
`POST /pickups/{id}/complete`
- **Headers:** `Authorization: Bearer <TOKEN>` (Role: `COLLECTOR`)
- **Request Body:**
```json
{
  "completion_otp": "4921"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "pickup_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "status": "COMPLETED",
    "total_price_pkr": 787.50,
    "simulated_transaction_reference": "SIM-TX-20261020-00918",
    "completed_at": "2026-10-20T10:45:12Z"
  }
}
```

---

### 5. Module 4: AI Classification & Roman Urdu NLP

#### 5.1 Waste Image Advisory Classification
`POST /classification/estimate`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Request Body:**
```json
{
  "image_url": "https://storage.safaipay.org/previews/temp_bottle_01.jpg"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "is_estimate": true,
    "predicted_material": "PET_PLASTIC",
    "display_name": "PET Plastic Bottles",
    "confidence_score": 0.942,
    "suggested_quality_tier": "TIER_A",
    "advisory_disclaimer": "AI classification is an advisory estimate only. Final verification is performed on-site by the verified collector."
  }
}
```

#### 5.2 Roman Urdu / English Text Request Parser
`POST /classification/parse-request`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Request Body:**
```json
{
  "text": "15 kilo gatta aur plastic botlein kal subah PECHS block 2 se collect karain"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "intent": "PICKUP_REQUEST",
    "extracted_entities": {
      "materials": [
        {"material_code": "CARDBOARD_OCC", "raw_token": "gatta", "weight_kg": 15.0},
        {"material_code": "PET_PLASTIC", "raw_token": "plastic botlein", "weight_kg": null}
      ],
      "temporal": "kal subah",
      "location": "PECHS block 2"
    }
  }
}
```

---

### 6. Module 5: Pricing Engine

#### 6.1 Get Active Benchmark Scrap Rates
`GET /pricing/current-rates`
- **Headers:** Public or Authenticated
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "effective_date": "2026-10-19T00:00:00Z",
    "rates": [
      {
        "material_code": "PET_PLASTIC",
        "name": "PET Plastic Bottles",
        "benchmark_rate_pkr": 80.00,
        "unit": "kg",
        "quality_factors": {
          "TIER_A": 1.00,
          "TIER_B": 0.90,
          "TIER_C": 0.75,
          "REJECTED": 0.00
        }
      },
      {
        "material_code": "CARDBOARD_OCC",
        "name": "Corrugated Cardboard",
        "benchmark_rate_pkr": 35.00,
        "unit": "kg",
        "quality_factors": {
          "TIER_A": 1.00,
          "TIER_B": 0.90,
          "TIER_C": 0.75,
          "REJECTED": 0.00
        }
      }
    ]
  }
}
```

---

### 7. Module 6: Simulated Payments & Financial Identity

#### 7.1 Collector Daily Earnings Summary
`GET /earnings/summary`
- **Headers:** `Authorization: Bearer <TOKEN>` (Role: `COLLECTOR`)
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "today_earnings_pkr": 2450.00,
    "week_earnings_pkr": 14200.00,
    "month_earnings_pkr": 58600.00,
    "completed_jobs_count": 4,
    "verified_kg_today": 42.5,
    "earnings_by_material": {
      "PET_PLASTIC": 1600.00,
      "CARDBOARD_OCC": 850.00
    }
  }
}
```

#### 7.2 Get Collector Financial Identity Profile
`GET /financial-identity`
- **Headers:** `Authorization: Bearer <TOKEN>` (Role: `COLLECTOR`, `ADMIN`)
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "collector_id": "e4b2d3c1-0011-4f8a-9231-182390dfae01",
    "total_verified_kg": 1840.5,
    "total_completed_pickups": 84,
    "total_simulated_earnings_pkr": 147240.00,
    "stability_score": 94.5,
    "dispute_rate": 0.012,
    "average_customer_rating": 4.9,
    "lender_sharing_status": "LOCKED_NO_CONSENT"
  }
}
```

#### 7.3 Grant Explicit Lender Data Consent
`POST /financial-identity/consent`
- **Headers:** `Authorization: Bearer <TOKEN>` (Role: `COLLECTOR`)
- **Request Body:**
```json
{
  "lender_institution_name": "Pak Microfinance Bank",
  "consent_scope": "EQUIPMENT_FINANCING_APP",
  "expires_in_days": 30
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "consent_id": "c1f2e3d4-...",
    "status": "ACTIVE",
    "expires_at": "2026-11-18T14:30:00Z",
    "notice": "Your verified earnings profile may now be viewed by Pak Microfinance Bank. You can revoke this anytime."
  }
}
```

---

### 8. Module 7: Recycler Marketplace

#### 8.1 Post Recycler Purchase Tender
`POST /marketplace/demands`
- **Headers:** `Authorization: Bearer <TOKEN>` (Role: `RECYCLER`)
- **Request Body:**
```json
{
  "material_code": "PET_PLASTIC",
  "target_quantity_kg": 2500.0,
  "offered_rate_pkr": 90.00,
  "minimum_quality_tier": "TIER_B",
  "deadline": "2026-10-31T18:00:00+05:00",
  "delivery_facility_address": "Plot 42, Sector 15, Korangi Industrial Area, Karachi"
}
```
- **Response (201 Created):** Returns tender ID `DEM-2026-0042` with status `OPEN`.

#### 8.2 Confirm Recycler Factory Gate Receipt
`POST /marketplace/fulfillments/{id}/confirm`
- **Headers:** `Authorization: Bearer <TOKEN>` (Role: `RECYCLER`)
- **Request Body:**
```json
{
  "factory_scale_weight_kg": 496.0,
  "weighbridge_slip_photo_url": "https://storage.safaipay.org/weighbridges/wb_492.jpg",
  "accepted_quality_tier": "TIER_A"
}
```
- **Response (200 OK):** Returns status `RECEIVED` with simulated settlement slip reference.

---

### 9. Module 8: Admin & Platform Governance

#### 9.1 Update Material Benchmark Pricing
`POST /admin/pricing/benchmarks`
- **Headers:** `Authorization: Bearer <TOKEN>` (Role: `ADMIN`)
- **Request Body:**
```json
{
  "updates": [
    {"material_code": "PET_PLASTIC", "benchmark_rate_pkr": 82.00},
    {"material_code": "CARDBOARD_OCC", "benchmark_rate_pkr": 36.50}
  ]
}
```
- **Response (200 OK):** Returns updated rate records and triggers cache invalidation.

#### 9.2 Retrieve Pilot Impact Metrics (Mandatory Estimated Labels)
`GET /admin/impact-metrics`
- **Headers:** `Authorization: Bearer <TOKEN>` (Role: `ADMIN`, `CUSTOMER`)
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total_waste_diverted_kg": 5420.0,
    "pilot_breakdown": {
      "pet_plastic_kg": 2180.0,
      "cardboard_kg": 3240.0
    },
    "environmental_metrics": {
      "estimated_co2_reduction_kg": 8130.0,
      "estimated_trees_saved": 55.0,
      "metric_label_notice": "Estimated - Calculated using standard EPA Waste Reduction Model (WARM) factors."
    },
    "social_impact": {
      "active_verified_workers": 10,
      "total_simulated_worker_earnings_pkr": 384500.00,
      "average_income_lift_percentage": 28.5
    }
  }
}
```
