# SafaiPay Phase 1: End-to-End User Journeys
**Document Version:** 1.0.0  
**Phase:** Phase 1 MVP Pilot  
**Actors:** Customer (Generator), Collector (Waste Worker), Recycler (B2B Buyer), Admin (Operations Manager)  

---

### 1. Overview & Operational Principles

The SafaiPay user experience connects four distinct stakeholders in a closed-loop circular economy workflow. Every journey is engineered to adhere to SafaiPay's core business principles:
1. **AI as Advisory:** AI classification provides an immediate preliminary estimate to set customer expectations, but never dictates final transactions.
2. **Deterministic On-Site Verification:** Final transaction pricing is calculated strictly by the formula:  
   $$\text{Total Price} = \text{Verified Weight (kg)} \times \text{Material Benchmark Rate (PKR/kg)} \times \text{Quality Factor}$$
3. **Simulated Sandbox Payments:** The MVP uses an auditable, double-entry simulated financial ledger without holding real customer funds.
4. **Transparent Consent & Estimated Impact:** Financial identity creation is user-owned, and environmental figures are explicitly labelled "Estimated".

---

### 2. User Journey 1: Customer Booking a Recyclable Pickup

#### 2.1 Narrative & Goal
A corporate office administrator or residential housing society manager has accumulated segregated recyclables (PET plastic bottles or flattened cardboard boxes) and wants to request a prompt, verified, and transparent pickup.

#### 2.2 Pre-conditions
- Customer has registered on the SafaiPay Flutter app or Web portal using mobile phone OTP verification.
- Customer profile includes an approved pickup address within the pilot zone (Karachi PECHS/Clifton/Gulshan).

#### 2.3 Post-conditions
- Pickup request is logged in PostgreSQL with status `SCHEDULED`.
- Redis broadcast notifies nearby verified collectors within a 3–5 km radius.
- Customer receives an in-app confirmation with estimated weight and price.

#### 2.4 Step-by-Step Flow

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer (App/Web)
    participant App as SafaiPay Flutter App
    participant API as FastAPI Backend
    participant AI as AI Classification Service
    participant DB as PostgreSQL & S3
    participant Redis as Redis Job Dispatcher

    Customer->>App: Opens "Book Pickup" screen
    Customer->>App: Captures photo of waste (PET / Cardboard)
    App->>API: POST /api/v1/classification/estimate (image upload)
    API->>AI: Forward image for resin/material inference
    AI-->>API: Returns: {predicted_material: "PET Plastic", confidence: 0.92, estimated_grade: "Tier A"}
    API-->>App: Returns advisory estimate with disclaimer
    App->>Customer: Displays "Estimated: PET Plastic (92% confidence)"
    Customer->>App: Inputs estimated weight (e.g. 15 kg), selects date & time slot
    Customer->>App: Confirms pickup address and submits
    App->>API: POST /api/v1/pickups (payload with items, slot, coordinates)
    API->>DB: INSERT into `pickups` (status: 'PENDING') & `pickup_items`
    API->>Redis: Publish job to geo-radius queue (`geo:pilot_karachi`)
    API-->>App: 201 Created (pickup_id, tracking_status)
    App-->>Customer: Shows "Pickup Scheduled - Searching for Nearest Collector"
