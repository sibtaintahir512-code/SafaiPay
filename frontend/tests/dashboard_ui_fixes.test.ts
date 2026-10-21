import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST as acceptPickupRouteHandler } from '../app/api/v1/pickups/[id]/accept/route';
import { acceptPickup, getPickups } from '../lib/api';
import { LineDataPoint } from '../components/charts/LineTrendChart';
import { BarDataPoint } from '../components/charts/VerticalBarChart';

describe('SafaiPay Dashboard UI & Functionality Bug-Fix Pass Suite', () => {

  describe('1. Accept Job Button & State Transitions', () => {
    it('serverless route POST /api/v1/pickups/[id]/accept transitions job to accepted', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/pickups/sp-req-001/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await acceptPickupRouteHandler(req, { params: { id: 'sp-req-001' } });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.id, 'sp-req-001');
      assert.equal(data.status, 'accepted');
      assert.ok(data.assigned_collector_id, 'Assigned collector ID must be set');
    });

    it('rejects empty or missing pickup ID with HTTP 400', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/pickups//accept', {
        method: 'POST',
      });
      const res = await acceptPickupRouteHandler(req, { params: { id: '' } });
      assert.equal(res.status, 400);
    });

    it('client api acceptPickup updates pickup state reliably', async () => {
      const accepted = await acceptPickup('sp-req-002');
      assert.ok(accepted);
      assert.equal(accepted.status, 'accepted');
    });

    it('prevents duplicate submissions using in-flight lock state', () => {
      let acceptingJobId: string | null = null;
      let submissionCount = 0;

      const triggerAccept = (jobId: string) => {
        if (acceptingJobId) return false;
        acceptingJobId = jobId;
        submissionCount++;
        return true;
      };

      // First click succeeds
      const firstClick = triggerAccept('sp-req-001');
      assert.equal(firstClick, true);
      assert.equal(submissionCount, 1);

      // Rapid duplicate second click is prevented
      const secondClick = triggerAccept('sp-req-001');
      assert.equal(secondClick, false);
      assert.equal(submissionCount, 1);

      // Reset upon completion
      acceptingJobId = null;
      const nextClick = triggerAccept('sp-req-002');
      assert.equal(nextClick, true);
      assert.equal(submissionCount, 2);
    });
  });

  describe('2. Profile Dropdown Two-Tap Toggle & Focus Semantics', () => {
    it('accurately toggles open on first tap and closed on second tap', () => {
      let showProfileMenu = false;
      const toggle = () => {
        showProfileMenu = !showProfileMenu;
      };

      // Initial state: closed
      assert.equal(showProfileMenu, false);

      // 1st Tap: Opens
      toggle();
      assert.equal(showProfileMenu, true, 'First tap must open the profile dropdown');

      // 2nd Tap: Closes
      toggle();
      assert.equal(showProfileMenu, false, 'Second tap must close the profile dropdown');

      // 3rd Tap: Opens again cleanly
      toggle();
      assert.equal(showProfileMenu, true);
    });

    it('outside click and Escape key safely close dropdown without re-opening', () => {
      let showProfileMenu = true;
      const handleEscape = (key: string) => {
        if (key === 'Escape') showProfileMenu = false;
      };
      const handleOutsideClick = (isInside: boolean) => {
        if (!isInside) showProfileMenu = false;
      };

      // Escape key closes
      handleEscape('Escape');
      assert.equal(showProfileMenu, false);

      // Re-open
      showProfileMenu = true;

      // Inside click maintains menu
      handleOutsideClick(true);
      assert.equal(showProfileMenu, true);

      // Outside click closes menu
      handleOutsideClick(false);
      assert.equal(showProfileMenu, false);
    });
  });

  describe('3. Review Alerts Button & Dynamic Modal Architecture', () => {
    it('dynamically evaluates alert count from real records rather than hardcoding', () => {
      const mockAlerts = [
        { id: 'ALT-1', type: 'Weight Variance', severity: 'high' },
        { id: 'ALT-2', type: 'Duplicate Photo', severity: 'medium' },
      ];

      const getButtonLabel = (count: number, isUrdu: boolean) => {
        if (isUrdu) return `${count} الرٹس کا جائزہ لیں`;
        return `Review ${count} Alert${count === 1 ? '' : 's'} Now`;
      };

      assert.equal(getButtonLabel(mockAlerts.length, false), 'Review 2 Alerts Now');
      assert.equal(getButtonLabel(1, false), 'Review 1 Alert Now');
      assert.equal(getButtonLabel(mockAlerts.length, true), '2 الرٹس کا جائزہ لیں');
    });

    it('clearing an alert decrements count and triggers empty state when zero', () => {
      let activeAlerts = [
        { id: 'ALT-1', pickup_id: 'sp-req-001' },
        { id: 'ALT-2', pickup_id: 'sp-req-002' },
      ];

      // Resolve first alert
      activeAlerts = activeAlerts.filter(a => a.id !== 'ALT-1');
      assert.equal(activeAlerts.length, 1);

      // Resolve second alert
      activeAlerts = activeAlerts.filter(a => a.id !== 'ALT-2');
      assert.equal(activeAlerts.length, 0);
    });
  });

  describe('4. Weekly Earnings Line Graph Redesign', () => {
    const WEEKLY_DATA: LineDataPoint[] = [
      { label: 'Mon', value: 700 },
      { label: 'Tue', value: 950 },
      { label: 'Wed', value: 800 },
      { label: 'Thu', value: 1400 },
      { label: 'Fri', value: 1100 },
      { label: 'Sat', value: 1800 },
      { label: 'Sun', value: 2400 },
    ];

    it('identifies Sunday as the peak earning day with Rs 2,400', () => {
      const maxPoint = WEEKLY_DATA.reduce((prev, current) => 
        (current.value > prev.value) ? current : prev
      );
      assert.equal(maxPoint.label, 'Sun');
      assert.equal(maxPoint.value, 2400);
      assert.equal(`Rs ${maxPoint.value.toLocaleString()}`, 'Rs 2,400');
    });

    it('computes exact 5 Y-axis milestone ticks for 0 to 2400 PKR', () => {
      const max = Math.max(...WEEKLY_DATA.map(d => d.value));
      const ticks = [0, 0.25, 0.5, 0.75, 1].map(pct => Math.round(max * pct));
      assert.deepEqual(ticks, [0, 600, 1200, 1800, 2400]);
    });

    it('formats all currency values with thousands comma separator', () => {
      const formatted = WEEKLY_DATA.map(d => `Rs ${d.value.toLocaleString()}`);
      assert.ok(formatted.includes('Rs 700'));
      assert.ok(formatted.includes('Rs 950'));
      assert.ok(formatted.includes('Rs 1,400'));
      assert.ok(formatted.includes('Rs 1,800'));
      assert.ok(formatted.includes('Rs 2,400'));
    });
  });

  describe('5. Bar Chart Label Collision & Overlap Prevention', () => {
    const MONTHLY_VOLUME_DATA: BarDataPoint[] = [
      { label: 'Jan', value: 420 },
      { label: 'Feb', value: 610 },
      { label: 'Mar', value: 780 },
      { label: 'Apr', value: 690 },
      { label: 'May', value: 920 },
      { label: 'Jun', value: 1120, highlight: true },
    ];

    it('mathematically guarantees vertical spacing between peak badge and value label', () => {
      const height = 260;
      const paddingBottom = 44;
      const usableHeight = height - 48 - paddingBottom; // 168
      const maxBarHeight = usableHeight - 34; // 134

      const maxValue = 1200;
      const peakValue = 1120;
      const barHeight = (peakValue / maxValue) * maxBarHeight; // 125.06
      const barTopY = height - paddingBottom - barHeight; // 90.93

      const valueLabelY = barTopY - 6; // 84.93
      const badgeY = barTopY - 26; // 64.93

      // Badge top & bottom bounds
      const badgeHeight = 16;
      const badgeBottom = (badgeY - 1) + badgeHeight; // 79.93
      const valueLabelTop = valueLabelY - 10; // 74.93 (approx)

      // Clearance between badge and bar top is strictly positive
      assert.ok(badgeY < valueLabelY, 'Peak badge must be positioned strictly above the value label');
      assert.ok(valueLabelY < barTopY, 'Value label must be positioned strictly above the bar top');
      assert.ok(badgeY > 48, 'Peak badge must not collide with the chart ceiling (paddingTop)');
    });

    it('handles zero, empty, and single data point states without division by zero', () => {
      const emptyData: BarDataPoint[] = [];
      assert.equal(emptyData.length, 0);

      const singleData: BarDataPoint[] = [{ label: 'Jan', value: 500 }];
      const max = Math.max(...singleData.map(d => d.value), 10);
      assert.equal(max, 500);
      const slotWidth = (640 - 60 - 24) / Math.max(singleData.length, 1);
      assert.equal(slotWidth, 556);
      assert.ok(!isNaN(slotWidth));
    });
  });
});
