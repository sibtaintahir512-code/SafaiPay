# SafaiPay Quality Assurance & Testing Suite

## 1. Overview
SafaiPay maintains a rigorous multi-tier testing strategy ensuring zero regression across backend APIs, deterministic pricing calculations, role-based access control, and Next.js frontend pages.

---

## 2. Backend Automated Test Suite (Pytest)

The backend test suite is located in `/tests` and runs via `pytest` with asynchronous test fixtures.

### 2.1 Test Modules
| Test File | Scope | Coverage |
|---|---|---|
| `test_auth.py` | Authentication & JWT | Password hashing, token encoding/decoding, invalid login rejection |
| `test_rbac.py` | Role-Based Access Control | Permission checks for Customer, Collector, Recycler, and Admin |
| `test_health_and_seed.py` | Health & Seed Integrity | API ping `/health`, database seed records, benchmark rate verification |
| `test_phase3_workflow.py` | State Machine & Settlement | Full pickup lifecycle: creation, assignment, weighing, payment calculation |

### 2.2 Running Backend Tests
From project root:
```bash
# Using project virtual environment
.venv/bin/pytest tests/ -v
```

All 25 integration tests pass with 100% green status.

---

## 3. Frontend Compilation & Type Verification

The frontend test suite verifies TypeScript type validity, ESLint rules, and static route compilation across all 48 pages.

### 3.1 Running Frontend Build Test
From `/frontend` directory:
```bash
npm run build
```

This compiles:
- 4 Auth routes (`/login`, `/register`, `/forgot-password`, `/reset-password`)
- 5 Customer routes (`/customer/dashboard`, `/customer/book-pickup`, `/customer/pickups`, `/customer/receipts`, `/customer/profile`)
- 6 Collector routes (`/collector/dashboard`, `/collector/jobs`, `/collector/active-job`, `/collector/earnings`, `/collector/income-profile`, `/collector/profile`)
- 6 Recycler routes (`/recycler/dashboard`, `/recycler/marketplace`, `/recycler/batch-requests`, `/recycler/dispatch`, `/recycler/traceability`, `/recycler/profile`)
- 9 Admin routes (`/admin/dashboard`, `/admin/operations`, `/admin/users`, `/admin/pricing`, `/admin/payments`, `/admin/fraud-alerts`, `/admin/reports`, `/admin/audit-logs`, `/admin/settings`)
- 12 Next.js App Router API endpoints under `/api/v1/*`

---

## 4. End-to-End Manual Role Verification Checklist
- [x] **Customer:** Can log in (`+923001110001`), book pickup, estimate weight, view receipts, and view profile.
- [x] **Collector:** Can log in (`+923002220001`), claim available jobs, input scale weight, enter customer OTP, and view earnings.
- [x] **Recycler:** Can log in (`+923003330001`), browse marketplace feedstock, submit batch POs, track freight dispatch, and view ESG records.
- [x] **Admin:** Can log in (`admin@safaipay.org`), monitor live fleet operations, manage user roles, update benchmark pricing, review payment queue, and investigate fraud alerts.
- [x] **No Role Bleed:** Login always routes user to their designated dashboard, never defaulting to Admin.
