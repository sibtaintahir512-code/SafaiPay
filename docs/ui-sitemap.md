# SafaiPay Phase 1: UI Sitemap & Screen Inventory
**Document Version:** 1.0.0  
**Phase:** Phase 1 MVP Pilot  
**Target Platforms:** Flutter Mobile (iOS & Android) | Next.js Responsive Web Portal  

---

### 1. Information Architecture & Sitemap Tree

```
SAFAIPAY PLATFORM INTERFACES
│
├── 📱 FLUTTER MOBILE APP
│   │
│   ├── [AUTH FLOW] (Shared)
│   │   ├── SCR-MOB-AUTH-01: Splash & Language Selector (English / Urdu)
│   │   ├── SCR-MOB-AUTH-02: Phone Number Entry
│   │   └── SCR-MOB-AUTH-03: OTP Verification & Role Route
│   │
│   ├── 👤 CUSTOMER EXPERIENCE (Generator)
│   │   ├── SCR-MOB-CUST-01: Customer Home & Live Pickup Status
│   │   ├── SCR-MOB-CUST-02: Camera Waste Scanner & AI Advisory Estimate
│   │   ├── SCR-MOB-CUST-03: Schedule Booking & Address Confirmation
│   │   ├── SCR-MOB-CUST-04: Active Pickup Live Tracking
│   │   ├── SCR-MOB-CUST-05: On-Site Verified Price Receipt & Completion OTP
│   │   ├── SCR-MOB-CUST-06: Customer Recycling Impact Dashboard (Estimated)
│   │   └── SCR-MOB-CUST-07: Customer Pickup History & Receipts
│   │
│   └── 👷 COLLECTOR EXPERIENCE (Informal Worker / Kabari)
│       ├── SCR-MOB-COLL-01: Collector Home & Online Availability Toggle
│       ├── SCR-MOB-COLL-02: Available Jobs Map & Radius Feed
│       ├── SCR-MOB-COLL-03: Job Acceptance & Turn-by-Turn Route Preview
│       ├── SCR-MOB-COLL-04: Physical Scale Weighing & Photo Proof Logger
│       ├── SCR-MOB-COLL-05: Price Calculation & Customer OTP Input
│       ├── SCR-MOB-COLL-06: Daily Earnings & Digital Financial Profile
│       ├── SCR-MOB-COLL-07: Lender Data Consent Management Screen
│       └── SCR-MOB-COLL-08: Collector KYC Status & Profile
│
└── 💻 NEXT.JS WEB DASHBOARDS
    │
    ├── 🏢 RECYCLER B2B PORTAL
    │   ├── SCR-WEB-REC-01: Recycler Overview & Demand Tender Summary
    │   ├── SCR-WEB-REC-02: Post Material Purchase Tender
    │   ├── SCR-WEB-REC-03: Aggregated Batch Allocation & Delivery Queue
    │   ├── SCR-WEB-REC-04: Factory Gate Weight Verification & Acceptance
    │   └── SCR-WEB-REC-05: B2B Simulated Settlement Ledger & Vouchers
    │
    └── ⚙️ ADMIN OPERATIONS PORTAL
        ├── SCR-WEB-ADM-01: Platform Executive Dashboard (Pilot KPIs)
        ├── SCR-WEB-ADM-02: Collector Verification & KYC Approval Queue
        ├── SCR-WEB-ADM-03: Daily Benchmark Scrap Pricing Manager
        ├── SCR-WEB-ADM-04: Active Pickups & Dispatch Fleet Map
        ├── SCR-WEB-ADM-05: Dispute Ticketing & Mediation Panel
        └── SCR-WEB-ADM-06: Pilot Impact Analytics & Export (Estimated)
```

---

### 2. Mobile App Screen Inventory (Flutter)

#### 2.1 Shared Authentication Screens

| Screen ID | Screen Name | Layout & Key Components | Primary User Actions | Integrated API Endpoints |
| :--- | :--- | :--- | :--- | :--- |
| **SCR-MOB-AUTH-01** | **Splash & Language Selector** | SafaiPay branding, English/Urdu toggle buttons with flag icons, audio pronunciation button. | Selects interface language (Urdu / English), taps "Proceed". | `N/A (Local Preference)` |
| **SCR-MOB-AUTH-02** | **Phone Number Entry** | Clean numerical keypad, Pakistani flag prefix (`+92`), phone input with automatic formatting. | Inputs 10-digit mobile number, taps "Send Verification Code". | `POST /auth/request-otp` |
| **SCR-MOB-AUTH-03** | **OTP Verification & Route** | 6-box auto-focusing OTP input, 60s countdown timer, auto-read SMS broadcast receiver. | Enters OTP; system verifies and routes to Customer or Collector Home based on JWT role. | `POST /auth/verify-otp` |

