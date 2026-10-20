# SafaiPay: Smart Waste Recycling & Digital Financial Inclusion Platform

SafaiPay is an AI-enabled circular-economy recycling marketplace connecting waste generators (households, housing societies, commercial offices), certified informal collectors (*kabari* workers), industrial recycling buyers, and municipal/platform administrators. Beyond zero-landfill diversion, SafaiPay builds an auditable, verifiable **Digital Financial Identity** for informal waste workers across Pakistan.

---

## 1. Project Overview & Role Architecture

SafaiPay provides tailor-made, role-based dashboards with strict route guards:

- **Customer (`/customer/*`):** Doorstep recyclable waste pickup booking, AI material classification, approximate weight entry, real-time status tracking, and verified digital receipts.
- **Collector (`/collector/*`):** On/off-duty dispatch availability, nearby job acceptance, IoT calibrated digital scale weight recording, tare deduction, photo evidence upload, customer mutual confirmation OTP, and daily/monthly digital income ledger.
- **Recycler (`/recycler/*`):** B2B wholesale marketplace for bulk sorted feedstocks (PET Flakes, OCC Cardboard, HDPE, Metals), batch Purchase Orders, freight dispatch weighbridge monitoring, and immutable ESG chain-of-custody audit logs.
- **Admin (`/admin/*`):** Real-time fleet operations command center, user management & biometric KYC vetting, dynamic benchmark scrap rates in PKR/kg, payment gateway reconciliation, computer vision fraud alerts, and executive circular analytics.

---

## 2. Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide React, Bilingual Urdu & English localization (`LanguageContext`).
- **Backend:** FastAPI (Python 3.9+ / 3.11+), SQLModel / SQLAlchemy ORM, Pydantic v2 schemas, Passlib (bcrypt), PyJWT (HMAC-SHA256).
- **Database:** PostgreSQL 16 (production with PostGIS spatial extension) / SQLite (local development and test suite).
- **Containerization & Deployment:** Docker, Docker Compose, Vercel Edge Network.

---

## 3. Directory Layout

```
safaipay/
├── frontend/                     # Next.js 14 Web Application
│   ├── app/                      # App router role groups: (auth), (customer), (collector), (recycler), (admin)
│   ├── components/               # Reusable UI cards, tables, charts, navigation, navbar
│   ├── context/                  # AuthContext (role state, login/logout), LanguageContext (EN/UR)
│   ├── lib/                      # api.ts (health probing & dual-mode sync), types.ts, mockData.ts
│   ├── tests/                    # Frontend routing and guardrail test suites
│   ├── Dockerfile                # Production multi-stage Next.js Dockerfile
│   └── package.json
├── backend/                      # FastAPI Application Core
│   ├── app/
│   │   ├── main.py               # Application entrypoint & CORS middleware
│   │   ├── config/               # Settings, security, database configurations
│   │   ├── database/             # Connection, Base, and Seed modules
│   │   ├── models/               # SQLAlchemy models (User, Pickup, Material, Payment, Audit, Batch, Dispatch)
│   │   ├── schemas/              # Pydantic v2 validation contracts
│   │   ├── services/             # Pricing engine, state machine, payment sandbox, AI CV, route service
│   │   └── api/                  # Versioned API routes & dependency injection
│   ├── Dockerfile                # Backend containerization
│   └── requirements.txt
├── docs/                         # Comprehensive Technical Specifications
│   ├── architecture.md           # High-level architecture & tenets
│   ├── frontend-architecture.md  # Frontend component & state architecture
│   ├── backend-architecture.md   # Backend services & state machine
│   ├── database-schema.md        # Relational ERD & data dictionary
│   ├── api-documentation.md      # REST endpoints & OpenAPI schemas
│   ├── authentication-flow.md    # JWT issuance & role-based routing flow
│   ├── role-permissions.md       # Zero-trust RBAC operational matrix
│   ├── user-flows.md             # 4 end-to-end customer/collector/recycler/admin journeys
│   ├── deployment.md             # Production Vercel & Docker deployment guide
│   ├── security.md               # Cryptography, PII masking & fraud prevention
│   └── testing.md                # Test execution and verification
├── tests/                        # Backend Automated Test Suite (25/25 Passing)
│   ├── test_auth.py              # Password hashing & JWT token verification
│   ├── test_rbac.py              # Role permissions & access guardrails
│   ├── test_health_and_seed.py   # Health checks & database seed cohort verification
│   └── test_phase3_workflow.py   # End-to-end collection workflow & pricing calculations
├── docker-compose.yml            # Multi-service full-stack orchestration
├── .env.example                  # Sanitized environment variable template
└── README.md
```

