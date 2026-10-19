# SafaiPay Phase 1: Comprehensive Risk Register & Mitigation Strategy
**Document Version:** 1.0.0  
**Phase:** Phase 1 MVP Pilot  
**Risk Scoring Model:** Qualitative 5x5 Matrix ($\text{Severity Score} = \text{Likelihood} [1\text{--}5] \times \text{Impact} [1\text{--}5]$)  

---

### 1. Risk Governance & Management Framework

The SafaiPay Risk Management Framework is structured around proactive prevention, strict regulatory adherence (State Bank of Pakistan, PECA), transparent human-in-the-loop validation, and rapid contingency escalation.

```
+----------------------------------------------------------------------------------------------------+
|                                    RISK SEVERITY CLASSIFICATION                                    |
+-------------------+----------------------------+---------------------------------------------------+
| Score Range       | Risk Level                 | Action & Governance Protocol                      |
+-------------------+----------------------------+---------------------------------------------------+
| **15 – 25**       | **CRITICAL / HIGH**        | Immediate mitigation mandatory; active weekly     |
|                   |                            | review by Technical and Operations Leads.         |
+-------------------+----------------------------+---------------------------------------------------+
| **8 – 14**        | **MEDIUM**                 | Monitored through automated alerts and standard   |
|                   |                            | operational controls.                             |
+-------------------+----------------------------+---------------------------------------------------+
| **1 – 7**         | **LOW**                    | Managed via routine application safeguards.       |
+-------------------+----------------------------+---------------------------------------------------+
```

---

### 2. Comprehensive Risk Register Matrix

| Risk ID | Domain Category | Risk Description & Root Cause | Likelihood (1-5) | Impact (1-5) | Severity Score | Preventative Mitigation Strategy | Reactive Contingency Plan | Early Warning Metric | Risk Owner |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- | :--- | :--- | :--- |
| **RSK-ADOPT-01** | **Worker Adoption & Literacy** | Informal waste collectors (*kabaris*) struggle with smartphone interface due to low formal literacy, resulting in job drops or app abandonment. | 4 | 4 | **16 (High)** | Design high-contrast UI, Urdu/Roman Urdu localization, spoken audio cues, and hands-on 1-on-1 field training with loaner phones. | Operations dispatch coordinator calls collector directly via voice to assist navigation and weighing. | Active collector daily job completion rate falls below 70%. | UX Lead & Ops Lead |
| **RSK-WEIGH-01** | **Fraud & Fake Weights** | Collector inputs exaggerated weight, tampers with scale, or adds water/stones to cardboard/bottles to artificially inflate payout. | 4 | 4 | **16 (High)** | Issue calibrated digital hanging scales with tamper seals; require mandatory scale LCD photo upload; mandate Customer OTP confirmation. | Discrepancy triggers Admin dispute panel; collector account frozen if fraud confirmed; scale re-inspected. | Variance between customer estimate and verified scale weight exceeds 40%. | Ops Lead & Backend Lead |
| **RSK-PRICE-01** | **Price Volatility & Leakage** | Local scrap dealer (*kabari dukan*) offers higher spot cash, tempting collectors to bypass SafaiPay and sell offline. | 4 | 3 | **12 (Med)** | Update daily benchmark rates daily based on Shershah/Korangi spot prices; emphasize long-term value of digital financial identity and loan access. | Increase quality incentive multiplier or offer pilot milestone completion bonuses for verified pickups. | Drop in collector weekly job acceptance rate below 60%. | Business Lead |
| **RSK-REG-01** | **Payment & Banking Regulation** | Regulators (State Bank of Pakistan) perceive SafaiPay as operating an unlicensed digital wallet or holding customer funds. | 2 | 5 | **10 (Med)** | **Strict Non-Custodial Architecture:** MVP operates purely as a simulated sandbox ledger. Prominent legal disclaimers: SafaiPay is NOT a bank or lender. | Immediately present SBP-compliant compliance dossier proving zero fiat currency pooling or custody. | Any inquiry or regulatory notice regarding financial intermediation. | Tech Lead & Legal Advisor |
| **RSK-PRIV-01** | **Data Privacy & Lender Exposure** | Informal worker financial earnings data is leaked, scraped, or shared with microfinance lenders without explicit worker opt-in consent. | 2 | 5 | **10 (Med)** | AES-256 database encryption; strict RBAC; immutable `lender_consent_logs` table requiring worker explicit opt-in with auto-expiration (30-90 days). | Instant cryptographic token revocation; audit log investigation; automatic notification to affected worker. | Any external access attempt to worker profile without matching consent ID. | Backend Lead |
| **RSK-AI-01** | **AI Classification Misidentification** | Vision model hallucinates non-recyclable plastic (e.g. PVC/polystyrene) as PET, or NLP parser misinterprets Roman Urdu weight quantity. | 4 | 3 | **12 (Med)** | **Human-in-the-Loop Business Rule:** AI output is hardcoded as an advisory estimate only; collector physical grading on-site is mandatory and binding. | App provides 1-tap manual category dropdown fallback if AI confidence is below 70%. | Frequency of collector changing material category on-site exceeds 25%. | AI / Data Lead |
| **RSK-OPS-01** | **Material Transit Contamination** | Collected dry cardboard is exposed to sudden rain or urban runoff during collector tricycle transit, degrading quality to zero. | 3 | 3 | **9 (Med)** | Issue heavy-duty waterproof tarpaulins to all 10 pilot collectors; integrate Open-Meteo weather rain alerts into collector app. | Route collector immediately to nearest dry aggregation hub; downgrade to Tier C if salvageable. | Weather forecast probability of rain > 60% during scheduled pickup slot. | Ops Lead |

