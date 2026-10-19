# Product Requirements Document (PRD)
## SafaiPay: Smart Waste Collection & Digital Earnings Platform
**Document Version:** 1.0.0  
**Phase:** Phase 1 MVP Pilot  
**Target Pilot Location:** Karachi, Pakistan  
**Pilot Cohort:** 10 Verified Waste Collectors, 2 Housing Societies, 5 Commercial Offices, 2 B2B Recycling Buyers  
**Pilot Materials:** PET Plastic (#1) and Corrugated Cardboard (OCC)  
**Target Delivery Window:** 6 Weeks  

---

### 1. Executive Summary

SafaiPay is a multi-sided circular economy marketplace and fintech-enablement platform designed to formalize informal municipal waste management. The platform connects waste generators (households, housing societies, commercial offices) with verified informal waste collectors (*kabari* workers and scrap pickers), and aggregates collected recyclables for sale to industrial recycling facilities.

Beyond facilitating transparent waste collection, SafaiPay introduces a transformative **Digital Financial Identity layer** for informal waste workers. In Pakistan, informal collectors handle upwards of 80% of recyclable retrieval but operate entirely in a cash economy, lacking formal proof of income, banking access, credit history, or equipment financing opportunities. By recording verified weights, transparent quality-adjusted market prices, and digital payment receipts, SafaiPay builds an auditable digital earnings track record. This verifiable record enables consent-based access to future micro-finance, equipment loans (e.g., electronic weighing scales, electric waste-collection loaders), and micro-insurance without SafaiPay operating as an unlicensed bank or financial intermediary.

The Phase 1 MVP is a controlled, high-density pilot focused on two core high-yield recyclable streams—**Polyethylene Terephthalate (PET) Plastic** and **Corrugated Cardboard**—operating in a single city with 10 vetted collectors, 7 commercial/community generator entities (2 housing societies and 5 offices), and 2 industrial recyclers.

---

### 2. Problem Statement

#### 2.1 The Waste Generator Dilemma (Offices & Housing Societies)
- **Unreliable and Fragmented Collection:** Waste generators lack scheduled, dependable collection for segregated recyclables. Most commercial waste is mixed into municipal garbage destined for overburdened landfills (such as Jam Chakro and Gond Pass in Karachi).
- **Zero Transparency and Traceability:** Corporate offices and housing societies lack verifiable recycling and ESG tracking metrics to validate diversion from landfills.
- **Security & Vetting Concerns:** Commercial facilities and gated societies hesitate to admit unvetted informal pickers due to security, accountability, and safety protocols.

#### 2.2 The Informal Waste Collector Dilemma (*Kabaris* and Waste Pickers)
- **Extreme Income Volatility and Exploitation:** Middlemen exploit collectors with manipulated manual spring scales (*kanda*) and non-transparent daily deductions.
- **Cash Economy & Financial Invisibility:** Without digital bank accounts, wallets, or documented transactions, collectors cannot demonstrate creditworthiness to formal financial institutions (State Bank of Pakistan NFIS target demographic).
- **Physical Inefficiencies:** Unplanned, roaming collection routes result in excessive physical exertion, high cart-pushing fatigue, fuel waste, and low daily collection capacity (under 25–40 kg/day).

#### 2.3 The Recycling Buyer Dilemma (Industrial Recyclers)
- **Inconsistent Supply Volumes:** Processing plants suffer from unpredictable feedstock supply and severe seasonal variations.
- **High Contamination and Low Quality:** Raw recyclable batches frequently contain dirt, unwashed containers, mixed polymers, or wet cardboard, reducing processing efficiency and machine lifespan.
- **Lack of Origin Traceability:** Industrial buyers cannot verify material chain-of-custody or social compliance in their procurement supply chains.

---

### 3. Target Users & Personas

| Persona Role | Target Segment / Profile | Core Motivations & Needs | Key Tech Constraints |
| :--- | :--- | :--- | :--- |
| **Generator (Customer)** | Facilities managers at commercial offices; administrators or residents of gated housing societies. | Scheduled pickups, transparent pricing, verified weighing, clean premises, auditable ESG diversion metrics. | Flutter mobile app (iOS/Android) and responsive web portal; English/Urdu bilingual interface. |
| **Collector (Waste Worker)** | Informal *kabari* operators, waste pickers, micro-scrap aggregators with manual carts or motor loaders. | Reliable daily jobs, transparent weight checks, fair market pricing, protected income, digital earnings ledger. | Low-end Android smartphones (Android 9+), limited mobile data, low literacy/digital fluency (requires Roman Urdu, audio prompts, large touch targets). |
| **Recycling Buyer (Recycler)** | Registered B2B plastics re-granulators and paper packaging mills. | Bulk predictable supply, pre-sorted PET/cardboard, quality verification, transparent trade receipts. | Desktop web application (React/Next.js dashboard) with multi-metric demand posting and fulfillment management. |
| **Platform Administrator** | SafaiPay operations leads, hub coordinators, and customer support managers. | System oversight, collector verification (KYC/CNIC), benchmark price configuration, dispute mediation, pilot metrics monitoring. | High-resolution Next.js operations portal with real-time analytics, user audits, and pricing controls. |

---

### 4. MVP Pilot Scope

The 6-week MVP is scoped strictly to validate unit economics, user workflows, weight verification mechanisms, and the digital ledger model:

1. **Geographic Focus:** 1 City (Karachi, selected pilot corridors: PECHS, Clifton, and Gulshan-e-Iqbal commercial zones).
2. **Materials Handled:**
   - **PET Plastic Bottles (Clear/Blue tint):** Cleaned, empty, uncompressed or compressed bottles.
   - **Corrugated Cardboard (OCC):** Dry cardboard boxes, clean packing material.
3. **Participant Network:**
   - 10 Verified Collectors (onboarded with verified CNIC, profile photo, verified mobile phone, and issued calibrated digital hanging scale).
   - 2 Gated Housing Societies (centralized collection points).
   - 5 Commercial Offices (scheduled weekly recycling pickups).
   - 2 Industrial Recyclers (1 PET recycling processing plant, 1 paper packaging mill).
4. **Core Functional Capabilities:**
   - **AI-Assisted Estimation:** Mobile camera-based waste classification estimate and Roman Urdu free-text request parsing helper.
   - **Pickup Dispatch & Assignment:** Customer booking, nearest-collector job broadcast, and collector acceptance.
   - **Human-in-the-Loop Digital Weighing:** Mandatory collector on-site physical weighing, quality tier grading, scale photo proof upload, and customer signature/OTP confirmation.
   - **Transparent Pricing Engine:** Automated computation: `Total Price = Verified Weight × Material Rate × Quality Factor`.
   - **Simulated Payment & Ledger:** Digital ledger recording credits, simulated payouts to collector digital wallets/bank simulation, transaction receipts.
   - **Recycler B2B Marketplace:** Recycler demand tender posting (required quantity, target rate), batch reservation, and warehouse delivery logging.
   - **Impact Dashboard:** Environmental diversion tracking (kg diverted, estimated CO₂ reduction, estimated tree equivalents, collector income generated) with mandatory "Estimated" disclaimers.

---

### 5. Out-of-Scope Features for Phase 1

The following capabilities are explicitly deferred to post-pilot and FYP/Phase 2 releases:

- **Direct Banking / Custody of Customer Funds:** SafaiPay will not operate customer stored-value wallets or escrow funds. All MVP payouts and settlements are simulated.
- **Automated Third-Party Lender Credit Push:** No financial scoring data will be exported or transmitted to external banks or microfinance institutions without subsequent explicit, signed user consent protocols in Phase 2.
- **Hardware IoT Smart Scales:** Direct Bluetooth/cellular scale integration is deferred; collectors manually enter weights and upload photo verification of scale displays.
- **Dynamic Vehicle Routing Problem (VRP) Optimization:** Multi-stop traveling salesperson optimization is deferred; MVP relies on radius-based nearest-collector dispatch and manual sorting.
- **Hazardous, E-Waste, Glass, or Organic Waste:** Handling of e-waste, lead-acid batteries, medical waste, or food compost is strictly prohibited in Phase 1.
- **Multi-City & Multi-Currency Architecture:** No cross-border currencies or multi-city taxation systems in Phase 1 (strictly PKR in 1 city).

---

### 6. Core Business Rules & Regulatory Guardrails

1. **AI Classification as Advisory Only:**
   - AI computer vision and NLP inferences are strictly categorized as **preliminary estimates**.
   - Under no circumstances shall an automated AI inference dictate final billing or settlement.
   - The verified collector or hub administrator must physically inspect, grade, weigh, and confirm the item categories on-site.
2. **Deterministic Price Formula:**
   $$\text{Total Price} = \text{Verified Weight (kg)} \times \text{Material Benchmark Rate (PKR/kg)} \times \text{Quality Factor}$$
   - *Material Benchmark Rate:* Set and published daily by SafaiPay platform administrators based on prevailing wholesale spot prices.
   - *Quality Factor ($Q$):* Categorized deterministically:
     - Tier A (Clean, dry, uncontaminated, sorted): $Q = 1.00$
     - Tier B (Minor dirt/labels, dry, segregated): $Q = 0.90$
     - Tier C (Moderately mixed/dusty, requires washing): $Q = 0.75$
     - Rejected (Wet, oil-contaminated, mixed non-recyclables): $Q = 0.00$ (Pickup rejected or unpriced).
3. **Payment Simulation & Escrow Prohibition:**
   - In accordance with State Bank of Pakistan (SBP) Payment Systems and Electronic Fund Transfers Act (PS&EFTA) and Electronic Money Institutions (EMI) regulations:
   - SafaiPay **must not hold, pool, or custody user funds**, nor act as an unauthorized depository, lender, deposit-taker, or insurer.
   - All MVP financial operations represent a **simulated sandbox ledger**. Payout confirmations generate simulated transaction identifiers mimicking Raast/1Link/EasyPaisa/JazzCash rails.
4. **Environmental Claims Transparency:**
   - All greenhouse gas (GHG) reductions, landfill diversion volumes, and water-saving metrics must display the explicit label **"Estimated"** in UI headers, charts, and downloadable reports.
   - Formula defaults (e.g., 1.5 kg CO₂e saved per 1 kg PET recycled) must reference standard EPA/IPCC LCA conversion factors.
5. **Data Privacy, Consent & Financial Scoring:**
   - User financial data, pickup history, and generated income records are private and protected under the Prevention of Electronic Crimes Act (PECA) and consumer protection standards.
   - No data may be shared with microfinance banks, digital lenders, or third parties without an auditable, explicit, opt-in consent record signed via the app by the worker.

---

### 7. Success Metrics & Key Performance Indicators (KPIs)

```
+-----------------------------------------------------------------------------------+
|                            SAFAIPAY PHASE 1 MVP KPIS                              |
+------------------------------------+----------------------------------------------+
| Metric Category                    | Pilot Target (6-Week Operation)              |
+------------------------------------+----------------------------------------------+
| Operational Efficiency             |                                              |
| - Pickup Fulfillment Rate          | >= 85% of accepted bookings completed        |
| - Average Acceptance Latency       | < 15 minutes during working hours (9am-6pm)  |
| - Weight Variance (Estimate vs Fact)| < 20% variance between AI and Scale Weight   |
| - Weighing Dispute Rate            | < 5% of completed pickups contested          |
+------------------------------------+----------------------------------------------+
| User Engagement & Platform Quality |                                              |
| - Collector Daily Active Usage     | 10/10 onboarded collectors completing jobs   |
| - Commercial Customer Retention    | 100% of pilot offices (5/5) completing >= 3  |
|                                    | weekly scheduled pickups                     |
| - Average Collector CSAT Rating    | >= 4.5 out of 5.0 stars                      |
+------------------------------------+----------------------------------------------+
| Financial & Environmental Impact   |                                              |
| - Total Recyclables Diverted       | >= 5,000 kg (PET plastic + Cardboard)        |
| - Collector Average Income Lift    | >= 25% verified increase vs baseline cash    |
| - Recycler Fulfillment Rate        | 100% of pilot B2B orders fulfilled (2 plants)|
| - Zero Regulatory Violations       | 100% compliance on non-custody & data privacy|
+------------------------------------+----------------------------------------------+
```

---

### 8. Key Assumptions & Dependencies

1. **Hardware Availability:** All 10 pilot collectors possess an active Android smartphone capable of running Flutter apps and capturing photos, or will be provided a loaner device for the pilot.
2. **Weighing Infrastructure:** Each collector will be equipped with a standardized, calibrated 50kg digital hanging luggage/hook scale with tare functionality.
3. **Local Partner Commitment:** Memorandums of Understanding (MoUs) secured with 2 housing societies (managing centralized sorting stations) and 5 corporate offices before Week 4.
4. **Industrial Recycler Offtake:** 2 recycling facilities agree to honor digital batch delivery receipts and purchase bulk aggregated materials at agreed weekly benchmark rates.
5. **Telecom Connectivity:** 4G/LTE mobile data is accessible across the pilot zones in Karachi; offline local caching handles intermittent network drops.
