# SafaiPay Phase 1: Role-Based Access Control (RBAC) & Permissions
**Document Version:** 1.0.0  
**Phase:** Phase 1 MVP Pilot  
**Security Architecture:** JWT Role-Claims, Principle of Least Privilege, Field-Level PII Masking  

---

### 1. Persona Profiles & Operational Boundaries

SafaiPay enforces a strict zero-trust Role-Based Access Control (RBAC) model. Each of the four core user roles operates within a tightly defined operational boundary:

```
+----------------------------------------------------------------------------------------------------+
|                                    ROLE SUMMARY & SYSTEM RESPONSIBILITY                             |
+-------------------+--------------------+-----------------------------------------------------------+
| Role Key          | Display Persona    | Core System Responsibility                                 |
+-------------------+--------------------+-----------------------------------------------------------+
| ROLE_CUSTOMER     | Waste Generator    | Books recyclable pickups, views AI estimates, verifies    |
|                   | (Offices/Societies)| final weight on-site via OTP, monitors ESG impact.        |
+-------------------+--------------------+-----------------------------------------------------------+
| ROLE_COLLECTOR    | Waste Worker       | Receives job broadcasts, accepts pickups, weighs waste    |
|                   | (*Kabari*)         | physically, submits photo proof, builds financial history. |
+-------------------+--------------------+-----------------------------------------------------------+
| ROLE_RECYCLER     | Industrial Buyer   | Posts procurement tenders, inspects aggregated batches,   |
|                   | (Processing Plant) | logs dock scale receipts, downloads trade vouchers.       |
+-------------------+--------------------+-----------------------------------------------------------+
| ROLE_ADMIN        | Operations Lead    | Vets collectors (KYC), sets daily benchmark rates,        |
|                   | (SafaiPay Platform)| mediates disputes, monitors simulated ledger and pilot.   |
+-------------------+--------------------+-----------------------------------------------------------+
```

---

### 2. Comprehensive RBAC Operations Matrix

The following matrix details explicit CRUD permissions across all system modules:
- **C:** Create / Submit
- **R:** Read / View
- **U:** Update / Modify
- **D:** Delete / Deactivate
- **X:** Execute / Transition State
- **--:** Prohibited / Zero Access

| Functional Domain / Resource Entity | Operation / Capability | Customer | Collector | Recycler | Admin | Security Policy & Guardrail Enforcement |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Authentication & Profile** | Register / OTP Login | C, R | C, R | C, R | C, R | Public OTP endpoint; rate-limited to 5 requests/min. |
| | View Own Profile | R | R | R | R | Enforced via `token.sub == user_id`. |
| | Edit Own Contact / Profile | U | U | U | U | CNIC and NTN cannot be edited without Admin review. |
| | Toggle Online Availability | -- | U | -- | -- | Only verified collectors can toggle `is_online = true`. |
| **Collector Onboarding (KYC)** | Submit CNIC & Vehicle Details | -- | C, U | -- | R | Collector inputs KYC; sets `kyc_status = 'SUBMITTED'`. |
| | Approve / Reject KYC Profile | -- | -- | -- | U, X | Only Admin can promote collector to `VERIFIED`. |
| **Pickups & Dispatch** | Create Pickup Request | C | -- | -- | C | Customer initiates booking; validated within pilot geo-polygon. |
| | View Available Radius Jobs | -- | R | -- | R | Collector sees unassigned jobs within 5km radius. |
| | Accept Pickup Job | -- | X | -- | X | Atomic Redis lock prevents race conditions. |
| | Cancel Pickup Request | U, X | U, X | -- | U, X | Customer can cancel before arrival; collector can forfeit job. |
| | Record Scale Weight & Grade | -- | C, U | -- | U | Collector enters physical scale weight and quality tier. |
| | View Completion OTP | R | -- | -- | R | Displayed only on Customer device screen. |
| | Submit Completion OTP | -- | X | -- | X | Collector submits OTP to transition pickup to `COMPLETED`. |
| **AI Classification** | Request Image Classification | C, R | C, R | -- | R | Returns advisory estimate with mandatory disclaimer. |
| | Parse Roman Urdu Text | C, R | C, R | -- | R | Extracts material, quantity, and time entities. |
| **Pricing Engine** | View Active Benchmark Rates | R | R | R | R | Public read-only cache of current rates per kg. |
| | Update Benchmark Scrap Rates | -- | -- | -- | C, U | Only Admin can publish rate changes to `material_price_history`. |
| **Simulated Financial Ledger** | View Own Simulated Balance/Ledger| R | R | R | R | Scoped strictly to authenticated user's ledger entries. |
| | Export Income History (PDF) | -- | R, X | -- | R | Collector downloads digital income proof. |
| | Adjust Ledger Balance (Dispute) | -- | -- | -- | C, U | Only Admin can issue simulated corrective adjustment vouchers.|
| **Financial Identity & Consent** | View Collector Credit Identity | -- | R | -- | R | Aggregated stats (kg collected, consistency score). |
| | Grant Third-Party Consent | -- | C, U | -- | -- | **Strict Rule:** Worker must explicitly opt-in with signature.|
| | Revoke Third-Party Consent | -- | U, D | -- | -- | Collector can revoke consent at any time with immediate effect.|
| | Export Profile to Microfinance | -- | -- | -- | R, X | **Prohibited** unless valid active consent token is verified. |
| **Recycler B2B Marketplace** | Post Material Demand Tender | -- | -- | C, U | C, U | Recycler defines target kg and offered price. |
| | Browse Recycler Tenders | -- | R | R | R | Collectors view wholesale off-take prices. |
| | Allocate Aggregated Batches | -- | -- | -- | C, X | Admin matches aggregated collector stock to tenders. |
| | Confirm Gate Delivery & Scale | -- | -- | U, X | U | Recycler inputs receiving weighbridge weight. |
| **Disputes & Governance** | Open Dispute Ticket | C | C | C | C | Raised if weight, quality, or payment is contested. |
| | Mediate & Resolve Dispute | -- | -- | -- | U, X | Admin reviews photo evidence and enters binding resolution. |
| | View System Audit Logs | -- | -- | -- | R | Immutable record of all administrative state mutations. |

