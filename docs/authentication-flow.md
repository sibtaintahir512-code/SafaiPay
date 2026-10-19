# SafaiPay Authentication & Authorization Flow

## 1. Overview
SafaiPay employs a robust, stateless JWT (JSON Web Token) authentication architecture combined with fine-grained Role-Based Access Control (RBAC). The system guarantees that every authenticated user is directed strictly to their authorized dashboard and never defaulted to Admin.

## 2. Authentication Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Customer / Collector / Recycler / Admin)
    participant Client as Next.js Frontend
    participant Gateway as API Gateway / Route Handler
    participant Backend as FastAPI Backend (/api/v1/auth)
    participant DB as Relational Database

    User->>Client: Enters Phone / Email & Password
    Client->>Gateway: POST /api/v1/auth/login
    Gateway->>Backend: Validates credentials with bcrypt
    Backend->>DB: Query user & assigned roles
    DB-->>Backend: UserRecord + Role Associations
    Backend->>Backend: Generate HMAC-SHA256 JWT Token
    Backend-->>Gateway: { access_token, user: { id, role, roles } }
    Gateway-->>Client: 200 OK + Token & Normalized User Profile
    Client->>Client: Store token in secure storage (cookie/localStorage)
    Client->>Client: Check user.role and redirect to role-specific dashboard
    Client->>User: Renders Customer / Collector / Recycler / Admin Dashboard
```

## 3. Dynamic Role Extraction Algorithm
To ensure compatibility across microservices, mobile apps, and varying backend payload formats, the frontend implements `extractUserRole(data)`:
1. Direct inspection of `data.role` (string or `{ name: ... }`).
2. Inspection of `data.roles` array (strings or objects with `role_name`).
3. Inspection of sub-profile keys:
   - `data.admin_profile` -> `admin`
   - `data.collector_profile` -> `collector`
   - `data.recycler_profile` -> `recycler`
   - `data.customer_profile` -> `customer`
4. If role is unassigned or empty, user is safely routed to `/onboarding` to select their persona. **Users are never defaulted to Admin**.

## 4. Protected Route Guarding
Every role dashboard is guarded by `<ProtectedRoute allowedRole={['targetRole', 'admin']}>`.
- If unauthenticated -> redirected to `/login`.
- If authenticated but incorrect role -> redirected to `getDashboardPath(user.role)`.
- If role is `unknown` -> redirected to `/onboarding`.

## 5. Seed Test Credentials
| Role | Username / Identifier | Password | Default Redirect |
|---|---|---|---|
| **Admin** | `admin@safaipay.org` | `AdminPassword123!` | `/admin/dashboard` |
| **Customer** | `+923001110001` | `SafaiPassword123!` | `/customer/dashboard` |
| **Collector** | `+923002220001` | `SafaiPassword123!` | `/collector/dashboard` |
| **Recycler** | `+923003330001` | `SafaiPassword123!` | `/recycler/dashboard` |
