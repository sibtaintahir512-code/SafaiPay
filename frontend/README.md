# SafaiPay Web Dashboard (Next.js 14 App Router)

The SafaiPay Web Portal provides role-based access control (RBAC) and dedicated portals for all platform stakeholders:
- **Resident / Business Customer Portal:** Doorstep recyclable booking, AI classification preview, live pickup lifecycle tracking, digital weight receipts, and instant payout status.
- **Waste Collector Portal:** Shift toggle (Online/Offline), nearby job acceptance, GPS tracking, certified digital scale weight entry, and daily/weekly earnings analytics.
- **Industrial Recycler Portal:** Verified material marketplace, real-time certified inventory stock, purity breakdown, and B2B batch procurement.
- **Platform Admin Portal:** Complete operations ledger, fleet dispatch, dynamic benchmark scrap price management, suspicious fraud alerts review, and audit trail logs.

---

## Tech Stack
- **Framework:** Next.js 14.2 (App Router with Server & Client Components)
- **Language:** TypeScript 5.4
- **UI & Styling:** Tailwind CSS 3.4 with custom SafaiPay eco-palette, dark/light theme tokens, and accessible focus rings
- **State & Context:** React 18, Custom AuthContext, LanguageContext (English & Urdu bilingual support)
- **Icons:** Lucide React
- **Validation:** Zod

---

## Local Development Setup

1. **Install dependencies:**
   ```bash
   cd frontend-admin
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   ```
   Set `NEXT_PUBLIC_API_URL=/api/v1` or point `BACKEND_URL=http://127.0.0.1:8000` if running the Python FastAPI backend locally.

3. **Run development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

4. **Production Build & Lint Verification:**
   ```bash
   npm run build
   npm run lint
   ```

---

## 1-Click Demo Accounts

| Role | Username / Identifier | Password | Dashboard Route |
| :--- | :--- | :--- | :--- |
| **Customer** | `+923001110001` or `falcon@complex.pk` | `SafaiPassword123!` | `/customer/dashboard` |
| **Collector** | `+923002220001` | `SafaiPassword123!` | `/collector/dashboard` |
| **Recycler** | `+923003330001` or `procurement@indusplastic.pk` | `SafaiPassword123!` | `/recycler/dashboard` |
| **Admin** | `admin@safaipay.org` or `+923000000000` | `AdminPassword123!` | `/admin/dashboard` |

*Quick 1-click login buttons are also provided directly on the login screen and top navbar.*

---

## Vercel Deployment

1. **Deploy via Vercel CLI:**
   ```bash
   cd frontend-admin
   npx vercel
   ```
2. **Framework Preset:** Next.js
3. **Build Command:** `next build` (or default)
4. **Output Directory:** `.next`
5. **Environment Variables:**
   - `NEXT_PUBLIC_API_URL` (optional, defaults to `/api/v1`)
   - `BACKEND_URL` (optional: URL of external FastAPI instance if running)
