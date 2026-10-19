# SafaiPay Frontend Architecture

## 1. Overview
The SafaiPay frontend is a modern, high-performance Next.js 14 application leveraging App Router, React Server Components (where applicable), TypeScript, and Tailwind CSS. It provides responsive, accessible portals tailored for four distinct user roles: **Customer**, **Collector**, **Recycler**, and **Admin**.

## 2. Directory Structure
```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (customer)/
│   │   └── customer/
│   │       ├── dashboard/page.tsx
│   │       ├── book-pickup/page.tsx
│   │       ├── pickups/page.tsx
│   │       ├── receipts/page.tsx
│   │       └── profile/page.tsx
│   ├── (collector)/
│   │   └── collector/
│   │       ├── dashboard/page.tsx
│   │       ├── jobs/page.tsx
│   │       ├── active-job/page.tsx
│   │       ├── earnings/page.tsx
│   │       ├── income-profile/page.tsx
│   │       └── profile/page.tsx
│   ├── (recycler)/
│   │   └── recycler/
│   │       ├── dashboard/page.tsx
│   │       ├── marketplace/page.tsx
│   │       ├── batch-requests/page.tsx
│   │       ├── dispatch/page.tsx
│   │       ├── traceability/page.tsx
│   │       └── profile/page.tsx
│   ├── (admin)/
│   │   └── admin/
│   │       ├── dashboard/page.tsx
│   │       ├── operations/page.tsx
│   │       ├── users/page.tsx
│   │       ├── pricing/page.tsx
│   │       ├── payments/page.tsx
│   │       ├── fraud-alerts/page.tsx
│   │       ├── reports/page.tsx
│   │       ├── audit-logs/page.tsx
│   │       └── settings/page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   ├── loading.tsx
│   ├── error.tsx
│   └── not-found.tsx
├── components/
│   ├── ui/
│   ├── layout/
│   ├── navigation/
│   ├── forms/
│   ├── cards/
│   ├── charts/
│   ├── tables/
│   ├── modals/
│   ├── notifications/
│   ├── pickup/
│   ├── payments/
│   └── auth/
├── features/
├── services/
├── hooks/
├── lib/
│   ├── api.ts
│   ├── mockData.ts
│   └── types.ts
├── context/
│   ├── AuthContext.tsx
│   └── LanguageContext.tsx
└── styles/
```

## 3. Core Architectural Principles
1. **Strict Role-Based Routing:** Every role has its own scoped sub-routes wrapped in `<ProtectedRoute allowedRole={['roleName', 'admin']}>`.
2. **Zero Default to Admin:** Users are never routed to admin by default. Redirection inspects verified user tokens, falling back to role-specific onboarding if unknown.
3. **Dual-Mode API & Offline Resilience:** `lib/api.ts` probes FastAPI backend `/api/v1/health`. If backend is unreachable (e.g. static preview on Vercel), it transparently operates with synced mock state stored in `localStorage`, maintaining complete interactivity.
4. **Bilingual English & Urdu Support:** `LanguageContext` provides instant language switching, formatting currency (PKR), weights (kg/tons), and localized terminology across all cards and headers.
5. **Eco-Brand Aesthetic:** SafaiPay utilizes an emerald/lavender/purple color scheme with high contrast, semantic badges, and mobile-friendly touch targets.
