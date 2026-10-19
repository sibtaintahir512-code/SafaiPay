# SafaiPay Phase 1: Feature-Priority Matrix (MoSCoW)
**Document Version:** 1.0.0  
**Phase:** Phase 1 MVP Pilot  
**Methodology:** MoSCoW Prioritization Framework (Must Have, Should Have, Could Have, Won't Have)  

---

### 1. Prioritization Framework & Guiding Principles

The Phase 1 MVP focuses strictly on validating the end-to-end operational loop between waste generators, informal waste collectors, and recycling buyers in a controlled pilot (10 collectors, 2 societies, 5 offices, 2 recyclers in Karachi). 

Features are prioritized based on four criteria:
1. **Critical Path Operational Viability:** Is this feature indispensable for a pickup to be initiated, verified, priced, paid (simulated), and accounted for?
2. **Regulatory & Trust Guardrails:** Does this feature uphold non-custody of funds, human-in-the-loop verification, and user privacy consent?
3. **Collector Usability:** Can an informal waste worker with limited formal education operate this feature reliably in the field?
4. **Feasibility in 6 Weeks:** Can this be designed, implemented, tested, and deployed within the 6-week roadmap without introducing unmanageable technical debt?

---

### 2. Feature-Priority Matrix Summary

```
+----------------------------------------------------------------------------------------------------+
|                                    MOSCOW CATEGORIZATION BREAKDOWN                                 |
+-------------------+---------------------------------------------------------+----------------------+
| Category          | Definition & Strategic Objective                         | Feature Count (P1)   |
+-------------------+---------------------------------------------------------+----------------------+
| MUST HAVE (M)     | Non-negotiable requirements for MVP launch. Without     | 18 Features          |
|                   | these, the pilot cannot function safely or legally.     |                      |
+-------------------+---------------------------------------------------------+----------------------+
| SHOULD HAVE (S)   | High-impact features that enhance efficiency and trust  | 8 Features           |
|                   | but have manual or simplified fallbacks.                 |                      |
+-------------------+---------------------------------------------------------+----------------------+
| COULD HAVE (C)    | Desirable enhancements to be implemented only if team   | 6 Features           |
|                   | velocity permits, without risking the core schedule.     |                      |
+-------------------+---------------------------------------------------------+----------------------+
| WON'T HAVE (W)    | Explicitly out-of-scope for Phase 1. Preserved for       | 10 Strategic Items   |
|                   | FYP or Phase 2 commercial scaling.                       |                      |
+-------------------+---------------------------------------------------------+----------------------+
```

---

### 3. Comprehensive Feature Matrix

#### 3.1 MUST HAVE (Critical for MVP Pilot)

| Feature Code | Feature Name | Target Persona | Business Value | Tech Complexity | Architectural Component | Core Rationale & Business Rule Guardrail |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **M-01** | **Role-Based OTP Authentication** | All Personas | High | Medium | FastAPI / Redis / SMS Gateway | Secure access using mobile phone numbers and OTP. Roles: Customer, Collector, Recycler, Admin. |
| **M-02** | **Customer Pickup Booking** | Customer | High | Medium | Flutter / FastAPI / PostgreSQL | Enables customer to choose material (PET/Cardboard), enter approx quantity, set address, and pick time slot. |
| **M-03** | **AI Waste Image Estimation** | Customer / Collector | High | Medium | AI Service / FastAPI / S3 | Camera upload identifies PET or Cardboard with confidence score. **Rule:** Categorized strictly as an advisory estimate. |
| **M-04** | **Roman Urdu / English Text Parsing** | Customer / Collector | Medium | Medium | AI NLP Service / FastAPI | Parses informal mixed Roman Urdu/English requests (e.g., *"10 kilo gatta aur plastic botlein kal subah"*) into structured data. |
| **M-05** | **Nearest Collector Job Broadcast** | Collector | High | Medium | Redis / FastAPI / WebSocket | Radius-based broadcast of available pickups to active verified collectors within 3–5 km. |
| **M-06** | **Collector Job Acceptance** | Collector | High | Low | Flutter / FastAPI / Redis | Collector claims an open job; Redis atomic lock prevents race conditions and double-dispatch. |
| **M-07** | **Physical Weight Entry & Scale Photo** | Collector | High | Medium | Flutter / FastAPI / Object Storage | Collector enters verified weight from digital hook scale and uploads scale photo proof. Mandatory for dispute resolution. |
| **M-08** | **Quality Tier Assessment** | Collector | High | Low | Flutter / FastAPI | Collector inputs quality grade: Tier A ($1.00$), Tier B ($0.90$), Tier C ($0.75$), or Rejected ($0.00$). |
| **M-09** | **Deterministic Pricing Engine** | All Personas | High | Low | FastAPI | Calculates: $\text{Price} = \text{Weight} \times \text{Benchmark Rate} \times \text{Quality Factor}$. Automated, zero ambiguity. |
| **M-10** | **Customer Weight & Price Confirmation** | Customer | High | Low | Flutter / FastAPI | Customer reviews verified weight, quality grade, and price on-screen; provides 4-digit completion OTP or digital sign-off. |
| **M-11** | **Simulated Digital Payment Ledger** | Collector / Customer | High | Medium | FastAPI / PostgreSQL | Records credit to customer and debit/credit ledger for collector. Generates simulated transaction ID (Raast/Wallet mock). **Rule:** No real funds custody. |
| **M-12** | **Collector Daily & Total Earnings Screen** | Collector | High | Low | Flutter / FastAPI | Shows daily earnings, weekly totals, completed jobs, and earnings breakdown per material. |
| **M-13** | **Collector Digital Financial Identity** | Collector | High | Medium | FastAPI / PostgreSQL | Immutable record of verified pickups, verified kilograms, earnings consistency, and customer ratings. |
| **M-14** | **Recycler Demand Tender Posting** | Recycler | High | Medium | React Next.js / FastAPI | B2B dashboard for recyclers to post required material (PET/Cardboard), target weight (kg), offered rate (PKR/kg), and drop-off facility. |
| **M-15** | **Recycler Batch Procurement** | Recycler | High | Medium | React Next.js / FastAPI | Recycler reviews aggregated collector batches, accepts batch delivery, and confirms receipt. |
| **M-16** | **Admin Daily Pricing Management** | Admin | High | Low | React Next.js / FastAPI | Ops portal to update daily benchmark rates per material (PKR/kg) reflecting wholesale market rates. |
| **M-17** | **Admin Collector Verification (KYC)** | Admin | High | Medium | React Next.js / FastAPI / S3 | Verifies collector CNIC, phone number, vehicle type, and profile photo before granting job-acceptance permission. |
| **M-18** | **Environmental Impact Reporting (Estimated)** | Customer / Admin | High | Low | Next.js / Flutter / FastAPI | Displays landfill diversion (kg) and estimated GHG savings. **Rule:** Displays mandatory "Estimated" label on all metrics. |

---

#### 3.2 SHOULD HAVE (Important Enhancements for Pilot Robustness)

| Feature Code | Feature Name | Target Persona | Business Value | Tech Complexity | Architectural Component | Core Rationale & Workaround if Deferred |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **S-01** | **Bilingual Localization (Urdu & English)** | Collector / Customer | High | Medium | Flutter App (AppLocalizations) | Collectors require Urdu/Roman Urdu labels and audio playback. Workaround: High-contrast iconography and visual badges. |
| **S-02** | **Turn-by-Turn Map Routing to Pickup** | Collector | Medium | Medium | Flutter / OpenStreetMap / Google Maps | Direct navigation intent from app to native device maps. Workaround: Display customer plain-text address and phone contact. |
| **S-03** | **Dispute Ticketing & Mediation Workflow** | Customer / Collector | High | Medium | Next.js / FastAPI / PostgreSQL | Formal ticket submission if customer contests weight or quality grading. Workaround: Direct phone support to SafaiPay admin. |
| **S-04** | **Collector Performance & Reliability Score** | Admin / Recycler | Medium | Medium | FastAPI / PostgreSQL | Calculates completion rate, punctuality score, and rating average. Workaround: Manual review of collector job history by admin. |
| **S-05** | **Offline Photo & Weight Caching** | Collector | High | High | Flutter SQLite / WorkManager | Allows offline weight entry and photo capture in basements/dead zones, syncing upon reconnect. Workaround: Require 4G hotspot. |
| **S-06** | **Automated SMS Notifications** | All Personas | Medium | Low | FastAPI / Twilio or Local SMS Gateway | SMS alerts for pickup scheduled, collector arriving, and simulated payment receipt. Workaround: In-app push notifications. |
| **S-07** | **Exportable Collector Income Statement (PDF)** | Collector | High | Medium | FastAPI / WeasyPrint | Generates printable digital earnings statement for microfinance/proof-of-income. Workaround: Screen view in app. |
| **S-08** | **Recycler Material Quality Verification** | Recycler | Medium | Low | React Next.js / FastAPI | Recycler inputs receiving dock weight and approves/deducts batch quality. Workaround: Admin manual batch reconciliation. |

---

#### 3.3 COULD HAVE (Desirable if Resources Permit)

| Feature Code | Feature Name | Target Persona | Business Value | Tech Complexity | Architectural Component | Core Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **C-01** | **Multi-Stop Collector Batch Clustering** | Collector | Medium | High | FastAPI / Spatial Clustering | Groups 3–4 nearby pickups into a single sequence based on geographic proximity. |
| **C-02** | **Voice Note Request Recording** | Customer | Medium | High | Flutter / AI Speech-to-Text | Allows elderly or hurried customers to record a 15-second voice memo in Urdu describing waste. |
| **C-03** | **Society Centralized Hub Sorting Log** | Customer Admin | Low | Medium | Next.js / FastAPI | Multi-unit tracking for housing society facility managers to monitor building-level contributions. |
| **C-04** | **Dark Mode & Ultra-High-Contrast Theme** | Collector | Low | Low | Flutter Theme Engine | Improves sunlight readability on outdoor digital scale readings for waste pickers. |
| **C-05** | **Rain / Weather Alert Integration** | Collector | Low | Low | Open-Meteo Public API / FastAPI | Warns collectors and customers of rain delays to prevent cardboard water contamination. |
| **C-06** | **Customer Reward Badges & Gamification** | Customer | Low | Low | Flutter / FastAPI | Circular economy badges (e.g., *"100 kg Diverted Hero"*). |

---

#### 3.4 WON'T HAVE (Strictly Out of Scope for Phase 1 MVP)

| Feature Code | Feature Name | Intended Future Phase | Reason for Exclusion in Phase 1 MVP Pilot |
| :--- | :--- | :--- | :--- |
| **W-01** | **Direct Real-Money Banking & Wallet Custody** | Phase 2 (Licensed PSP) | SafaiPay is not an SBP-licensed EMI or Bank; holding customer or collector funds is legally prohibited. |
| **W-02** | **Automated Lender API Credit Feed** | Phase 2 / FYP | Sharing worker financial data without strict opt-in consent protocols and regulatory framework violates privacy. |
| **W-03** | **IoT Hardware Smart Scale Integration** | Phase 2 | Sourcing and testing proprietary BLE/cellular hardware scales introduces supply chain and device cost blockers. |
| **W-04** | **Dynamic Traveling Salesperson (TSP) Routing** | FYP / Phase 2 | Computational complexity is unwarranted for a 10-collector pilot in defined geographical corridors. |
| **W-05** | **Multi-City & Regional Tax Localization** | Phase 2 Expansion | Pilot is strictly confined to Karachi (PECHS, Clifton, Gulshan-e-Iqbal) using single-currency PKR. |
| **W-06** | **Glass, Metal, E-Waste & Battery Pickup** | Phase 2 Expansion | Materials require specialized handling, hazardous logistics, and distinct smelter off-take channels. |
| **W-07** | **In-App Direct Chat & P2P VoIP Calling** | Post-Pilot | High implementation overhead; standard phone call and SMS intents via mobile OS are completely sufficient. |
| **W-08** | **Consumer E-Commerce Green Store** | Phase 3 | Distracts from core operational loop: waste aggregation, verification, pricing, and B2B off-take. |
| **W-09** | **Deep Learning On-Device Edge Models** | FYP Research | Heavy model weights degrade low-end Android performance; centralized cloud AI service interface is standard. |
| **W-10** | **Automated Drone / Satellite Landfill Audits** | Future Horizon | Technologically and economically unfeasible for local municipal scrap pilot. |

---

### 4. Traceability & Business Rule Alignment

Every Must-Have feature is strictly aligned with the core business rules:
- **AI Classification ($M-03, M-04$):** Output tagged as `ESTIMATE_ONLY`; cannot bypass collector physical weigh-in ($M-07, M-08$).
- **Pricing Engine ($M-09$):** Hardcoded deterministic formula ensures exact price transparency: $\text{Verified Weight} \times \text{Rate} \times \text{Quality Factor}$.
- **Simulated Ledger ($M-11$):** Guarantees zero escrow or fund pooling; satisfies SBP and legal compliance.
- **Financial Identity ($M-13$):** Isolated from external lenders; no data export without user consent logs.
- **Impact Metrics ($M-18$):** Fixed "Estimated" watermark enforces scientific honesty and prevents greenwashing.