#### 2.2 Customer Experience Screens (Waste Generator)

| Screen ID | Screen Name | Layout & Key Components | Primary User Actions | Integrated API Endpoints |
| :--- | :--- | :--- | :--- | :--- |
| **SCR-MOB-CUST-01** | **Customer Home** | "Book Pickup" hero CTA button, current active pickup card with live status chip, current benchmark scrap rates ticker. | Taps "Book Pickup", views active job progress. | `GET /pickups/active`, `GET /pricing/current-rates` |
| **SCR-MOB-CUST-02** | **Camera AI Waste Scanner** | Full-screen camera viewfinder, overlay guide box, photo capture button, instant advisory prediction bottom sheet. | Snaps waste photo, reviews AI predicted category and advisory disclaimer. | `POST /classification/estimate` |
| **SCR-MOB-CUST-03** | **Schedule Booking & Address** | Material selector (PET/Cardboard), quantity slider (kg), date picker, 2-hour slot pills, address dropdown. | Confirms pickup details and submits request. | `POST /pickups` |
| **SCR-MOB-CUST-04** | **Active Pickup Live Tracking** | Interactive map showing collector's approximate location, ETA card, collector photo and vehicle badge, direct call button. | Tracks collector approach, calls collector if needed. | `GET /pickups/{id}`, `WSS /ws/pickups/{id}` |
| **SCR-MOB-CUST-05** | **Verified Price & Completion OTP** | Detailed price receipt itemizing verified scale weight, quality factor, and total PKR; large 4-digit completion OTP banner. | Reviews verified weight, reads OTP to collector to finalize pickup. | `GET /pickups/{id}`, `POST /disputes` |
| **SCR-MOB-CUST-06** | **Customer Impact Dashboard** | Prominent "Estimated Impact" banner; cards showing Total kg Diverted, Estimated CO₂ Reduced (kg), Simulated Earnings earned/saved. | Toggles time filter (This Month / All Time), shares ESG badge. | `GET /admin/impact-metrics` |

#### 2.3 Collector Experience Screens (Informal Waste Worker / Kabari)

| Screen ID | Screen Name | Layout & Key Components | Primary User Actions | Integrated API Endpoints |
| :--- | :--- | :--- | :--- | :--- |
| **SCR-MOB-COLL-01** | **Collector Home** | Large "Duty Online/Offline" toggle switch, today's simulated earnings counter in PKR, total kg collected today, available jobs badge. | Swipes online, views daily progress, opens jobs feed. | `PATCH /collectors/status/toggle-online`, `GET /earnings/summary` |
| **SCR-MOB-COLL-02** | **Available Jobs Radius Feed** | Card list of nearby jobs with distance (e.g. "1.2 km away"), material badge, estimated kg, and customer building name. | Taps job card to inspect details. | `GET /pickups/available` |
| **SCR-MOB-COLL-03** | **Job Acceptance & Route** | Map showing optimal travel route, customer contact, "Accept Job" slider with haptic confirmation. | Slides to claim job, taps "Start Navigation". | `POST /pickups/{id}/accept`, `PATCH /pickups/{id}/status` |
| **SCR-MOB-COLL-04** | **Scale Weighing & Photo Logger** | High-contrast weight input box (large digits), Quality Grade radio pills (Tier A $1.0$, Tier B $0.9$, Tier C $0.75$), camera button for scale display photo. | Enters digital scale reading, captures scale LCD photo, taps "Calculate Price". | `POST /pickups/{id}/verify-weight` |
| **SCR-MOB-COLL-05** | **Price Confirmation & OTP Input** | Summary showing: $\text{Weight} \times \text{Rate} \times Q = \text{PKR Total}$; 4-box OTP input for customer's completion code. | Enters customer's verbal OTP, confirms completion, triggers simulated payout. | `POST /pickups/{id}/complete` |
| **SCR-MOB-COLL-06** | **Daily Earnings & Financial ID** | Total lifetime kg, completion rate (%), stability score rating, weekly earnings graph, export statement button. | Views proof of earnings, requests income PDF. | `GET /financial-identity`, `GET /earnings/summary` |
| **SCR-MOB-COLL-07** | **Lender Consent Management** | Institutional partner cards (e.g. "Pak Microfinance Bank"), explicit toggle for data sharing, consent expiration date, "Revoke Access" button. | Grants or revokes consent for equipment loan applications. | `POST /financial-identity/consent`, `DELETE /financial-identity/consent/{id}` |

---

### 3. Web Dashboard Screen Inventory (React / Next.js)

#### 3.1 Recycler B2B Web Portal

