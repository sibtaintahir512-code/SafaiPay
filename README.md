# SafaiPay: Smart Waste Collection & Digital Earnings Platform
## Phase 3 Core MVP: Complete Customer-to-Collector Pickup Workflow, Transparent Pricing & Mock Payments

SafaiPay is a circular-economy waste recycling marketplace connecting waste generators (households, housing societies, commercial offices), informal waste collectors (*kabari* workers), industrial recycling buyers, and platform administrators. Beyond waste diversion, SafaiPay builds an auditable **Digital Financial Identity** for informal waste collectors in Pakistan.

---

### 1. Monorepo Architecture Overview

```
Safaipay/
├── backend/                  # FastAPI Application Core
│   ├── app/
│   │   ├── api/v1/           # Modular REST routes
│   │   │   ├── auth.py          # Registration, login, OTP request/verify, /me
│   │   │   ├── pickups.py       # Customer booking, collector assign/accept/start/verify, ratings, disputes
│   │   │   ├── payments.py      # Mock payment processing, failure simulation, retries, inventory readiness
│   │   │   ├── earnings.py      # Collector daily, weekly, monthly earnings aggregation & history
│   │   │   ├── notifications.py # User in-app notifications
│   │   │   ├── users.py         # Private profile inspection & role portals
│   │   │   ├── admin.py         # User management, suspicious records, dispute resolution, payment audits
│   │   │   ├── materials.py     # Recyclable categories & scrap benchmark pricing
│   │   │   ├── health.py        # System, database, and readiness health probes
│   │   │   └── router.py        # API v1 aggregator
│   │   ├── core/             # Configuration, security (bcrypt, JWT), async database
│   │   ├── models/           # SQLAlchemy models
│   │   │   ├── base.py          # GUID TypeDecorator, TimestampMixin
│   │   │   ├── user.py          # User, Role, UserRole
│   │   │   ├── profiles.py      # CustomerProfile, CollectorProfile, RecyclerProfile, AdminProfile
│   │   │   ├── material.py      # Material, MaterialPriceHistory
│   │   │   ├── pickup.py        # PickupRequest, PickupAssignment, WasteImage, PickupVerification, WeightRecord, Rating, Dispute, Notification
│   │   │   ├── payment.py       # PricingCalculation, Payment, CollectorEarning
│   │   │   └── audit.py         # AuditLog
│   │   ├── schemas/          # Pydantic v2 schemas and validation contracts
│   │   └── services/         # Business services
│   │       ├── state_machine.py     # Strict lifecycle transition validator
│   │       ├── pricing_service.py   # Deterministic pricing engine (Weight * Rate * Q)
│   │       ├── payment_service.py   # Mock payment sandbox (pending, processing, failed, completed)
│   │       ├── notification_service.py # In-app notification dispatcher
│   │       ├── auth_service.py      # User authentication & tokens
│   │       └── audit_service.py     # Immutable security audit logger
├── database/                 # Database Migrations & Seeds
│   ├── alembic.ini           # Alembic migration configuration
│   ├── migrations/versions/  # Migrations (001_initial_schema.py, 002_phase3_core_mvp.py)
│   └── seed.py               # Deterministic seed data script (Admin, Customers, Collectors, Recyclers)
├── ml-service/               # Autonomous AI/ML Microservice (Advisory Image Classifier & Roman Urdu NLP)
├── frontend-mobile/          # Flutter Mobile Client (iOS & Android)
├── frontend-admin/           # Next.js Web Dashboard (Admin & Recycler)
├── infrastructure/           # Docker Compose Orchestration (PostgreSQL PostGIS, Redis, Backend, ML)
├── tests/                    # Comprehensive Test Suite (25/25 Tests Passing)
│   ├── test_auth.py             # Auth, registration, password hashing, OTP tests
│   ├── test_rbac.py             # Role-based access checks, admin protection, private profiles
│   ├── test_health_and_seed.py  # Health probes, seed verification, pricing updates
│   └── test_phase3_workflow.py  # Complete end-to-end pickup lifecycle & guardrail tests
├── docs/                     # Specifications & OpenAPI Documentation
│   └── openapi.json             # Exported OpenAPI 3.1 specification schema (49 endpoints)
└── README.md
```

