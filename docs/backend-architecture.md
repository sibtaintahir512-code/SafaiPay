# SafaiPay Backend Architecture

## 1. Overview
The SafaiPay backend is built with FastAPI (Python 3.9+ / 3.11+), SQLModel / SQLAlchemy ORM, and Pydantic v2 schemas. It provides deterministic pricing calculations, finite-state machine pickup workflows, double-entry simulated ledger settlements, and role-based access control.

## 2. Directory Layout
```
backend/
├── app/
│   ├── main.py
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── security.py
│   ├── models/
│   │   ├── base.py
│   │   ├── user.py
│   │   ├── profiles.py
│   │   ├── material.py
│   │   ├── pickup.py
│   │   ├── payment.py
│   │   └── audit.py
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── profiles.py
│   │   ├── material.py
│   │   ├── pickup.py
│   │   ├── payment.py
│   │   └── audit.py
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── pricing_service.py
│   │   ├── payment_service.py
│   │   ├── state_machine.py
│   │   ├── notification_service.py
│   │   ├── otp_service.py
│   │   └── audit_service.py
│   └── api/
│       ├── deps.py
│       └── v1/
│           ├── router.py
│           ├── auth.py
│           ├── health.py
│           ├── materials.py
│           ├── pickups.py
│           ├── payments.py
│           ├── earnings.py
│           ├── admin.py
│           ├── users.py
│           └── notifications.py
├── Dockerfile
├── requirements.txt
└── safaipay.db
```

## 3. Core Architectural Modules
1. **Security & Authentication (`core/security.py`):**
   - PBKDF2/bcrypt password hashing (`passlib[bcrypt]`).
   - Stateless JWT tokens (HMAC-SHA256) encoding user ID, phone number, and array of assigned roles.
2. **Deterministic Pricing Engine (`services/pricing_service.py`):**
   - Applies benchmark material rates in PKR/kg.
   - Quality multipliers: Tier A (1.00), Tier B (0.85), Tier C (0.65).
   - Dynamic calculation breakdowns persisted with pickups.
3. **Finite State Machine (`services/state_machine.py`):**
   - Manages strict transitions: `REQUESTED` -> `ASSIGNED` -> `ACCEPTED` -> `IN_PROGRESS` -> `WEIGHT_VERIFIED` -> `COMPLETED` or `CANCELLED`.
   - Rejects illegal transitions and logs every lifecycle mutation to audit trail.
4. **Disbursement & Accounting Engine (`services/payment_service.py`):**
   - Non-custodial simulated transactions honoring SBP regulatory frameworks.
   - Generates simulated EasyPaisa, JazzCash, and Raast transaction reference numbers with idempotency verification.