---

### 3. In-Depth Risk Analysis & Regulatory Guardrails

#### 3.1 Domain 1: Worker Adoption & Digital Literacy
- **Context:** Informal scrap workers in Karachi typically rely on cash and verbal bargaining. Complex forms, small fonts, or English menus cause immediate cognitive fatigue and rejection.
- **Enforced Safeguards:**
  - Full interface localized into conversational Roman Urdu (e.g. *"Kaam Shuru Karein"*, *"Wazan Darj Karein"*).
  - Clear voice synthesizer audio cues for every transactional step.
  - Number inputs default to large numeric touchpads rather than standard text keyboards.
  - Dedicated Field Operations Lead (Member 4) conducts bi-weekly check-ins at collector aggregation yards.

#### 3.2 Domain 2: Fraud, Fake Weights & Deliberate Contamination
- **Context:** Recyclable trade historically suffers from weight manipulation (e.g. soaked cardboard boxes, sand inside plastic jugs, altered spring scales).
- **Enforced Safeguards:**
  - **Calibrated Digital Scales:** All 10 pilot collectors receive certified digital hanging scales with fixed calibration tags. Manual spring scales are strictly banned.
  - **Scale Display Photo Proof:** Before completing a job, the collector must upload a clear photo displaying the hanging scale LCD read-out alongside the sorted bags.
  - **Customer Handshake OTP:** Final transaction price and weight are locked only when the customer provides their private 4-digit OTP displayed on their own smartphone screen.
  - **Statistical Anomaly Triggers:** If verified weight exceeds 3 standard deviations from average commercial office batch size, the transaction is automatically flagged for administrative audit.

#### 3.3 Domain 3: Scrap Price Volatility & Market Disintermediation
- **Context:** Scrap rates fluctuate with international polymer and pulp prices and local supply. If SafaiPay's benchmark rate lags behind local scrap dealers, collectors will abandon the app.
- **Enforced Safeguards:**
  - Admin Operations portal allows daily updates of benchmark rates per kg (`material_price_history`).
  - Transparent pricing formula ensures collector receives 100% of the quality-adjusted rate, eliminating unfair middleman deductions.
  - Collectors are continuously educated on the value of their **Digital Financial Identity** (unlocking future micro-loans for motor loaders and health insurance).

#### 3.4 Domain 4: Payment Regulation & Non-Custodial Compliance
- **Context:** Pakistan's Payment Systems and Electronic Fund Transfers Act (PS&EFTA) and Electronic Money Institutions (EMI) regulations prohibit non-licensed entities from issuing digital wallets or holding customer funds.
- **Enforced Safeguards:**
  - **Zero Fund Custody:** SafaiPay does not open stored-value wallets, escrow accounts, or accept cash deposits.
  - **Simulated Ledger:** All MVP financial balances, payouts, and settlements are explicitly defined in system schemas and UI text as a **Simulated Ledger**.
  - **Mandatory Legal Disclaimer:** Embedded in application terms, footers, and invoices:  
    > *"SafaiPay is a circular economy technology platform and does not hold customer funds, provide banking services, or act as an insurer or lender."*

#### 3.5 Domain 5: Data Privacy, PECA Compliance & Financial Scoring
- **Context:** Informal workers are vulnerable to exploitative predatory lending if their income records are disclosed indiscriminately.
- **Enforced Safeguards:**
  - Under the Prevention of Electronic Crimes Act (PECA), collector personal data (CNIC, phone, residential area) is encrypted at rest using AES-256 and redacted in client APIs.
  - **Consent-First Architecture:** The backend API strictly rejects any lender query without an active, unexpired cryptographic consent record in `lender_consent_logs`.
  - The worker can revoke lender access at any instant with a single tap in `SCR-MOB-COLL-07`.

#### 3.6 Domain 6: AI Inaccuracies & Computer Vision Hallucinations
- **Context:** Computer vision models can confuse lookalike polymers (PET vs PVC vs HDPE) or misjudge cardboard contamination levels from single 2D photos.
- **Enforced Safeguards:**
  - **Advisory Estimate Guardrail:** The AI output is hardcoded as an advisory estimate only:  
    > *"AI classification is an estimate only. Final verification is performed on-site by the verified collector."*
  - The deterministic pricing formula utilizes **only** the on-site verified weight and collector-assigned quality factor. AI inferences never directly mutate transactional billing amounts.
  - A fallback dropdown menu allows users to immediately correct the category if the model misidentifies the material.

---

### 4. Continuous Risk Review Cadence

The project team will conduct weekly Risk Register audits during Sprint Planning:
1. **Weekly Anomaly Review (Mondays):** Review weight variance logs, rejected scale photos, and dispute tickets.
2. **Field Equipment Calibration (Bi-Weekly):** Inspect physical digital hanging scales for drift or damage.
3. **Regulatory Checkpoint (End of Week 4):** Verify that all simulated ledger endpoints and disclaimers remain 100% compliant with SBP non-custody guidelines prior to live pilot deployment.
