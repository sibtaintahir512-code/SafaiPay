# SafaiPay Security Architecture & Privacy Policy

## 1. Overview
SafaiPay processes citizen data, informal waste worker financial identities, and industrial trade transactions. Security is embedded at every layer through the Principle of Least Privilege, zero-trust RBAC, and defense-in-depth principles.

---

## 2. Secrets Management & Environment Isolation
1. **Zero Hardcoded Credentials:** Passwords, API keys, database URLs, and cryptographic secrets are strictly banned from source code and Git repositories.
2. **Sanitized Version Control:** All `.env` files are ignored via root and frontend `.gitignore`. Only `.env.example` templates containing sanitized placeholders are committed.
3. **Least Privilege Secret Scoping:** Production tokens (`SECRET_KEY`, database credentials) are injected dynamically via environment variables or secret vaults at runtime.

---

## 3. Cryptography & Authentication
- **Password Hashing:** Passwords are hashed using PBKDF2/bcrypt (`passlib[bcrypt]`) with salt rounds exceeding industry standards.
- **JWT Authorization:** Tokens are signed using HMAC-SHA256 with user ID, assigned role claims, and 24-hour expiration windows.
- **Mutual Verification OTP:** Pickup transactions require a 4-digit mutual confirmation code generated dynamically on the customer device, preventing unauthorized job completions.

---

## 4. Fraud Prevention & Anomaly Guard
1. **Weight Variance Guard:** If physical weighed weight deviates by more than 25% from customer initial estimate, an automated warning flag is raised for admin inspection.
2. **Computer Vision Duplicate Prevention:** Scale reading photos undergo image hashing to prevent re-upload of previous weighing evidence.
3. **Geofencing Verification:** Collector on-site actions are matched against customer geolocations within designated municipal pilot sectors.

---

## 5. Regulatory & Privacy Compliance (PECA / SBP)
- **PII Masking:** Customer phone numbers and addresses are masked in public endpoints and only revealed to assigned collectors when an active job is accepted.
- **Non-Custodial Financial Engine:** The platform holds zero customer deposits. Simulated ledger records provide cryptographic proof of settlement without violating SBP banking regulations.
- **Immutable Audit Trail:** All critical operations (pricing adjustments, user suspensions, role switches) write tamper-evident log records.