```

#### 2.5 Alternative & Exception Paths
- **E1. Low AI Confidence (< 0.70):** The app displays a polite disclaimer: *"AI cannot clearly identify this item. Please manually select either PET Plastic or Cardboard from the list."* The user manually selects the category, and the system flags the job as `MANUAL_CATEGORIZATION`.
- **E2. Mixed Language Text Request (Roman Urdu Helper):** If the customer types a free-form message (e.g. *"Kal subah 10 baje 20 kilo gatta uthwa lein"*), the backend NLP endpoint `/api/v1/classification/parse-request` extracts `material: Cardboard`, `weight: 20kg`, `time: tomorrow morning` and pre-populates the booking form.
- **E3. Out of Service Pilot Corridor:** If coordinates fall outside the pilot bounds, the system alerts the user: *"SafaiPay Phase 1 is currently operating exclusively in pilot sectors of Karachi. We have registered your interest!"*

---

### 3. User Journey 2: Collector Accepting and Completing a Job

#### 3.1 Narrative & Goal
A verified informal waste collector (*kabari* worker) equipped with a digital hanging hook scale and smartphone receives a nearby job, travels to the location, physically weighs and grades the material, logs proof, and records a verified digital earning.

#### 3.2 Pre-conditions
- Collector is KYC-verified by the SafaiPay Admin (valid CNIC, phone number, calibrated scale issued).
- Collector sets status to `ONLINE` on the SafaiPay mobile app.

#### 3.3 Post-conditions
- Pickup status advances: `ACCEPTED` $\rightarrow$ `IN_TRANSIT` $\rightarrow$ `ARRIVED` $\rightarrow$ `WEIGHED` $\rightarrow$ `COMPLETED`.
- Physical scale weight, quality factor, and photo proof are saved.
- Verified price is calculated deterministically.
- Simulated payment is credited to collector's digital ledger and customer account.
- Collector's digital financial profile updates immediately.

#### 3.4 Step-by-Step Flow

```mermaid
sequenceDiagram
    autonumber
    actor Collector as Verified Collector
    participant App as SafaiPay Collector App
    participant API as FastAPI Backend
    participant Redis as Redis Queue / Lock
    participant DB as PostgreSQL / Ledger
    actor Customer as Customer

    Redis->>App: Push notification: "New Pickup Nearby: 15kg PET (1.2 km away)"
    Collector->>App: Reviews job details & taps "Accept Job"
    App->>API: POST /api/v1/pickups/{id}/accept
    API->>Redis: Atomic Lock check (SETNX pickup:lock:{id})
    alt Job Already Taken
        Redis-->>API: Lock Failed
        API-->>App: 409 Conflict: "Job already accepted by another collector"
    else Lock Acquired
        Redis-->>API: Lock OK
        API->>DB: UPDATE `pickups` SET status='ACCEPTED', collector_id={id}
        API-->>App: 200 OK (Job Assigned, customer details revealed)
    end
    Collector->>App: Taps "Start Journey" -> "Arrived at Location"
    App->>API: PATCH /api/v1/pickups/{id}/status (status='ARRIVED')
    Collector->>Customer: Meets customer, inspects materials on-site
    Collector->>Collector: Weighs material using calibrated digital scale (e.g. 14.5 kg)
    Collector->>App: Enters Verified Weight: 14.5 kg, Selects Quality: Tier A (1.00)
    Collector->>App: Snaps photo of scale display + sorted material
    App->>API: POST /api/v1/pickups/{id}/verify-weight (weight: 14.5, quality: 1.0, photo)
    API->>API: Calculate Price = 14.5 * 80.00 * 1.00 = PKR 1,160.00
    API-->>App: Displays Price: PKR 1,160.00 & 4-digit confirmation OTP prompt
    Collector->>Customer: Asks customer for completion OTP (or digital signature)
    Customer->>Collector: Provides OTP displayed on customer app
    Collector->>App: Submits 4-digit OTP
    App->>API: POST /api/v1/pickups/{id}/complete (otp: "4821")
    API->>DB: UPDATE `pickups` status='COMPLETED'
    API->>DB: INSERT into `simulated_transactions` (credit PKR 1,160 to ledger)
    API->>DB: UPDATE `financial_identities` (increment weight, jobs, earnings)
    API-->>App: 200 OK: "Job Completed! PKR 1,160 added to your digital earnings"
    App->>Collector: Displays updated daily earnings summary