---

### 2. Workflow State Machine

SafaiPay enforces a strict state machine across the entire collection cycle:

```
[requested] ──(Admin/System Assign)──> [assigned] ──(Collector Accept)──> [accepted]
    │                                      │                                  │
    │                                      ├──(Collector Reject)──> [rejected] │
    │                                      │                                  │
    └──(Cancel)──> [cancelled] <───────────┴──────────(Forfeit/Reassign)───────┤
                                                                               │
                                                                   (Collector Start)
                                                                               │
                                                                               ▼
[weight_verified] <──(Collector Weigh & Grade)───────────────────────── [in_progress]
    │                                                                          │
    ├──(Customer Contests)──> [disputed] <─────────────────────────────────────┤
    │                            │                                             │
    ▼                            ▼                                             ▼
[customer_confirmed] <──(Admin Resolves)                                 [cancelled]
    │
    ▼ (Payment Intent Created)
[payment_pending] ──(Simulated Processing)──> [payment_completed] ──> [inventory_ready]
    │                                                │
    ├──(Simulated Failure)──> [payment_failed]       └──(Contested)──> [disputed]
    │                              │
    └──────(Retry Payment)─────────┘
```

Invalid state transitions (e.g., jumping from `requested` directly to `payment_completed`) are rejected by the backend with `400 Bad Request`.

---

### 3. Transparent Pricing Engine

Final transaction pricing is strictly calculated using the deterministic formula:

$$\text{Total Price (PKR)} = \text{Verified Weight (kg)} \times \text{Material Benchmark Rate (PKR/kg)} \times \text{Quality Factor}$$

- **Material Benchmark Rate:** Published by Platform Admins; exact rate applied is snapshotted in `pricing_calculations`.
- **Quality Factor ($Q$):** Bound strictly between $0.00$ and $1.00$:
  - Tier A ($Q = 1.00$): Clean, dry, uncontaminated, segregated.
  - Tier B ($Q = 0.90$): Minor dust/labels, dry.
  - Tier C ($Q = 0.75$): Moderately dusty or mixed.
  - Rejected ($Q = 0.00$): Wet, oil-contaminated, non-recyclable.
- **Estimated Labeling:** Unconfirmed initial estimates are explicitly flagged as `"is_estimated": true` and labelled `"Estimated"`.

---

### 4. Mock Payment Service

A non-custodial mock payment sandbox supports full transactional lifecycle tracking without real fiat banking:
- **`pending`**: Payment intent created upon customer confirmation.
- **`processing`**: Simulated transaction execution.
- **`completed`**: Successful payout; instantly credits `collector_earnings` and advances pickup to `payment_completed`.
- **`failed`**: Simulated failure (e.g. simulated network timeout); allows retry.
- **`disputed`**: Payment contested under mediation.
- **Duplicate Prevention:** Re-processing a completed payment returns `409 Conflict`.

---

### 5. Quickstart & Running the Backend

#### 5.1 Run Migrations & Seed Data
```bash
source .venv/bin/activate
alembic -c database/alembic.ini upgrade head
python database/seed.py
```

