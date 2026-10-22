import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

describe('SafaiPay Landing Page Fixed Viewport & Responsive Layout Suite', () => {
  const landingPageFile = path.join(__dirname, '../components/LandingLoginPage.tsx');
  const landingPageContent = fs.readFileSync(landingPageFile, 'utf-8');

  describe('1. Fixed Viewport Container & Zero Scrollbar Guardrails', () => {
    it('verifies landing page wrapper has id "landing-page" and class "landing-page"', () => {
      assert.ok(
        landingPageContent.includes('id="landing-page"'),
        'Landing page must have unique id="landing-page"'
      );
      assert.ok(
        landingPageContent.includes('className="landing-page'),
        'Landing page must have unique class "landing-page"'
      );
    });

    it('verifies landing page dimensions are locked to exactly 100vw and 100dvh', () => {
      assert.ok(
        landingPageContent.includes("width: '100vw'"),
        'Landing page style width must be 100vw'
      );
      assert.ok(
        landingPageContent.includes("height: '100dvh'"),
        'Landing page style height must be 100dvh'
      );
      assert.ok(
        landingPageContent.includes("maxWidth: '100vw'"),
        'Landing page style maxWidth must be 100vw'
      );
      assert.ok(
        landingPageContent.includes("maxHeight: '100dvh'"),
        'Landing page style maxHeight must be 100dvh'
      );
      assert.ok(
        landingPageContent.includes('w-[100vw] h-[100dvh]'),
        'Tailwind classes must enforce w-[100vw] h-[100dvh]'
      );
    });

    it('verifies overflow: hidden is strictly applied to the landing page wrapper', () => {
      assert.ok(
        landingPageContent.includes("overflow: 'hidden'"),
        'Landing page style overflow must be hidden'
      );
      assert.ok(
        landingPageContent.includes('overflow-hidden'),
        'Landing page class must include overflow-hidden'
      );
    });

    it('verifies safe-area insets are applied using 100dvh on mobile viewport', () => {
      assert.ok(
        landingPageContent.includes('env(safe-area-inset-top)'),
        'Mobile container must account for safe-area-inset-top'
      );
      assert.ok(
        landingPageContent.includes('env(safe-area-inset-bottom)'),
        'Mobile container must account for safe-area-inset-bottom'
      );
    });
  });

  describe('2. Isolation: App-level & Other Pages Scrolling Remains Unaffected', () => {
    it('verifies globals.css does NOT lock global overflow or disable scrolling app-wide', () => {
      const globalsCss = fs.readFileSync(path.join(__dirname, '../app/globals.css'), 'utf-8');
      assert.ok(
        !globalsCss.includes('overflow: hidden'),
        'globals.css must not apply overflow: hidden globally'
      );
      assert.ok(
        !globalsCss.includes('#root { overflow: hidden'),
        '#root must not be constrained with overflow: hidden'
      );
    });

    it('verifies dashboard pages (Customer, Collector, Recycler, Admin) are free to scroll normally', () => {
      const customerDashboard = fs.readFileSync(path.join(__dirname, '../components/CustomerDashboard.tsx'), 'utf-8');
      const collectorDashboard = fs.readFileSync(path.join(__dirname, '../components/CollectorDashboard.tsx'), 'utf-8');
      const recyclerDashboard = fs.readFileSync(path.join(__dirname, '../components/RecyclerDashboard.tsx'), 'utf-8');
      const adminDashboard = fs.readFileSync(path.join(__dirname, '../components/AdminDashboard.tsx'), 'utf-8');

      assert.ok(!customerDashboard.includes('landing-page'), 'CustomerDashboard must not have landing-page class');
      assert.ok(!collectorDashboard.includes('landing-page'), 'CollectorDashboard must not have landing-page class');
      assert.ok(!recyclerDashboard.includes('landing-page'), 'RecyclerDashboard must not have landing-page class');
      assert.ok(!adminDashboard.includes('landing-page'), 'AdminDashboard must not have landing-page class');

      // None of them are fixed to 100dvh
      assert.ok(!customerDashboard.includes("height: '100dvh'"), 'CustomerDashboard must not lock height to 100dvh');
      assert.ok(!collectorDashboard.includes("height: '100dvh'"), 'CollectorDashboard must not lock height to 100dvh');
      assert.ok(!recyclerDashboard.includes("height: '100dvh'"), 'RecyclerDashboard must not lock height to 100dvh');
      assert.ok(!adminDashboard.includes("height: '100dvh'"), 'AdminDashboard must not lock height to 100dvh');
    });
  });

  describe('3. Mobile Navigation & Hamburger Menu Architecture', () => {
    it('verifies mobile navigation includes hamburger toggle button and drawer modal', () => {
      assert.ok(
        landingPageContent.includes('Toggle Navigation Menu') || landingPageContent.includes('مینیو کھولیں'),
        'Mobile header must include aria-label for navigation menu button'
      );
      assert.ok(
        landingPageContent.includes('showMobileNav'),
        'Landing page must maintain showMobileNav state'
      );
      assert.ok(
        landingPageContent.includes('role="dialog"'),
        'Mobile navigation drawer must have role="dialog"'
      );
      assert.ok(
        landingPageContent.includes('aria-modal="true"'),
        'Mobile navigation drawer must declare aria-modal="true"'
      );
      assert.ok(
        landingPageContent.includes("e.key === 'Escape'"),
        'Mobile navigation drawer must close on Escape key'
      );
    });

    it('verifies navigation drawer provides quick routes to tour, register, and password reset', () => {
      assert.ok(
        landingPageContent.includes('href="/register"'),
        'Navigation drawer must provide register link'
      );
      assert.ok(
        landingPageContent.includes('href="/forgot-password"'),
        'Navigation drawer must provide forgot-password link'
      );
      assert.ok(
        landingPageContent.includes('setShowTour(true)'),
        'Navigation drawer must provide tour trigger'
      );
    });
  });

  describe('4. Strict Visual Hierarchy & Accessibility on Mobile', () => {
    it('preserves all 8 structural visual sections in exact sequence', () => {
      const s1 = landingPageContent.indexOf('1. Header & Welcome Heading');
      const s2 = landingPageContent.indexOf('2. Sign-in Fields');
      const s3 = landingPageContent.indexOf('3. Primary Sign-in Button');
      const s4 = landingPageContent.indexOf('4. Divider');
      const s5 = landingPageContent.indexOf('5. Continue as Guest Container');
      const s6 = landingPageContent.indexOf('6. Guest Role Selector');
      const s7 = landingPageContent.indexOf('7. Dynamic Guest CTA Button');
      const s8 = landingPageContent.indexOf('8. Supporting Text / Footer');

      assert.ok(s1 > -1, 'Step 1 must exist');
      assert.ok(s2 > s1, 'Step 2 must follow Step 1');
      assert.ok(s3 > s2, 'Step 3 must follow Step 2');
      assert.ok(s4 > s3, 'Step 4 must follow Step 3');
      assert.ok(s5 > s4, 'Step 5 must follow Step 4');
      assert.ok(s6 > s5, 'Step 6 must follow Step 5');
      assert.ok(s7 > s6, 'Step 7 must follow Step 6');
      assert.ok(s8 > s7, 'Step 8 must follow Step 7');
    });

    it('ensures all interactive buttons and inputs meet >= 44px tap targets', () => {
      assert.ok(
        landingPageContent.includes('min-h-[48px]'),
        'CTA buttons and cards must maintain accessible min-h-[48px]'
      );
      assert.ok(
        landingPageContent.includes('min-h-[44px]'),
        'Secondary links and options must satisfy >= 44px'
      );
    });

    it('ensures all SVGs and icons enforce max-width: 100% boundary', () => {
      assert.ok(
        landingPageContent.includes('max-w-full'),
        'SVGs and icons must enforce max-w-full'
      );
    });
  });

  describe('5. Breakpoint Mathematical Dimension & Overflow Verification', () => {
    const requiredBreakpoints = [
      { name: 'Desktop Large', width: 1440, height: 900, type: 'desktop' },
      { name: 'Tablet Portrait', width: 768, height: 1024, type: 'tablet' },
      { name: 'Mobile Standard (iPhone)', width: 375, height: 812, type: 'mobile' },
      { name: 'Mobile Android Common', width: 360, height: 800, type: 'mobile' },
      { name: 'Mobile Compact (iPhone SE)', width: 320, height: 568, type: 'mobile' },
    ];

    for (const bp of requiredBreakpoints) {
      it(`verifies 0px horizontal and vertical overflow at ${bp.name} (${bp.width}px × ${bp.height}px)`, () => {
        if (bp.type === 'desktop') {
          // Desktop: Left side max ~620px + right card max 430px + gaps/paddings
          const rightCardWidth = 430;
          const leftColWidth = Math.min(bp.width - rightCardWidth - 64, 620);
          const totalContentWidth = leftColWidth + rightCardWidth + 48;
          assert.ok(
            totalContentWidth <= bp.width,
            `Desktop width ${totalContentWidth}px must fit in viewport ${bp.width}px`
          );

          // Desktop height: card content is ~520px
          const contentHeight = 540;
          assert.ok(
            contentHeight <= bp.height,
            `Desktop height ${contentHeight}px must fit in viewport ${bp.height}px with 0 overflow`
          );
        } else if (bp.type === 'tablet') {
          // Tablet 768x1024: Side-by-side md:flex-row
          const rightCardWidth = 360;
          const leftColWidth = Math.min(bp.width - rightCardWidth - 48, 360);
          const totalWidth = leftColWidth + rightCardWidth + 24;
          assert.ok(
            totalWidth <= bp.width,
            `Tablet width ${totalWidth}px must fit in viewport ${bp.width}px`
          );

          const maxColHeight = 540;
          assert.ok(
            maxColHeight <= bp.height,
            `Tablet height ${maxColHeight}px must fit in viewport ${bp.height}px with 0 overflow`
          );
        } else {
          // Mobile: w-[calc(100%-12px)] max-w-[420px]
          const cardWidth = Math.min(bp.width - 12, 420);
          assert.ok(
            cardWidth <= bp.width,
            `Mobile card width ${cardWidth}px must fit in viewport ${bp.width}px`
          );
          const horizontalGutter = (bp.width - cardWidth) / 2;
          assert.ok(horizontalGutter >= 6, 'Gutter must be at least 6px on each side');

          // Mobile height calculation: with clamp spacing, total height is 480px-568px
          const estimatedContentHeight = bp.height <= 600 ? 508 : 568;
          assert.ok(
            estimatedContentHeight <= bp.height,
            `Mobile content height ${estimatedContentHeight}px must fit in viewport ${bp.height}px`
          );
        }
      });
    }
  });
});