```

#### 3.5 Alternative & Exception Paths
- **E1. Material Quality Contamination:** Collector notices PET bottles contain heavy dirt, sand, or liquids. Collector selects `Tier C (0.75)` or rejects the batch. The app updates the price quote instantly. If customer disputes, both tap "Report Issue", putting the job into `DISPUTED` status for admin review.
- **E2. Weight Variance Alert (> 50% vs Estimate):** If customer estimated 10 kg but verified weight is 35 kg, the backend flags the transaction with `AUDIT_REQUIRED` flag to ensure no typo occurred, but allows completion once confirmed by customer OTP.
- **E3. Offline Mode in Basement/Dead Zone:** If network drops during weight recording, the Flutter app caches the verified weight, timestamp, GPS coordinate, and scale image in local SQLite/Hive storage, syncing to the server immediately when reconnecting.

---

### 4. User Journey 3: Recycler Posting Demand and Purchasing Material

#### 4.1 Narrative & Goal
A B2B industrial recycling facility (e.g., a plastic washing and pelletizing plant or paper mill) needs a steady supply of sorted PET or Cardboard. The recycler posts a demand tender on the SafaiPay Web Dashboard, reviews available aggregated inventory, commits to purchase a batch, and records the delivery receipt.

#### 4.2 Pre-conditions
- Recycler company is vetted by SafaiPay Admin (NTN/tax registration verified, factory address documented).
- Recycler has access to the React/Next.js B2B web portal.

#### 4.3 Post-conditions
- Demand tender is published in the marketplace.
- Aggregated collector batches are matched and allocated to the tender.
- Delivery receipt is logged upon batch drop-off at the recycling facility.
- Simulated B2B settlement voucher is generated.

#### 4.4 Step-by-Step Flow

```mermaid
sequenceDiagram
    autonumber
    actor Recycler as Industrial Recycler
    participant Web as Next.js Recycler Dashboard
    participant API as FastAPI Backend
    participant DB as PostgreSQL
    actor Admin as SafaiPay Admin / Aggregator

    Recycler->>Web: Logs into Recycler Dashboard
    Recycler->>Web: Navigates to "Post Material Demand"
    Recycler->>Web: Submits Tender: {Material: "PET Plastic", Target Qty: 2,000 kg, Offered Rate: PKR 95/kg, Quality: Tier A/B, Delivery Date: 7 Days}
    Web->>API: POST /api/v1/marketplace/demands
    API->>DB: INSERT into `marketplace_demands` (status: 'OPEN')
    API-->>Web: 201 Created (tender_id: "DEM-1042")
    Web->>Recycler: Displays active tender & live aggregation progress
    Admin->>API: GET /api/v1/marketplace/demands/matches (evaluates available collector inventory)
    Admin->>API: POST /api/v1/marketplace/demands/{id}/allocate-batch (allocates 500 kg batch)
    API->>DB: INSERT `marketplace_fulfillments` (batch_id, status: 'DISPATCHED')
    Note over Recycler, Admin: Aggregated material delivered to Recycler Factory Gate
    Recycler->>Web: Inspects delivery, inputs receiving gate weight (e.g. 495 kg)
    Recycler->>Web: Confirms acceptance & rates batch quality
    Web->>API: POST /api/v1/marketplace/fulfillments/{id}/confirm (received_weight: 495)
    API->>DB: UPDATE `marketplace_fulfillments` SET status='RECEIVED', final_weight=495
    API->>DB: INSERT `simulated_transactions` (B2B simulated settlement voucher)
    API-->>Web: 200 OK: "Batch Accepted! Simulated Settlement Slip Generated"