#### 5.2 Start Backend Server
```bash
PYTHONPATH=backend uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- **Live Swagger API Docs:** [`http://localhost:8000/docs`](http://localhost:8000/docs)
- **ReDoc:** [`http://localhost:8000/redoc`](http://localhost:8000/redoc)

---

### 6. End-to-End API Usage Examples (cURL)

#### Step 1: Customer Creates Pickup Request
```bash
curl -X POST http://localhost:8000/api/v1/pickups \
  -H "Authorization: Bearer <CUSTOMER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "material_code": "PET_PLASTIC",
    "estimated_quantity_kg": 15.0,
    "street_address": "Falcon Complex, PECHS Block 6, Karachi",
    "preferred_time": "2026-10-25T10:00:00Z",
    "notes": "15 kg clean plastic bottles"
  }'
```

#### Step 2: Admin Assigns Collector
```bash
curl -X POST http://localhost:8000/api/v1/pickups/<PICKUP_ID>/assign \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"collector_id": "<COLLECTOR_UUID>"}'
```

#### Step 3: Collector Accepts Job
```bash
curl -X POST http://localhost:8000/api/v1/pickups/<PICKUP_ID>/accept \
  -H "Authorization: Bearer <COLLECTOR_TOKEN>"
```

#### Step 4: Collector Starts Pickup (GPS Coordinates)
```bash
curl -X POST http://localhost:8000/api/v1/pickups/<PICKUP_ID>/start \
  -H "Authorization: Bearer <COLLECTOR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"gps_latitude": 24.8640, "gps_longitude": 67.0600}'
```

#### Step 5: Collector Inputs Scale Weight & Quality
```bash
curl -X POST http://localhost:8000/api/v1/pickups/<PICKUP_ID>/verify-weight \
  -H "Authorization: Bearer <COLLECTOR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "verified_weight_kg": 20.0,
    "quality_factor": 0.95,
    "scale_photo_url": "https://storage.safaipay.org/photos/scale.jpg"
  }'
```

#### Step 6: Customer Confirms Completion
```bash
curl -X POST http://localhost:8000/api/v1/pickups/<PICKUP_ID>/confirm-completion \
  -H "Authorization: Bearer <CUSTOMER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Verified weight and price confirmed"}'
```

#### Step 7: Process Mock Payment
```bash
curl -X POST http://localhost:8000/api/v1/payments/<PAYMENT_ID>/process-mock \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

#### Step 8: Collector Views Daily & Weekly Earnings
```bash
curl -X GET http://localhost:8000/api/v1/earnings/summary \
  -H "Authorization: Bearer <COLLECTOR_TOKEN>"
```

---

### 7. Test Results (25/25 Tests Passing)

Execute the full automated test suite:
```bash
pytest -v tests
```

```text
============================= test session starts ==============================
platform darwin -- Python 3.9.6, pytest-8.4.2, pluggy-1.6.0
rootdir: /Users/a123/Documents/Safaipay

tests/test_auth.py::test_password_hashing_verification PASSED            [  4%]
tests/test_auth.py::test_successful_registration PASSED                  [  8%]
tests/test_auth.py::test_duplicate_phone_rejection PASSED                [ 12%]
tests/test_auth.py::test_duplicate_email_rejection PASSED                [ 16%]
tests/test_auth.py::test_successful_login_with_phone PASSED              [ 20%]
tests/test_auth.py::test_successful_login_with_email PASSED              [ 24%]
tests/test_auth.py::test_invalid_login_rejection_wrong_password PASSED   [ 28%]
tests/test_auth.py::test_invalid_login_rejection_non_existent_user PASSED [ 32%]
tests/test_auth.py::test_otp_request_and_verification PASSED             [ 36%]
tests/test_health_and_seed.py::test_health_check_endpoints PASSED        [ 40%]
tests/test_health_and_seed.py::test_seed_data_verification PASSED        [ 44%]
tests/test_health_and_seed.py::test_admin_update_material_rate PASSED    [ 48%]
tests/test_phase3_workflow.py::test_complete_successful_pickup_workflow PASSED [ 52%]
tests/test_phase3_workflow.py::test_invalid_state_transition_rejection PASSED [ 56%]
tests/test_phase3_workflow.py::test_customer_cannot_change_collector_verified_weight PASSED [ 60%]
tests/test_phase3_workflow.py::test_collector_cannot_access_another_collector_earnings PASSED [ 64%]
tests/test_phase3_workflow.py::test_invalid_weight_rejection PASSED      [ 68%]
tests/test_phase3_workflow.py::test_invalid_quality_factor_rejection PASSED [ 72%]
tests/test_phase3_workflow.py::test_duplicate_payment_confirmation PASSED [ 76%]
tests/test_phase3_workflow.py::test_payment_failure_and_retry PASSED     [ 80%]
tests/test_phase3_workflow.py::test_pickup_cancellation PASSED           [ 84%]
tests/test_phase3_workflow.py::test_dispute_creation_and_resolution PASSED [ 88%]
tests/test_rbac.py::test_role_based_access_checks PASSED                 [ 92%]
tests/test_rbac.py::test_admin_only_endpoint_protection PASSED           [ 96%]
tests/test_rbac.py::test_private_profile_access_rule PASSED              [100%]

============================== 25 passed in 8.74s ==============================
```

---

### 8. Demo Credentials Reference

| Role | Entity / User | Phone | Email | Password |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | SafaiPay Platform Superadmin | `+923000000000` | `admin@safaipay.org` | `AdminPassword123!` |
| **Customer** | Falcon Complex Gated Society | `+923001110001` | `falcon@complex.pk` | `SafaiPassword123!` |
| **Customer** | Systems Limited (Commercial) | `+923001110003` | `facility@systemsltd.com`| `SafaiPassword123!` |
| **Collector** | Muhammad Rafiq (Tricycle) | `+923002220001` | *N/A (Phone Login)* | `SafaiPassword123!` |
| **Collector** | Tariq Mehmood (Tricycle) | `+923002220002` | *N/A (Phone Login)* | `SafaiPassword123!` |
| **Recycler** | Indus Polymers Ltd (PET) | `+923003330001` | `procurement@indusplastic.pk`| `SafaiPassword123!` |

---

### 9. Web Dashboard & Role Portals (Next.js 14)

SafaiPay includes a full Next.js App Router web application in `frontend-admin/` providing dedicated role dashboards:
- **Resident / Business Customer (`/customer/dashboard`):** Recyclable waste pickup booking, live timeline tracking, digital scale receipt verification, collector rating, and dispute logging.
- **Informal Collector (`/collector/dashboard`):** Shift status toggle (Online/Offline), nearby jobs acceptance, GPS coordinates start, certified digital scale weight logging, and weekly earnings analytics.
- **Industrial Recycler (`/recycler/dashboard`):** B2B scrap marketplace, certified available inventory distribution, quality purity donuts, and batch procurement requests.
- **Superadmin Portal (`/admin/dashboard`):** Operations ledger, collector fleet dispatching, benchmark scrap index adjustments with confirmation audit guardrails, and automated fraud alerts.

---

### 10. Local Setup & Execution Guide

#### Backend (FastAPI + SQLite/PostgreSQL)
```bash
# 1. Activate virtual environment
source .venv/bin/activate

# 2. Install requirements
pip install -r backend/requirements.txt

# 3. Seed database
PYTHONPATH=backend python database/seed.py

# 4. Start backend API server
uvicorn app.main:app --app-dir backend --reload --port 8000
```
API Documentation will be live at: [http://localhost:8000/docs](http://localhost:8000/docs)

#### Frontend Web Portal (Next.js 14)
```bash
# 1. Navigate to frontend directory
cd frontend-admin

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portal.

---

### 11. Vercel Deployment Instructions

The Next.js web application is built for seamless Vercel deployment:
1. **Root Directory for Vercel:** `frontend-admin` (or root with framework preset Next.js and root directory set to `frontend-admin`).
2. **Build Command:** `npm run build`
3. **Output Directory:** `.next`
4. **Environment Variables:**
   - `NEXT_PUBLIC_API_URL` (optional: defaults to `/api/v1`)
   - `BACKEND_URL` (optional: external FastAPI service URL if deployed, otherwise serverless API routes handle demo flows)

---

### 12. Known Limitations & Future Scope Boundaries

- **Advanced Route Optimization (TSP):** Nearest-job filtering is supported; automated traveling-salesperson multi-stop optimization is planned for Phase 4.
- **Production Banking & PSP Custody:** Payments are simulated via the mock service in compliance with SBP non-custody guidelines. Real payment rail integrations (e.g. Raast/1Link live PSPs) require formal licensing in Phase 4.
- **Automated Lender Export:** Financial scoring export remains locked under explicit worker opt-in consent protocols.