---

### 3. Field-Level Security & PII Protection

To protect vulnerable informal workers and safeguard corporate privacy, field-level masking is enforced at the serialization layer:

```
+----------------------------------------------------------------------------------------------------+
|                                    FIELD-LEVEL DATA PRIVACY RULES                                   |
+-------------------+----------------------------+---------------------------------------------------+
| Target Field      | Display Recipient          | Masking / Encryption Rule                         |
+-------------------+----------------------------+---------------------------------------------------+
| Collector CNIC    | Customer & Recycler        | **COMPLETELY REDACTED** (Never exposed to clients)|
|                   | Admin Portal               | Masked: `42101-*****67-1` (Full view requires 2FA)|
+-------------------+----------------------------+---------------------------------------------------+
| Customer Phone &  | Collector (Unassigned Job) | Masked: "Falcon Complex, PECHS" (Street & phone   |
| Address           |                            | hidden until job is formally accepted).           |
|                   | Collector (Accepted Job)   | Full street address and contact phone displayed.  |
+-------------------+----------------------------+---------------------------------------------------+
| Collector Live    | Customer (In-Transit)      | Approximate radius circle (within 100 meters);    |
| GPS Coordinate    |                            | exact real-time pinpoint disabled for safety.     |
+-------------------+----------------------------+---------------------------------------------------+
| Financial Profile | Third-Party Lenders        | **ZERO ACCESS BY DEFAULT.** Requires active       |
| & Score           |                            | entry in `lender_consent_logs` with valid token.   |
+-------------------+----------------------------+---------------------------------------------------+
```

---

### 4. JWT Token Architecture & RBAC Middleware

#### 4.1 Access Token Payload Structure
```json
{
  "iss": "https://auth.safaipay.org",
  "sub": "e4b2d3c1-0011-4f8a-9231-182390dfae01",
  "roles": ["COLLECTOR"],
  "kyc_status": "VERIFIED",
  "phone": "+923001234567",
  "iat": 1792420000,
  "exp": 1792423600
}
```

#### 4.2 FastAPI Dependency Injection RBAC Guard Example
```python
from fastapi import Depends, HTTPException, status
from app.core.auth import get_current_user

def require_role(allowed_roles: list[str]):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        user_roles = current_user.get("roles", [])
        if not any(role in user_roles for role in allowed_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Insufficient role permissions."
            )
        return current_user
    return role_checker

# Usage in Router:
# @router.post("/admin/pricing/benchmarks", dependencies=[Depends(require_role(["ADMIN"]))])
```
