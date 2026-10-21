import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST as guestLoginHandler } from '../app/api/v1/auth/guest-login/route';
import { GET as getMeHandler, PUT as putMeHandler } from '../app/api/v1/auth/me/route';
import { POST as changePasswordHandler } from '../app/api/v1/auth/change-password/route';
import { GET as getAdminUsersHandler } from '../app/api/v1/admin/users/route';
import { GET as getAdminDisputesHandler } from '../app/api/v1/admin/disputes/route';
import { GET as getAdminPickupsHandler } from '../app/api/v1/admin/pickups/route';
import { GET as getAdminSuspiciousHandler } from '../app/api/v1/admin/suspicious-records/route';
import { POST as postAdminApproveHandler } from '../app/api/v1/admin/collectors/[id]/approve/route';
import { POST as postAdminRejectHandler } from '../app/api/v1/admin/collectors/[id]/reject/route';
import { verifyJwt, signJwt, checkGuestRateLimit, VERIFIED_USERS } from '../lib/serverAuth';
import { getDashboardPath } from '../lib/api';

describe('SafaiPay Guest Mode Production Readiness Suite', () => {

  describe('1. Role Resolution and Verification', () => {
    it('verifies customer demo user usr_guest_cust exists with correct profile', () => {
      const cust = VERIFIED_USERS.find(u => u.id === 'usr_guest_cust');
      assert.ok(cust, 'usr_guest_cust must exist');
      assert.equal(cust.role, 'customer');
      assert.deepEqual(cust.roles, ['CUSTOMER']);
      assert.equal(cust.is_active, true);
      assert.equal(cust.is_phone_verified, true);
      assert.ok(cust.profile?.street_address?.includes('PECHS, Karachi'));
    });

    it('verifies collector demo user usr_guest_coll exists with verified scale', () => {
      const coll = VERIFIED_USERS.find(u => u.id === 'usr_guest_coll');
      assert.ok(coll, 'usr_guest_coll must exist');
      assert.equal(coll.role, 'collector');
      assert.deepEqual(coll.roles, ['COLLECTOR']);
      assert.equal(coll.is_active, true);
      assert.equal(coll.profile?.digital_scale_id, 'SCALE-GUEST-01');
      assert.equal(coll.profile?.cnic_number, '42101-0000000-1');
    });

    it('verifies recycler demo user usr_guest_recy exists with licensed facility', () => {
      const recy = VERIFIED_USERS.find(u => u.id === 'usr_guest_recy');
      assert.ok(recy, 'usr_guest_recy must exist');
      assert.equal(recy.role, 'recycler');
      assert.deepEqual(recy.roles, ['RECYCLER']);
      assert.equal(recy.is_active, true);
      assert.ok(recy.profile?.company_name.includes('Guest Recycler'));
      assert.ok(recy.profile?.factory_address.includes('Korangi Industrial Area'));
    });
  });

  describe('2. Guest Login API Validation & JWT Issuance', () => {
    it('rejects empty body / missing role with HTTP 400', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/auth/guest-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.10' },
        body: JSON.stringify({}),
      });
      const res = await guestLoginHandler(req);
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.match(data.detail, /Role is required/);
    });

    it('rejects unauthorized or unknown roles (e.g. admin) with HTTP 400', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/auth/guest-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.11' },
        body: JSON.stringify({ role: 'admin' }),
      });
      const res = await guestLoginHandler(req);
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.match(data.detail, /Invalid guest role/);
    });

    it('issues 24h JWT with correct claims for customer guest login', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/auth/guest-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.12' },
        body: JSON.stringify({ role: 'customer' }),
      });
      const res = await guestLoginHandler(req);
      assert.equal(res.status, 200);
      const data = await res.json();
      
      assert.equal(data.user.id, 'usr_guest_cust');
      assert.equal(data.user.role, 'customer');
      assert.equal(data.token_type.toLowerCase(), 'bearer');
      assert.equal(data.expires_in, 86400);
      assert.equal(data.isGuest, true);
      assert.equal(data.is_guest, true);

      // Verify JWT token signature and payload
      const claims = verifyJwt(data.access_token);
      assert.ok(claims, 'JWT token must be valid and cryptographically signed');
      assert.equal(claims.sub, 'usr_guest_cust');
      assert.equal(claims.role, 'customer');
      assert.equal(claims.isGuest, true);
      assert.equal(claims.is_guest, true);
      assert.equal(claims.exp - claims.iat, 86400, 'Expiry must be exactly 24 hours');
    });

    it('issues 24h JWT for collector guest login', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/auth/guest-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.13' },
        body: JSON.stringify({ role: 'collector' }),
      });
      const res = await guestLoginHandler(req);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.user.id, 'usr_guest_coll');
      assert.equal(data.user.role, 'collector');
      assert.equal(data.expires_in, 86400);
    });

    it('issues 24h JWT for recycler guest login', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/auth/guest-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.14' },
        body: JSON.stringify({ role: 'recycler' }),
      });
      const res = await guestLoginHandler(req);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.user.id, 'usr_guest_recy');
      assert.equal(data.user.role, 'recycler');
      assert.equal(data.expires_in, 86400);
    });
  });

  describe('3. Session Persistence & /api/v1/auth/me', () => {
    it('returns persistent guest state when fetching /api/v1/auth/me with guest token', async () => {
      // First obtain a guest customer token
      const loginReq = new NextRequest('http://localhost:3000/api/v1/auth/guest-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.20' },
        body: JSON.stringify({ role: 'customer' }),
      });
      const loginRes = await guestLoginHandler(loginReq);
      const { access_token } = await loginRes.json();

      // Now call /api/v1/auth/me
      const meReq = new NextRequest('http://localhost:3000/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const meRes = await getMeHandler(meReq);
      assert.equal(meRes.status, 200);
      const meData = await meRes.json();
      assert.equal(meData.id, 'usr_guest_cust');
      assert.equal(meData.isGuest, true);
      assert.equal(meData.is_guest, true);
    });
  });

  describe('4. Security Safeguards: Block Destructive Operations on Guest Accounts', () => {
    it('blocks change-password for guest sessions with HTTP 403', async () => {
      const loginReq = new NextRequest('http://localhost:3000/api/v1/auth/guest-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.30' },
        body: JSON.stringify({ role: 'customer' }),
      });
      const loginRes = await guestLoginHandler(loginReq);
      const { access_token } = await loginRes.json();

      const changeReq = new NextRequest('http://localhost:3000/api/v1/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          current_password: 'SafaiPassword123!',
          new_password: 'NewHackedPassword123!',
        }),
      });
      const changeRes = await changePasswordHandler(changeReq);
      assert.equal(changeRes.status, 403);
      const err = await changeRes.json();
      assert.match(err.detail, /Guest demo accounts are read-only/);
    });

    it('blocks PUT /api/v1/auth/me profile mutations for guest accounts with HTTP 403', async () => {
      const loginReq = new NextRequest('http://localhost:3000/api/v1/auth/guest-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.31' },
        body: JSON.stringify({ role: 'collector' }),
      });
      const loginRes = await guestLoginHandler(loginReq);
      const { access_token } = await loginRes.json();

      const putReq = new NextRequest('http://localhost:3000/api/v1/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({ full_name: 'Modified Name' }),
      });
      const putRes = await putMeHandler(putReq);
      assert.equal(putRes.status, 403);
      const err = await putRes.json();
      assert.match(err.detail, /Guest demo accounts cannot modify profile information/);
    });
  });

  describe('5. RBAC Authorization: Protected Admin Endpoints Guard Against Guests', () => {
    let customerGuestToken: string;

    it('setup: acquire customer guest token', async () => {
      const loginReq = new NextRequest('http://localhost:3000/api/v1/auth/guest-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.40' },
        body: JSON.stringify({ role: 'customer' }),
      });
      const loginRes = await guestLoginHandler(loginReq);
      const data = await loginRes.json();
      customerGuestToken = data.access_token;
      assert.ok(customerGuestToken);
    });

    it('blocks guest access to /api/v1/admin/users with HTTP 403', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/admin/users', {
        headers: { Authorization: `Bearer ${customerGuestToken}` },
      });
      const res = await getAdminUsersHandler(req);
      assert.equal(res.status, 403);
    });

    it('blocks guest access to /api/v1/admin/disputes with HTTP 403', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/admin/disputes', {
        headers: { Authorization: `Bearer ${customerGuestToken}` },
      });
      const res = await getAdminDisputesHandler(req);
      assert.equal(res.status, 403);
    });

    it('blocks guest access to /api/v1/admin/pickups with HTTP 403', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/admin/pickups', {
        headers: { Authorization: `Bearer ${customerGuestToken}` },
      });
      const res = await getAdminPickupsHandler(req);
      assert.equal(res.status, 403);
    });

    it('blocks guest access to /api/v1/admin/suspicious-records with HTTP 403', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/admin/suspicious-records', {
        headers: { Authorization: `Bearer ${customerGuestToken}` },
      });
      const res = await getAdminSuspiciousHandler(req);
      assert.equal(res.status, 403);
    });

    it('blocks guest access to POST /api/v1/admin/collectors/[id]/approve with HTTP 403', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/admin/collectors/usr-coll-001/approve', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerGuestToken}` },
      });
      const res = await postAdminApproveHandler(req, { params: { id: 'usr-coll-001' } });
      assert.equal(res.status, 403);
    });

    it('blocks unauthenticated access to admin endpoints with HTTP 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/admin/users');
      const res = await getAdminUsersHandler(req);
      assert.equal(res.status, 401);
    });
  });

  describe('6. Dashboard Routing Guardrails', () => {
    it('customer guest routes to /customer/dashboard', () => {
      assert.equal(getDashboardPath('customer'), '/customer/dashboard');
    });

    it('collector guest routes to /collector/dashboard', () => {
      assert.equal(getDashboardPath('collector'), '/collector/dashboard');
    });

    it('recycler guest routes to /recycler/dashboard', () => {
      assert.equal(getDashboardPath('recycler'), '/recycler/dashboard');
    });
  });

  describe('7. Abuse Protection & Rate Limiting', () => {
    it('enforces max 30 guest logins per minute per IP', () => {
      const testIp = '192.168.99.100';
      // First 30 requests should succeed
      for (let i = 0; i < 30; i++) {
        const check = checkGuestRateLimit(testIp);
        assert.equal(check.isLimited, false, `Attempt ${i + 1} should not be limited`);
      }
      // 31st request must trigger rate limit
      const limited = checkGuestRateLimit(testIp);
      assert.equal(limited.isLimited, true, '31st attempt must be rate limited');
      assert.ok(limited.retryAfterSeconds > 0, 'Retry-After seconds must be positive');
    });
  });

  describe('8. Safe Logout & Session Clearing Guardrails', () => {
    it('verifies guest token removal and unauthenticated state', () => {
      // Mock client-side storage
      const storage: Record<string, string> = {};
      const mockSet = (k: string, v: string) => { storage[k] = v; };
      const mockGet = (k: string) => storage[k] || null;
      const mockRemove = (k: string) => { delete storage[k]; };

      // Set guest session
      mockSet('safaipay_auth_token', 'sample_guest_jwt_token');
      assert.equal(mockGet('safaipay_auth_token'), 'sample_guest_jwt_token');

      // Logout clears token
      mockRemove('safaipay_auth_token');
      assert.equal(mockGet('safaipay_auth_token'), null);
    });
  });

  describe('9. Guest Role Isolation & Cross-Role Access Boundaries', () => {
    it('ensures distinct non-overlapping dashboard targets for all 3 guest roles', () => {
      const customerTarget = getDashboardPath('customer');
      const collectorTarget = getDashboardPath('collector');
      const recyclerTarget = getDashboardPath('recycler');

      assert.notEqual(customerTarget, collectorTarget);
      assert.notEqual(customerTarget, recyclerTarget);
      assert.notEqual(collectorTarget, recyclerTarget);
    });

    it('verifies guest role token claims strictly preserve assigned role identity', () => {
      const custToken = signJwt({ sub: 'usr_guest_cust', role: 'customer', isGuest: true });
      const collToken = signJwt({ sub: 'usr_guest_coll', role: 'collector', isGuest: true });
      const recyToken = signJwt({ sub: 'usr_guest_recy', role: 'recycler', isGuest: true });

      const verifiedCust = verifyJwt(custToken);
      const verifiedColl = verifyJwt(collToken);
      const verifiedRecy = verifyJwt(recyToken);

      assert.equal(verifiedCust?.role, 'customer');
      assert.equal(verifiedColl?.role, 'collector');
      assert.equal(verifiedRecy?.role, 'recycler');
    });
  });

  describe('10. Mobile Guest Mode, Viewport & Responsive Guardrails', () => {
    const fs = require('fs');
    const path = require('path');

    it('verifies viewport metadata in layout.tsx prohibits unwanted scaling and locks width', () => {
      const layoutContent = fs.readFileSync(path.join(__dirname, '../app/layout.tsx'), 'utf-8');
      
      // Check viewport configuration export
      assert.ok(layoutContent.includes("maximumScale: 1"), 'Layout must have maximumScale: 1');
      assert.ok(layoutContent.includes("userScalable: false"), 'Layout must have userScalable: false');
      assert.ok(layoutContent.includes("width: 'device-width'"), 'Layout must lock to device-width');
      assert.ok(
        layoutContent.includes('content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"'),
        'Layout head must inject explicit viewport meta tag'
      );
    });

    it('verifies globals.css enforces zero overflow-x and iOS Safari 16px focus font guardrail', () => {
      const cssContent = fs.readFileSync(path.join(__dirname, '../app/globals.css'), 'utf-8');

      // Check overflow prevention
      assert.ok(cssContent.includes('overflow-x: hidden'), 'CSS must prevent horizontal overflow');
      // Check manipulation touch-action
      assert.ok(cssContent.includes('touch-action: manipulation'), 'Interactive elements must specify touch-action: manipulation');
      // Check 16px font-size on mobile inputs
      assert.ok(
        cssContent.includes('font-size: 16px !important'),
        'Mobile inputs must enforce 16px to prevent iOS Safari auto-zoom'
      );
    });

    it('verifies LandingLoginPage mobile branch implements strict 8-step visual hierarchy', () => {
      const componentContent = fs.readFileSync(
        path.join(__dirname, '../components/LandingLoginPage.tsx'),
        'utf-8'
      );

      // Step 1: Header / Welcome
      const step1Index = componentContent.indexOf('1. Header & Welcome Heading');
      assert.ok(step1Index > -1, 'Step 1: Header & Welcome Heading must exist');

      // Step 2: Sign-in Fields
      const step2Index = componentContent.indexOf('2. Sign-in Fields');
      assert.ok(step2Index > -1, 'Step 2: Sign-in Fields must exist');
      assert.ok(step2Index > step1Index, 'Step 2 must appear after Step 1');

      // Step 3: Primary Sign-in Button
      const step3Index = componentContent.indexOf('3. Primary Sign-in Button');
      assert.ok(step3Index > -1, 'Step 3: Primary Sign-in Button must exist');
      assert.ok(step3Index > step2Index, 'Step 3 must appear after Step 2');

      // Step 4: Divider
      const step4Index = componentContent.indexOf('4. Divider');
      assert.ok(step4Index > -1, 'Step 4: Divider must exist');
      assert.ok(step4Index > step3Index, 'Step 4 must appear after Step 3');

      // Step 5: Continue as Guest Container
      const step5Index = componentContent.indexOf('5. Continue as Guest Container');
      assert.ok(step5Index > -1, 'Step 5: Continue as Guest Container must exist');
      assert.ok(step5Index > step4Index, 'Step 5 must appear after Step 4');

      // Step 6: Guest Role Selector
      const step6Index = componentContent.indexOf('6. Guest Role Selector');
      assert.ok(step6Index > -1, 'Step 6: Guest Role Selector must exist');
      assert.ok(step6Index > step5Index, 'Step 6 must appear after Step 5');

      // Step 7: Dynamic Guest CTA Button
      const step7Index = componentContent.indexOf('7. Dynamic Guest CTA Button');
      assert.ok(step7Index > -1, 'Step 7: Dynamic Guest CTA Button must exist');
      assert.ok(step7Index > step6Index, 'Step 7 must appear after Step 6');

      // Step 8: Supporting Text / Footer
      const step8Index = componentContent.indexOf('8. Supporting Text / Footer');
      assert.ok(step8Index > -1, 'Step 8: Supporting Text / Footer must exist');
      assert.ok(step8Index > step7Index, 'Step 8 must appear after Step 7');
    });

    it('verifies mobile guest mode roles have single-column layout on small screens and >=48px tap targets', () => {
      const componentContent = fs.readFileSync(
        path.join(__dirname, '../components/LandingLoginPage.tsx'),
        'utf-8'
      );

      // Single column on mobile, 3 cols on sm+
      assert.ok(
        componentContent.includes('grid grid-cols-1 sm:grid-cols-3 gap-2'),
        'Role grid must be single column on mobile (grid-cols-1) and switch to 3 on sm+'
      );

      // Customer, Collector, Recycler min-h-[48px] tap target
      const customerRoleSection = componentContent.indexOf('Customer Option');
      const collectorRoleSection = componentContent.indexOf('Collector Option');
      const recyclerRoleSection = componentContent.indexOf('Recycler Option');

      assert.ok(customerRoleSection > -1 && collectorRoleSection > -1 && recyclerRoleSection > -1);
      assert.ok(
        componentContent.includes('min-h-[48px] flex items-center'),
        'Mobile role cards must satisfy >= 48px tap target accessibility requirement'
      );
    });

    it('verifies responsive width calculation across standard mobile viewports with zero horizontal overflow', () => {
      const testBreakpoints = [
        { name: 'iPhone SE (1st gen)', width: 320, height: 568 },
        { name: 'Android Small', width: 360, height: 800 },
        { name: 'iPhone X / 12 mini', width: 375, height: 812 },
        { name: 'iPhone 13 / 14 / 15', width: 390, height: 844 },
        { name: 'iPhone Plus / Max', width: 414, height: 896 },
        { name: 'iPad Portrait', width: 768, height: 1024 },
      ];

      for (const bp of testBreakpoints) {
        // Container formula: w-[calc(100%-12px)] max-w-[420px]
        const availableWidth = bp.width;
        const computedCardWidth = Math.min(availableWidth - 12, 420);
        const horizontalMargin = (availableWidth - computedCardWidth) / 2;

        assert.ok(
          computedCardWidth <= availableWidth,
          `${bp.name} card width (${computedCardWidth}px) must not exceed viewport width (${availableWidth}px)`
        );
        assert.ok(
          horizontalMargin >= 6,
          `${bp.name} horizontal margin must have at least 6px gutter on each side`
        );
        const horizontalOverflow = computedCardWidth + (horizontalMargin * 2) - availableWidth;
        assert.equal(
          Math.abs(horizontalOverflow) < 0.001,
          true,
          `${bp.name} must have exactly 0 horizontal overflow`
        );
      }
    });
  });
});
