# SafaiPay Role-Based Access Control (RBAC) & Permissions

## 1. Role Overview
SafaiPay enforces a strict zero-trust Role-Based Access Control (RBAC) model across four primary personas:
1. **Customer (`ROLE_CUSTOMER`):**
   - Book doorstep recyclable waste pickups.
   - Attach waste photos for AI purity classification.
   - Track pickup status in real-time.
   - View mutual OTP for scale verification.
   - View digital payout receipts and wallet transactions.
2. **Collector (`ROLE_COLLECTOR`):**
   - Toggle online/offline live duty status.
   - View and claim unassigned pickup requests within geo-fenced sector.
   - Log verified scale weight and quality tier (Tier A, B, C).
   - Capture tare and scale photos.
   - Verify customer OTP and disburse instant settlement.
   - Track daily, weekly, monthly commission earnings and verified digital income profile.
3. **Recycler (`ROLE_RECYCLER`):**
   - Browse B2B marketplace of verified bulk recyclable feedstock (PET Flakes, OCC Bales, HDPE, Metals).
   - Submit Purchase Orders (POs) for material lots.
   - Track freight transit and gate-in weighbridge tickets.
   - Download immutable chain-of-custody and ESG compliance certificates.
4. **Admin (`ROLE_ADMIN`):**
   - Live fleet telematics and command center dispatching.
   - User verification (NADRA CNIC biometric audit, suspension/activation).
   - Set and publish wholesale material benchmark rates in PKR/kg.
   - Financial payment queue management, gateway reconciliation, and float liquidity.
   - AI fraud anomaly monitoring (weight variance, photo duplicates, GPS drift).
   - System settings (maintenance mode, AI thresholds, SMS gateways).
   - Immutable security audit logs.

## 2. Route Guarding & URL Scoping

| Route Group | Scoped Prefix | Allowed Roles | Guard Behavior |
|---|---|---|---|
| **Auth** | `/(auth)/*` | Public / Unauthenticated | If already logged in, redirects to role dashboard |
| **Customer** | `/(customer)/customer/*` | `customer`, `admin` | Non-customer redirected to their role dashboard |
| **Collector** | `/(collector)/collector/*` | `collector`, `admin` | Non-collector redirected to their role dashboard |
| **Recycler** | `/(recycler)/recycler/*` | `recycler`, `admin` | Non-recycler redirected to their role dashboard |
| **Admin** | `/(admin)/admin/*` | `admin` | Non-admin redirected to `/login` |
