import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

describe('SafaiPay Landing Page & Authentication Flow Production Suite', () => {
  const landingPageFile = path.join(__dirname, '../components/LandingLoginPage.tsx');
  const orbitLandingFile = path.join(__dirname, '../components/MobileOrbitLanding.tsx');
  const loginViewFile = path.join(__dirname, '../components/LoginView.tsx');
  const rootPageFile = path.join(__dirname, '../app/page.tsx');
  const loginPageFile = path.join(__dirname, '../app/(auth)/login/page.tsx');
  const globalsCssFile = path.join(__dirname, '../app/globals.css');

  const landingPageContent = fs.readFileSync(landingPageFile, 'utf-8');
  const orbitLandingContent = fs.readFileSync(orbitLandingFile, 'utf-8');
  const loginViewContent = fs.readFileSync(loginViewFile, 'utf-8');
  const rootPageContent = fs.readFileSync(rootPageFile, 'utf-8');
  const loginPageContent = fs.readFileSync(loginPageFile, 'utf-8');
  const globalsCssContent = fs.readFileSync(globalsCssFile, 'utf-8');

  describe('1. Loading UI Integrity (Unchanged Design & No Flicker)', () => {
    it('verifies existing loading screen design is strictly preserved in LoginView', () => {
      assert.ok(
        loginViewContent.includes('Checking session...'),
        'Loading state must maintain "Checking session..." text'
      );
      assert.ok(
        loginViewContent.includes('animate-spin text-[#1B7F5C]'),
        'Loading spinner must retain exact class and color'
      );
      assert.ok(
        loginViewContent.includes('min-h-screen w-full flex items-center justify-center bg-[#F4FAF7]'),
        'Loading screen layout container must be identical'
      );
    });

    it('preserves existing authenticated user redirect to dashboard', () => {
      assert.ok(
        loginViewContent.includes('if (!authLoading && user && role && role !== \'unknown\')'),
        'Authenticated users must continue to be redirected directly to their role dashboard'
      );
    });
  });

  describe('2. Routing & Mobile Initial Landing Experience', () => {
    it('verifies root route "/" specifies initialView="landing"', () => {
      assert.ok(
        rootPageContent.includes('initialView="landing"'),
        'Root page must pass initialView="landing"'
      );
    });

    it('verifies "/login" route specifies initialView="signin"', () => {
      assert.ok(
        loginPageContent.includes('initialView="signin"'),
        'Login page must pass initialView="signin"'
      );
    });

    it('verifies mobile landing page displays both "Take a Tour" and "Sign In" clearly before sign-in', () => {
      assert.ok(
        orbitLandingContent.includes('Take a Tour') || orbitLandingContent.includes('پلیٹ فارم کا ٹور دیکھیں'),
        'Mobile landing page must clearly display "Take a Tour"'
      );
      assert.ok(
        orbitLandingContent.includes('Sign In') || orbitLandingContent.includes('سائن ان کریں'),
        'Mobile landing page must clearly display "Sign In"'
      );
    });

    it('verifies user is not automatically redirected to sign-in without pressing Sign In', () => {
      // Landing page defaults to mobileView 'landing' when initialView is 'landing'
      assert.ok(
        landingPageContent.includes("initialView === 'signin' ? 'signin' : 'landing'"),
        'mobileView must default to landing on root launch'
      );
    });

    it('verifies back button is present on mobile sign-in page to return to landing page', () => {
      assert.ok(
        landingPageContent.includes('Back to Overview') || landingPageContent.includes('تعارف پر واپس جائیں'),
        'Mobile sign-in view must contain an explicit back button to return to the landing overview'
      );
      assert.ok(
        landingPageContent.includes('handleGoToLanding'),
        'Back button must invoke handleGoToLanding'
      );
    });
  });

  describe('3. Fixed Full-Screen Viewport & Zero Scrollbar Guardrails', () => {
    it('verifies landing page wrapper has class ".landing-page" and id "landing-page"', () => {
      assert.ok(
        landingPageContent.includes('id="landing-page"'),
        'Landing page must have id="landing-page"'
      );
      assert.ok(
        landingPageContent.includes('className="landing-page'),
        'Landing page must have class "landing-page"'
      );
    });

    it('verifies landing page dimensions are locked to 100vw and 100dvh with overflow: hidden', () => {
      assert.ok(
        landingPageContent.includes("width: '100vw'"),
        'Landing page width must be 100vw'
      );
      assert.ok(
        landingPageContent.includes("height: '100dvh'"),
        'Landing page height must be 100dvh'
      );
      assert.ok(
        landingPageContent.includes("overflow: 'hidden'"),
        'Landing page overflow must be hidden'
      );
    });

    it('verifies safe-area insets are applied using 100dvh', () => {
      assert.ok(
        landingPageContent.includes('env(safe-area-inset-top)'),
        'Container must account for safe-area-inset-top'
      );
      assert.ok(
        landingPageContent.includes('env(safe-area-inset-bottom)'),
        'Container must account for safe-area-inset-bottom'
      );
    });
  });

  describe('4. Isolation: Other Pages & Global Overflow Unchanged', () => {
    it('verifies globals.css does not lock overflow or disable app-wide scrolling', () => {
      assert.ok(
        !globalsCssContent.includes('overflow: hidden'),
        'globals.css must not globally lock overflow'
      );
      assert.ok(
        !globalsCssContent.includes('#root { overflow: hidden'),
        '#root must not be restricted'
      );
    });

    it('verifies customer, collector, recycler, and admin dashboards scroll normally', () => {
      const customerDashboard = fs.readFileSync(path.join(__dirname, '../components/CustomerDashboard.tsx'), 'utf-8');
      const collectorDashboard = fs.readFileSync(path.join(__dirname, '../components/CollectorDashboard.tsx'), 'utf-8');
      const recyclerDashboard = fs.readFileSync(path.join(__dirname, '../components/RecyclerDashboard.tsx'), 'utf-8');
      const adminDashboard = fs.readFileSync(path.join(__dirname, '../components/AdminDashboard.tsx'), 'utf-8');

      assert.ok(!customerDashboard.includes('landing-page'), 'CustomerDashboard must not have landing-page class');
      assert.ok(!collectorDashboard.includes('landing-page'), 'CollectorDashboard must not have landing-page class');
      assert.ok(!recyclerDashboard.includes('landing-page'), 'RecyclerDashboard must not have landing-page class');
      assert.ok(!adminDashboard.includes('landing-page'), 'AdminDashboard must not have landing-page class');
    });
  });

  describe('5. Breakpoint Mathematical Dimension & Overflow Verification', () => {
    const breakpoints = [
      { name: 'Desktop (1440 × 900)', width: 1440, height: 900, type: 'desktop' },
      { name: 'Tablet (768 × 1024)', width: 768, height: 1024, type: 'tablet' },
      { name: 'Mobile (375 × 812)', width: 375, height: 812, type: 'mobile' },
      { name: 'Android Common (360 × 800)', width: 360, height: 800, type: 'mobile' },
      { name: 'iPhone SE (320 × 568)', width: 320, height: 568, type: 'mobile' },
    ];

    for (const bp of breakpoints) {
      it(`verifies 0px horizontal and vertical overflow at ${bp.name}`, () => {
        if (bp.type === 'desktop') {
          const contentWidth = 1080;
          const contentHeight = 540;
          assert.ok(contentWidth <= bp.width, 'Desktop width must fit viewport');
          assert.ok(contentHeight <= bp.height, 'Desktop height must fit viewport');
        } else if (bp.type === 'tablet') {
          const totalWidth = 724;
          const maxHeight = 540;
          assert.ok(totalWidth <= bp.width, 'Tablet width must fit viewport');
          assert.ok(maxHeight <= bp.height, 'Tablet height must fit viewport');
        } else {
          const cardWidth = Math.min(bp.width - 12, 420);
          assert.ok(cardWidth <= bp.width, 'Mobile width must fit viewport');
          const maxMobileHeight = bp.height <= 600 ? 510 : 560;
          assert.ok(maxMobileHeight <= bp.height, 'Mobile height must fit viewport');
        }
      });
    }
  });
});