---

## 4. Local Setup Steps

### 4.1 Prerequisites
- Python 3.9+ or Python 3.11+
- Node.js 18+ and npm
- Docker & Docker Compose (optional for containerized run)

### 4.2 Backend Setup
1. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
3. Initialize environment variables:
   ```bash
   cp .env.example .env
   ```
4. Start the backend service:
   ```bash
   cd backend
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   FastAPI interactive OpenAPI docs will be available at `http://localhost:8000/docs`.

### 4.3 Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

### 4.4 Docker Compose (One-Command Full Stack)
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/api/v1`

---

## 5. Demo Accounts & Test Credentials

The platform is pre-seeded with dedicated test accounts across all 4 operational personas. Logging in dynamically directs each user strictly to their corresponding verified role dashboard:

| Persona Role | Username / Identifier | Password | Destination Dashboard |
|---|---|---|---|
| **Admin** | `admin@safaipay.org` | `AdminPassword123!` | `/admin/dashboard` |
| **Customer** | `+923001110001` | `SafaiPassword123!` | `/customer/dashboard` |
| **Collector** | `+923002220001` | `SafaiPassword123!` | `/collector/dashboard` |
| **Recycler** | `+923003330001` | `SafaiPassword123!` | `/recycler/dashboard` |

> [!NOTE]
> All logins use secure PBKDF2/Bcrypt password hashing and rate-limited authentication. Brute-force protection automatically locks accounts for 15 minutes after 5 consecutive failed attempts.

---

## 6. Running Tests

### 6.1 Backend Test Suite (Pytest)
From project root:
```bash
./.venv/bin/pytest tests/ -v
```
Output:
```
============================== 34 passed in 13.20s ==============================
```
Covers:
- RBAC, route protection, and private profile boundaries
- Complete 11-step pickup workflow from booking to inventory readiness
- Pricing engine calculation ($P = W \times R \times Q$) and immutable snapshots
- Digital scale weight bounds ($W > 0, 0.0 \le Q \le 1.0$) and customer tampering block
- AI Computer Vision classification pre-screening and advisory disclaimers
- Recycler B2B marketplace batch creation, procurement orders, and freight dispatch manifests
- Digital financial identity credit score (4 explainable pillars), explicit user consent gate, and CSV export
- Collector biometric CNIC & digital scale KYC approval/rejection workflows
- ESG impact analytics and circular CO2 abatement metrics

### 6.2 Frontend Production Build & Route Compilation
From `/frontend` directory:
```bash
npm run build
```
Output:
```
✓ Generating static pages (56/56)
✓ Compiled successfully
```

---

## 7. Production Deployment (Vercel)

- **Live Production URL:** [https://safaipay.vercel.app](https://safaipay.vercel.app)
- **GitHub Repository:** [https://github.com/sibtaintahir512-code/SafaiPay](https://github.com/sibtaintahir512-code/SafaiPay)

The frontend is deployed to Vercel with serverless API route handlers and zero-config edge routing:
```bash
cd frontend
npx vercel deploy --prod
```
The application features resilient edge full-stack operation: when the standalone FastAPI backend is configured via `FASTAPI_BACKEND_URL`, requests are forwarded directly; otherwise, Next.js serverless route handlers ensure 100% interactive operations, instant role-based redirects, and complete marketplace functionality.