| Screen ID | Screen Name | Layout & Key Components | Primary User Actions | Integrated API Endpoints |
| :--- | :--- | :--- | :--- | :--- |
| **SCR-WEB-REC-01** | **Recycler Demand Overview** | Summary metric cards (Active Tenders, Delivered kg, Pending Inbound Batches), recent fulfillments table. | Navigates tender inventory, reviews active contracts. | `GET /marketplace/demands` |
| **SCR-WEB-REC-02** | **Post Material Purchase Tender** | Form with material dropdown (PET/Cardboard), target tonnage (kg), offered purchase rate (PKR/kg), quality criteria, deadline picker. | Submits purchase tender to marketplace. | `POST /marketplace/demands` |
| **SCR-WEB-REC-03** | **Aggregated Delivery Queue** | Real-time table of incoming dispatches from collectors/hubs, dispatch truck IDs, dispatched weights, ETA. | Prepares receiving dock for incoming materials. | `GET /marketplace/fulfillments?status=DISPATCHED` |
| **SCR-WEB-REC-04** | **Gate Weight Verification** | Delivery inspection modal: enter factory weighbridge weight, upload scale ticket PDF/JPG, adjust quality tier. | Approves incoming batch, logs weight discrepancy delta. | `POST /marketplace/fulfillments/{id}/confirm` |
| **SCR-WEB-REC-05** | **Simulated Trade Settlements** | Filterable financial ledger of all completed B2B batch settlements, simulated voucher downloads, audit export. | Downloads simulated settlement slips for accounting. | `GET /payments/simulated-ledger?type=B2B` |

#### 3.2 Admin Operations Web Portal

| Screen ID | Screen Name | Layout & Key Components | Primary User Actions | Integrated API Endpoints |
| :--- | :--- | :--- | :--- | :--- |
| **SCR-WEB-ADM-01** | **Executive Pilot Dashboard** | Real-time KPI grid: Active Collectors (10), Enrolled Societies/Offices (7), Total kg Recycled, Simulated Turnover, System Health. | Monitors live pilot velocity across Karachi sectors. | `GET /admin/impact-metrics` |
| **SCR-WEB-ADM-02** | **Collector KYC Verification** | Split-screen review: collector photo, CNIC document front/back scan, vehicle license, calibrated scale serial ID, "Approve/Reject" buttons. | Approves pending informal waste pickers. | `GET /admin/collectors/pending`, `POST /admin/collectors/{id}/verify` |
| **SCR-WEB-ADM-03** | **Daily Benchmark Pricing Manager** | Tabular pricing matrix: PET Plastic and Cardboard base rates (PKR/kg), historical rate trend line, "Publish Daily Rate" modal. | Updates daily benchmark rates; pushes Redis cache invalidation. | `GET /pricing/current-rates`, `POST /admin/pricing/benchmarks` |
| **SCR-WEB-ADM-04** | **Fleet & Dispatch Map** | Live Leaflet/Mapbox map displaying real-time collector locations, open pickup pins, and active transit corridors. | Inspects route coverage and dispatch bottlenecks. | `GET /admin/fleet/live-locations` |
| **SCR-WEB-ADM-05** | **Dispute Resolution Panel** | Ticket queue showing customer vs collector weight variances, uploaded scale display photos, and resolution action buttons (Adjust / Dismiss). | Mediates weighing disputes, issues simulated balance corrections. | `GET /admin/disputes`, `POST /admin/disputes/{id}/resolve` |
| **SCR-WEB-ADM-06** | **Pilot Impact & ESG Reporting** | Granular diversion analytics, greenhouse gas avoidance calculations, exportable CSV/PDF summary with mandatory "Estimated" headers. | Generates weekly pilot impact dossier for stakeholders. | `GET /admin/impact-metrics` |

---

### 4. Accessibility & UX Provisions for Informal Waste Collectors

Recognizing that informal waste collectors in Karachi may possess limited formal literacy and operate under direct sunlight:
1. **Urdu & Roman Urdu Audio Cues:** Critical screen transitions (e.g. "Job Accepted", "Price Calculated", "Payment Credited") trigger clear spoken Urdu audio prompts through the device speaker.
2. **High-Contrast Outdoor Visual System:** The collector interface uses high-contrast typography (pure white `#FFFFFF` on dark charcoal `#121212` with emerald green accents `#10B981`) to prevent wash-out under harsh midday sunlight.
3. **Minimum 48dp Touch Targets:** All clickable interactive elements and buttons exceed standard accessibility guidelines (minimum 56dp height on mobile) to accommodate gloved or weathered hands.
4. **Mandatory Advisory Tagging:** Every screen displaying AI predictions or environmental calculations renders an un-dismissible visual chip: `[ESTIMATED]`.