```

#### 4.5 Alternative & Exception Paths
- **E1. Factory Gate Weight Discrepancy (> 3%):** If the factory gate weighbridge registers 470 kg instead of the dispatched 500 kg (due to transit moisture loss or sorting fines), the recycler enters the actual scale weight and uploads the weighbridge slip. The system logs a `WEIGHT_ADJUSTMENT` delta of 30 kg and alerts Admin.
- **E2. Material Rejection for Severe Contamination:** If the cardboard batch is soaked with water or oil, the recycler clicks "Reject Batch", enters photo evidence, and the status changes to `REJECTED_AT_DOCK`. Admin arranges secondary sorting or return.

---

### 5. User Journey 4: Admin Managing the Platform

#### 5.1 Narrative & Goal
The SafaiPay Operations Administrator manages daily platform health: onboarding and vetting collectors, establishing daily benchmark scrap rates, resolving pickup disputes, and monitoring estimated pilot environmental and financial inclusion impact.

#### 5.2 Pre-conditions
- Admin user has `SUPERADMIN` or `OPS_MANAGER` role privileges.
- Admin accesses the Next.js Operations Management Portal via multi-factor authentication.

#### 5.3 Post-conditions
- Collectors are vetted and authorized to accept live jobs.
- Benchmark pricing is published daily to regulate automated pricing formulas.
- Contested transactions are mediated and resolved.
- Aggregated pilot ESG and financial metrics are exported.

#### 5.4 Step-by-Step Flow

```mermaid
sequenceDiagram
    autonumber
    actor Admin as SafaiPay Admin
    participant Web as Next.js Admin Portal
    participant API as FastAPI Backend
    participant DB as PostgreSQL
    participant Redis as Redis Cache

    Admin->>Web: Accesses "Collector Verification Queue"
    Web->>API: GET /api/v1/admin/collectors?status=PENDING_VERIFICATION
    API->>DB: SELECT * FROM `collector_profiles` WHERE kyc_status='PENDING'
    API-->>Web: Returns list of pending collectors (CNIC, photo, scale ID)
    Admin->>Web: Inspects CNIC document & scale calibration certificate
    Admin->>Web: Clicks "Approve Collector"
    Web->>API: POST /api/v1/admin/collectors/{id}/approve
    API->>DB: UPDATE `collector_profiles` SET kyc_status='VERIFIED', can_accept_jobs=TRUE
    API-->>Web: 200 OK: Collector Activated

    Admin->>Web: Navigates to "Pricing Management"
    Admin->>Web: Updates Daily Benchmark Rates: PET = PKR 82.00/kg, Cardboard = PKR 34.00/kg
    Web->>API: POST /api/v1/pricing/benchmarks (materials, rates, effective_date)
    API->>DB: INSERT into `material_price_history` & UPDATE `materials`
    API->>Redis: Invalidate cache key `pricing:current_rates`
    API-->>Web: 200 OK: Rates Updated & Active

    Admin->>Web: Navigates to "Pilot Impact Dashboard"
    Web->>API: GET /api/v1/admin/impact-metrics
    API->>DB: Aggregate total verified weights, pickups, and earnings
    API-->>Web: Returns: {total_kg: 4250, estimated_co2_kg: 6375, active_collectors: 10, total_payout_pkr: 342000}
    Web->>Admin: Displays live pilot graphs with mandatory "Estimated" labels
```

#### 5.5 Alternative & Exception Paths
- **E1. Dispute Resolution Flow:** Customer disputes a weight deduction. Admin opens `/admin/disputes/{id}`, views the scale photo proof uploaded by the collector, compares with customer comments, and can issue a simulated ledger adjustment credit to resolve goodwill.
- **E2. Suspected Fraudulent Entry:** Anomaly detection flags a collector submitting 250 kg PET in a single tricycle pickup (exceeding typical physical volume). Admin temporarily pauses the collector's account and initiates an inspection call.

---

### 6. User Journey Summary & Business Rule Matrix

| Journey Stage | Primary Actor | Mandatory Business Rule Enforced | Fail-Safe Mechanism |
| :--- | :--- | :--- | :--- |
| **Pickup Booking** | Customer | AI classification must be displayed as an advisory estimate only. | Manual category selection fallback if image is unclear or confidence < 0.70. |
| **On-Site Weighing** | Collector | Deterministic formula: $\text{Weight} \times \text{Rate} \times \text{Quality Factor}$. | Scale photo proof and customer OTP confirmation required to close job. |
| **Financial Settlement** | Collector & Customer | Simulated ledger only; no pooling or custody of customer funds. | Ledger entries stored as immutable records with mock transaction references. |
| **Worker Identity** | Collector | Financial data is private; zero sharing with lenders without consent. | Explicit consent check required before any financial profile export. |
| **Marketplace Off-take** | Recycler & Admin | B2B batch traceability from collector to factory gate. | Factory weighbridge delta logging to capture moisture/sorting shrinkage. |
| **Impact Reporting** | All | Environmental metrics must display "Estimated" label. | UI templates hardcode "Estimated" watermark on all carbon and diversion figures. |
