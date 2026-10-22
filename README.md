# SafaiPay: Smart Waste Recycling & Digital Financial Inclusion Platform

**Repository:** [https://github.com/sibtaintahir512-code/SafaiPay](https://github.com/sibtaintahir512-code/SafaiPay)  
**Live Application (Vercel):** [https://frontend-eight-livid-47.vercel.app](https://frontend-eight-livid-47.vercel.app)  
**Production Deployment Hash:** [https://safaipay-93di043iw-sibtain-abbas1.vercel.app](https://safaipay-93di043iw-sibtain-abbas1.vercel.app)  
**Vercel Project Dashboard:** [https://vercel.com/sibtain-abbas1/frontend](https://vercel.com/sibtain-abbas1/frontend)

SafaiPay is an AI-enabled circular-economy recycling marketplace connecting waste generators (households, housing societies, commercial offices), certified informal collectors (*kabari* workers), industrial recycling buyers, and municipal/platform administrators. Beyond zero-landfill diversion, SafaiPay builds an auditable, verifiable **Digital Financial Identity** for informal waste workers across Pakistan.

---

## 1. Role Architecture & Dashboards

SafaiPay provides role-based dashboards with zero-trust access control:

- **Customer (`/customer/*`):** Doorstep recyclable waste pickup booking, AI material classification, approximate weight entry, real-time status tracking, verified digital receipts, and real-time chat with assigned collectors.
- **Collector (`/collector/*`):** On/off-duty dispatch availability, nearby job acceptance, IoT calibrated digital scale weight recording, tare deduction, photo evidence upload, customer mutual confirmation OTP, step-by-step job execution stepper, and daily/monthly digital income ledger.
- **Recycler (`/recycler/*`):** B2B wholesale marketplace for bulk sorted feedstocks (PET Flakes, OCC Cardboard, HDPE, Metals), batch Purchase Orders, dual photo inspection, freight dispatch weighbridge monitoring, and immutable ESG chain-of-custody audit logs.
- **Admin (`/admin/*`):** Real-time fleet operations command center, user management & biometric KYC vetting, dynamic benchmark scrap rates in PKR/kg, payment gateway reconciliation, computer vision fraud alerts, and executive circular analytics.

---

## 2. Staging Architecture Overview

```mermaid
flowchart TD
    User["End User / Mobile Browser"] --> Vercel["Vercel Edge Network (Next.js 14 Frontend)"]
    Vercel --> Rewrites["/api/v1/:path* Rewrites"]
    Rewrites --> Backend["FastAPI Backend (Async SQLAlchemy + asyncpg)"]
    
    subgraph StagingCloud["Managed Cloud Staging Infrastructure"]
        Backend --> Supabase["Supabase PostgreSQL 16 + PostGIS (Port 5432 / 6543)"]
        Backend --> Upstash["Upstash Redis (TLS rediss://) - Rate Limiting"]
        Backend --> Storage["Object Storage / File Engine (MIME & Traversal Protected)"]
    end

    subgraph SecurityShield["Security & Governance Layers"]
        CSP["Content-Security-Policy & OWASP Headers"]
        Limiter["Distributed Sliding-Window Rate Limiter (HTTP 429 + Retry-After)"]
        PII["Automated PII Masking (CNIC, Phone, Tokens)"]
        Sandbox["Payment Sandbox Mode (Zero Real Payment Keys)"]
    end
```

---

## 3. Supabase PostgreSQL + PostGIS Setup Guide

SafaiPay connects asynchronously via `asyncpg` to Supabase PostgreSQL 16 with full spatial query support.

### 3.1 Provisioning Supabase Database
1. Create a project at [Supabase Dashboard](https://supabase.com).
2. Navigate to **Project Settings** > **Database** to obtain your connection strings.
3. Under **Database** > **Extensions**, search for `postgis` and toggle it **ON** (or run `CREATE EXTENSION IF NOT EXISTS postgis;` in the SQL Editor). SafaiPay's migration `001_initial_schema.py` will also attempt to enable it automatically.

### 3.2 Direct Connection vs. Transaction Pooler (PgBouncer)
SafaiPay supports both direct connections and Supabase connection poolers:

- **Direct Connection (Recommended for persistent FastAPI backends):**
  ```env
  DATABASE_URL=postgresql+asyncpg://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?ssl=require
  DB_USE_NULL_POOL=false
  DB_POOL_SIZE=5
  DB_MAX_OVERFLOW=5
  ```
- **Transaction Pooler (Recommended for Serverless / AWS Lambda / Vercel):**
  Connecting via port `6543` requires disabling prepared statement caches:
  ```env
  DATABASE_URL=postgresql+asyncpg://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?ssl=require
  DB_USE_NULL_POOL=true
  ```
  SafaiPay automatically detects port `6543` or `pooler.supabase.com` and sets `connect_args["statement_cache_size"] = 0` to prevent PgBouncer transaction errors.

---

## 4. Upstash Redis Setup Guide

SafaiPay uses Upstash Redis for distributed sliding-window rate limiting across multiple backend instances.

1. Create a database at [Upstash Console](https://console.upstash.com).
2. Choose your nearest region and copy the `rediss://` TLS connection string.
3. Configure your staging environment:
   ```env
   REDIS_URL=rediss://default:[YOUR-UPSTASH-PASSWORD]@[YOUR-ENDPOINT].upstash.io:6379
   REDIS_MOCK_FALLBACK=True
   REDIS_FALLBACK_MODE=warning
   ```
4. **Fallback Behavior:**
   - **Staging / Dev:** If Redis is temporarily unreachable, SafaiPay logs a warning and seamlessly falls back to a thread-safe in-memory sliding window counter.
   - **Production:** Configurable via `REDIS_FALLBACK_MODE=warning` or `REDIS_FALLBACK_MODE=fail_closed` (rejects requests with HTTP 503 if the distributed rate-limiter is offline).
5. **Credential Protection:** Redis passwords, tokens, and raw hostnames are automatically masked by `mask_redis_url()` and are never output to logs or diagnostics endpoints.

---

## 5. Environment Variables Reference

SafaiPay environment configuration template ([`.env.example`](file:///.env.example)):

```ini
# Core Application Environment
APP_ENV=staging
ENVIRONMENT=staging
LOG_LEVEL=INFO
PROJECT_NAME=SafaiPay
API_V1_PREFIX=/api/v1

# Security & JWT Tokens (Generate: openssl rand -hex 32)
SECRET_KEY=replace-with-a-long-random-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Supabase PostgreSQL / PostGIS Database Connection
DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST:5432/DATABASE?ssl=require

# Database Connection Pooling Configuration
DB_POOL_SIZE=5
DB_MAX_OVERFLOW=5
DB_POOL_TIMEOUT=30
DB_POOL_RECYCLE=1800
DB_USE_NULL_POOL=false
DB_SSL_MODE=require

# Upstash Redis for Distributed Rate Limiting
REDIS_URL=rediss://USER:PASSWORD@HOST:PORT
REDIS_MOCK_FALLBACK=True
REDIS_FALLBACK_MODE=warning

# CORS Allowed Origins
CORS_ORIGINS=https://your-staging-domain.vercel.app

# External Service Provider Adapters (Sandbox Modes)
STORAGE_PROVIDER=local
MAPS_PROVIDER=osm
AI_PROVIDER=mock
PAYMENT_PROVIDER=sandbox

# Phone / SMS / OTP Service Configuration
OTP_MOCK_MODE=True
OTP_DEFAULT_CODE=123456
OTP_EXPIRATION_SECONDS=300

# Payment Gateway Sandbox Configuration
PAYMENT_GATEWAY_SANDBOX=true
PAYMENT_WEBHOOK_SECRET=staging-sandbox-webhook-secret-key-32-chars
RAAST_SANDBOX_MERCHANT_ID=MCH_SANDBOX_001
EASYPAISA_SANDBOX_STORE_ID=STORE_SANDBOX_001

# Seed Configuration
SEED_DEMO_USERS=false
DEFAULT_ADMIN_EMAIL=admin@safaipay.org
DEFAULT_ADMIN_PHONE=+923000000000
DEFAULT_ADMIN_PASSWORD=replace-with-a-secure-admin-password
DEFAULT_DEMO_PASSWORD=replace-with-a-secure-demo-password
```

> [!CAUTION]
> **Zero Secrets Policy:** Never commit `.env` or real API keys to git. Production payment gateway keys (Raast, Easypaisa, JazzCash) must only be injected via cloud secret managers (AWS Secrets Manager, Doppler, Vercel Environment Variables, or GitHub Secrets).

---

## 6. Alembic Migrations Playbook

Schema modifications are managed exclusively via versioned Alembic migrations. `Base.metadata.create_all()` is strictly bypassed in staging and production.

```bash
# 1. Inspect current applied migration revision
cd backend
../.venv/bin/alembic -c alembic.ini current

# 2. Check pending SQL statements without applying them (Dry Run)
../.venv/bin/alembic -c alembic.ini upgrade head --sql

# 3. Apply all migrations up to head (Versions 001, 002, 003)
../.venv/bin/alembic -c alembic.ini upgrade head

# 4. Idempotently seed reference catalogs (materials, benchmark rates, roles)
python -m database.seed

# 5. Rollback verification (safely test emergency downgrade)
../.venv/bin/alembic -c alembic.ini downgrade -1
../.venv/bin/alembic -c alembic.ini upgrade head
```

---

## 7. Local Development & Docker Setup

### 7.1 Local Python + Node Environment
```bash
# Backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Frontend
cd frontend
npm install
npm run dev
```

### 7.2 Docker Compose (PostGIS 16 + Redis 7 + Backend + Frontend)
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/api/v1`
- OpenAPI Documentation: `http://localhost:8000/docs`

---

## 8. Render Backend Deployment Configuration (FastAPI Docker)

SafaiPay backend is fully optimized for **Render Web Service** deployment using Docker and dynamic `$PORT` binding.

### 8.1 Render Dashboard Settings
Create a new service at [Render Dashboard](https://dashboard.render.com):
- **Service Type:** Web Service
- **Source:** Connect your GitHub repository (`SafaiPay`)
- **Branch:** `main`
- **Root Directory:** `backend` (or leave blank if using `render.yaml` at repo root)
- **Runtime:** `Docker`
- **Dockerfile Path:** `backend/Dockerfile` (or `Dockerfile` if Root Directory is `backend`)
- **Health Check Path:** `/health/ready`
- **Auto-Deploy:** `Yes`

### 8.2 Dynamic Port Binding
Render dynamically assigns a private `$PORT` to the container. SafaiPay's [`backend/Dockerfile`](file:///backend/Dockerfile) automatically binds to `${PORT:-8000}`:
```dockerfile
ENV PORT=8000
EXPOSE 8000
CMD sh -c "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"
```

### 8.3 Required Environment Variables in Render Dashboard
Under **Environment Variables** in your Render Web Service:

| Variable Name | Staging Value | Note |
|---|---|---|
| `APP_ENV` | `staging` | Sets logging & staging mode |
| `ENVIRONMENT` | `staging` | Sanitizes errors & disables DDL creation |
| `DATABASE_URL` | `postgresql+asyncpg://...` | Supabase connection string with `?ssl=require` |
| `REDIS_URL` | `rediss://default:...` | Upstash Redis connection string (TLS enabled) |
| `SECRET_KEY` | `[secure-random-token]` | Generate via `openssl rand -hex 32` |
| `JWT_ALGORITHM` | `HS256` | JWT signing algorithm |
| `CORS_ORIGINS` | `https://your-vercel-staging.vercel.app` | Comma-separated allowed frontend origins |
| `DB_POOL_SIZE` | `5` | Persistent connection pool size |
| `DB_MAX_OVERFLOW` | `5` | Maximum burst connections |
| `DB_USE_NULL_POOL` | `false` | Set `false` for persistent Render servers |
| `DB_SSL_MODE` | `require` | Enforces SSL for Supabase PostgreSQL |
| `PAYMENT_MODE` | `sandbox` | Enforces mock/sandbox payment mode |
| `PAYMENT_GATEWAY_SANDBOX` | `true` | Isolates ledger from live payment gateways |
| `SEED_DEMO_USERS` | `false` | Prevents auto-seeding demo accounts |

### 8.4 Database Migrations on Render
- **Pre-Deploy Hook (Render Standard/Pro plans):** Configure Pre-Deploy Command: `alembic upgrade head`.
- **Manual/CLI Migration (Free/Starter plans):** If your plan does not support pre-deploy commands, execute migrations manually before deploying:
  ```bash
  cd backend
  DATABASE_URL="your-supabase-db-url" ../.venv/bin/alembic -c alembic.ini upgrade head
  ```
- **Zero Startup DDL:** SafaiPay strictly avoids running migrations on container startup to prevent race conditions across multi-replica deployments.

### 8.5 Infrastructure-As-Code (Render Blueprint)
You can also deploy the backend instantly via Render's Blueprint feature using the included [`render.yaml`](file:///render.yaml). Simply navigate to **Blueprints** > **New Blueprint Instance** in the Render Dashboard.

---

## 9. Vercel Staging Deployment Configuration

### 9.1 Project Settings in Vercel UI
- **Root Directory:** `frontend` (Recommended)
- **Framework Preset:** `Next.js`
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

### 9.2 Environment Variables in Vercel Dashboard
Configure the following in **Vercel Project Settings > Environment Variables**:

| Variable Name | Environment | Value Description |
|---|:---:|---|
| `NEXT_PUBLIC_API_URL` | Production & Preview | `/api/v1` (Proxied via Next.js rewrites) |
| `BACKEND_URL` | Production & Preview | `https://your-render-backend-url.onrender.com` (Target FastAPI service) |
| `NEXT_TELEMETRY_DISABLED` | All | `1` |

> [!NOTE]
> `DATABASE_URL`, `REDIS_URL`, and `SECRET_KEY` are backend-only variables and must **NOT** be added to the frontend Vercel environment unless running self-contained Next.js serverless functions.

---

## 10. Staging Smoke-Test Checklist

Before promoting staging builds to production, execute this verification checklist:

- [x] **Database Connectivity:** `GET /health/db` returns `status: healthy` and live migration revision.
- [x] **Redis Connectivity:** `GET /health/redis` returns operational status without leaking credentials.
- [x] **Rate Limiting:** Sequential requests to `/api/v1/auth/login` trigger HTTP 429 and `Retry-After` header.
- [x] **Database Failure Sanitization:** Simulated DB outages return generic `Database connectivity failed` without internal traces.
- [x] **Alembic Migration:** Database can migrate cleanly from empty state to `003` head revision.
- [x] **Authentication & Session:** Customer registration, login, JWT token issuance, and authenticated logout function seamlessly.
- [x] **Role Guardrails & IDOR:** Customers cannot access Collector/Recycler/Admin endpoints or other users' profiles.
- [x] **Pickup Lifecycle:** Complete job workflow (booking -> collector acceptance -> GPS navigation -> photo proof -> digital scale weight -> instant receipt) executes reliably.
- [x] **Chat & Realtime:** WebSocket streaming and audio voice note playback operate within CSP constraints.
- [x] **File Upload Security:** Script/executable file uploads are blocked by binary magic-byte inspection.
- [x] **Zero Secret Leaks:** Clean secret scan across all git-tracked files.

---

## 11. Production Launch Checklist

- [ ] Managed PostgreSQL Multi-AZ cluster provisioned with daily automated PITR snapshots.
- [ ] Production `SECRET_KEY` generated with minimum 32 random characters (`openssl rand -hex 32`).
- [ ] `ENVIRONMENT=production` and `APP_ENV=production` set on backend instances.
- [ ] `CORS_ORIGINS` locked strictly to production domain (no wildcards).
- [ ] Upstash Redis or AWS ElastiCache cluster provisioned with SSL (`rediss://`).
- [ ] Edge WAF (Cloudflare or AWS CloudFront) enabled with Layer-7 DDoS protection.
- [ ] Live merchant credentials for Raast / Easypaisa injected via cloud secrets manager.
- [ ] Prometheus metrics and Sentry error alerting connected to `/health` probes.

---

## 12. Payment Gateway Sandbox Configuration

SafaiPay operates in sandbox mode for all non-production environments:
- `PAYMENT_MODE=sandbox`
- `PAYMENT_PROVIDER=sandbox`
- `PAYMENT_GATEWAY_SANDBOX=true`
- Webhook endpoints verify sandbox HMAC signatures using `PAYMENT_WEBHOOK_SECRET`.
- Simulated payouts credit the collector's digital ledger without transferring fiat currency.

---

## 13. Backup, Restore & Rollback Instructions

### Database Backup
```bash
# Dump remote Supabase/PostgreSQL schema and data
pg_dump -h db.[PROJECT-REF].supabase.co -U postgres -d postgres -F c -b -v -f safaipay_backup_$(date +%F).dump
```

### Database Restore
```bash
# Restore into target staging/recovery database
pg_restore -h db.[PROJECT-REF].supabase.co -U postgres -d postgres -v -c safaipay_backup_2026-10-22.dump
```

### Emergency Alembic Rollback
```bash
# Roll back exactly one migration revision
cd backend
../.venv/bin/alembic -c alembic.ini downgrade -1
```
