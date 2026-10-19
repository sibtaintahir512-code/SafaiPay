# SafaiPay Production Deployment Guide

## 1. Overview
SafaiPay is designed for modern cloud containerization and edge hosting:
- **Frontend:** Next.js 14 App Router, optimized for Vercel or Docker container deployments.
- **Backend:** FastAPI (Python 3.9+ / 3.11+), ASGI production server (Uvicorn / Gunicorn).
- **Database:** PostgreSQL 16 (production) / SQLite (local / preview).

---

## 2. Vercel Frontend Deployment

### 2.1 Configuration (`vercel.json`)
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next"
}
```

### 2.2 Deployment Steps via Vercel CLI
1. Navigate to frontend root:
   ```bash
   cd frontend
   ```
2. Deploy to preview:
   ```bash
   vercel
   ```
3. Deploy to production:
   ```bash
   vercel --prod
   ```

### 2.3 Required Frontend Environment Variables
| Variable | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.safaipay.org/api/v1` or `/api/v1` | Points to FastAPI gateway or Next.js API routes |
| `NODE_ENV` | `production` | Production build optimization |

---

## 3. Docker Compose Deployment (Full Stack)

### 3.1 Running Full Stack Locally or on Cloud VPS
To bring up both backend (port 8000) and frontend (port 3000):
```bash
docker-compose up --build -d
```

### 3.2 Service Endpoints
- **Frontend Portal:** `http://localhost:3000`
- **FastAPI Backend API:** `http://localhost:8000/api/v1`
- **Interactive OpenAPI Docs:** `http://localhost:8000/docs`
- **Health Check:** `http://localhost:8000/api/v1/health`

---

## 4. Production Security Hardening
1. Never commit `.env` or secrets to version control.
2. Enforce HTTPS / TLS 1.3 via Cloudflare or Nginx reverse proxy.
3. Configure CORS to only allow trusted frontend origins (`https://safaipay.vercel.app`).
4. Set secure HTTP-only cookies for authentication tokens in production.
