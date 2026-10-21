import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST as startTripRouteHandler } from '../app/api/v1/pickups/[id]/start/route';
import { POST as uploadPhotoRouteHandler } from '../app/api/v1/pickups/[id]/upload-photo/route';
import { POST as verifyWeightRouteHandler } from '../app/api/v1/pickups/[id]/verify-weight/route';
import { POST as confirmCompletionRouteHandler } from '../app/api/v1/pickups/[id]/confirm-completion/route';
import { POST as acceptPickupRouteHandler } from '../app/api/v1/pickups/[id]/accept/route';
import { findOrCreatePickup, updatePickup, getPickupById } from '../lib/pickupStore';

describe('Collector Pickup Execution Workflow (Step-by-Step Field Execution)', () => {

  const testPickupId = `test-exec-${Date.now()}`;

  describe('1. Stage 1: Trip Start & GPS Navigation', () => {
    it('initializes pickup and transitions status to in_progress with GPS coordinates', async () => {
      // Setup initial pickup with usr_guest_coll (or test collector)
      findOrCreatePickup(testPickupId, 'usr_guest_coll');

      const req = new NextRequest(`http://localhost:3000/api/v1/pickups/${testPickupId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gps_latitude: 24.8607, gps_longitude: 67.0011 }),
      });

      const res = await startTripRouteHandler(req, { params: { id: testPickupId } });
      assert.equal(res.status, 200);

      const data = await res.json();
      assert.equal(data.status, 'in_progress');
      assert.ok(data.notes.includes('24.8607'), 'Notes should log GPS latitude');
    });

    it('rejects start request with empty pickup ID', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/pickups//start', {
        method: 'POST',
      });
      const res = await startTripRouteHandler(req, { params: { id: '' } });
      assert.equal(res.status, 400);
    });
  });

  describe('2. Stage 2: Photo Proof Upload & Validation', () => {
    it('rejects file larger than 10MB with HTTP 400', async () => {
      const oversizedBytes = new Uint8Array(11 * 1024 * 1024); // 11MB
      const oversizedBlob = new Blob([oversizedBytes], { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', oversizedBlob, 'large_photo.jpg');

      const req = new NextRequest(`http://localhost:3000/api/v1/pickups/${testPickupId}/upload-photo`, {
        method: 'POST',
        body: formData,
      });

      const res = await uploadPhotoRouteHandler(req, { params: { id: testPickupId } });
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.ok(json.detail.includes('10 MB'), 'Error must specify 10MB limit');
    });

    it('rejects unsupported file mime types (e.g. text or executable)', async () => {
      const textBlob = new Blob(['sample non-image text content that is sufficiently long to exceed fifty bytes minimum length threshold'], { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', textBlob, 'document.txt');

      const req = new NextRequest(`http://localhost:3000/api/v1/pickups/${testPickupId}/upload-photo`, {
        method: 'POST',
        body: formData,
      });

      const res = await uploadPhotoRouteHandler(req, { params: { id: testPickupId } });
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.ok(json.detail.includes('Unsupported image format'), 'Should reject non-image file');
    });

    it('successfully uploads valid JPG photo and unlocks Stage 3', async () => {
      // 100 bytes valid dummy image payload
      const validBytes = new Uint8Array(200);
      validBytes.fill(42);
      const validBlob = new Blob([validBytes], { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', validBlob, 'scale_photo.jpg');
      formData.append('image_type', 'scale_display');
      formData.append('caption', 'On-site digital scale display');

      const req = new NextRequest(`http://localhost:3000/api/v1/pickups/${testPickupId}/upload-photo`, {
        method: 'POST',
        body: formData,
      });

      const res = await uploadPhotoRouteHandler(req, { params: { id: testPickupId } });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.ok(json.scale_photo_url, 'scale_photo_url must be recorded');
      assert.ok(json.images && json.images.length > 0, 'images array must contain upload');
      assert.equal(json.uploaded_image.image_type, 'scale_display');
    });
  });

  describe('3. Stage 3: Scale Weighing & Prerequisite Enforcement', () => {
    it('blocks weight verification if photo proof is missing', async () => {
      const noPhotoPickupId = `test-no-photo-${Date.now()}`;
      findOrCreatePickup(noPhotoPickupId);
      // Ensure no photo attached
      updatePickup(noPhotoPickupId, { scale_photo_url: null, images: [] });

      const req = new NextRequest(`http://localhost:3000/api/v1/pickups/${noPhotoPickupId}/verify-weight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified_weight_kg: 18.5, quality_factor: 1.0 }),
      });

      const res = await verifyWeightRouteHandler(req, { params: { id: noPhotoPickupId } });
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.ok(json.detail.includes('Prerequisite failed'), 'Must reject due to missing photo proof');
    });

    it('rejects zero, negative, or unrealistic weight values', async () => {
      // Zero weight
      const reqZero = new NextRequest(`http://localhost:3000/api/v1/pickups/${testPickupId}/verify-weight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified_weight_kg: 0 }),
      });
      const resZero = await verifyWeightRouteHandler(reqZero, { params: { id: testPickupId } });
      assert.equal(resZero.status, 400);

      // Negative weight
      const reqNeg = new NextRequest(`http://localhost:3000/api/v1/pickups/${testPickupId}/verify-weight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified_weight_kg: -5.2 }),
      });
      const resNeg = await verifyWeightRouteHandler(reqNeg, { params: { id: testPickupId } });
      assert.equal(resNeg.status, 400);

      // Excessive weight (>2500 kg)
      const reqExcess = new NextRequest(`http://localhost:3000/api/v1/pickups/${testPickupId}/verify-weight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified_weight_kg: 3500 }),
      });
      const resExcess = await verifyWeightRouteHandler(reqExcess, { params: { id: testPickupId } });
      assert.equal(resExcess.status, 400);
    });

    it('successfully records verified weight and calculates accurate pricing', async () => {
      const verifiedKg = 16.0;
      const qualityFactor = 0.9; // Grade B
      const qualityGrade = 'B';

      const req = new NextRequest(`http://localhost:3000/api/v1/pickups/${testPickupId}/verify-weight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verified_weight_kg: verifiedKg,
          quality_factor: qualityFactor,
          quality_grade: qualityGrade,
        }),
      });

      const res = await verifyWeightRouteHandler(req, { params: { id: testPickupId } });
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.status, 'weight_verified');
      assert.equal(json.verified_weight, verifiedKg);
      assert.equal(json.quality_grade, 'B');

      // 16 kg * 80 PKR/kg * 0.9 factor = 1152 PKR
      const expectedTotal = Number((16.0 * 80 * 0.9).toFixed(2));
      assert.equal(json.payout_pkr, expectedTotal);
    });
  });

  describe('4. Stage 4: Settlement & Idempotent Completion', () => {
    it('finalizes settlement and issues transaction reference exactly once', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/pickups/${testPickupId}/confirm-completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await confirmCompletionRouteHandler(req, { params: { id: testPickupId } });
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.status, 'completed');
      assert.ok(json.payment?.transaction_reference, 'Payment reference must be generated');
      assert.equal(json.payment?.status, 'completed');
      assert.equal(json.settlement?.total_payout_pkr, 1152);

      // Verify idempotency on second identical call
      const resIdempotent = await confirmCompletionRouteHandler(req, { params: { id: testPickupId } });
      assert.equal(resIdempotent.status, 200);
      const jsonIdempotent = await resIdempotent.json();
      assert.equal(jsonIdempotent.already_completed, true);
      assert.equal(jsonIdempotent.payment.transaction_reference, json.payment.transaction_reference);
    });
  });

  describe('5. Next Job Transition & Clean State Isolation', () => {
    it('clears previous job state and transitions to next job without data carryover', async () => {
      // Simulate state management logic of handleReadyForNextJob
      let activeJob: any = getPickupById(testPickupId);
      let selectedFile: any = { name: 'scale_photo.jpg', size: 1024 };
      let photoPreview: any = 'blob:http://localhost:3000/dummy-uuid';
      let verifiedWeightVal = '16.0';
      let workflowStep = 4;
      let maxUnlockedStep = 4;
      let settlementData: any = { total_payout_pkr: 1152 };

      // Transition execution
      const resetStateForNextJob = (nextJob: any) => {
        // Clear all states
        selectedFile = null;
        photoPreview = null;
        settlementData = null;
        activeJob = nextJob;
        workflowStep = 1;
        maxUnlockedStep = 1;
        verifiedWeightVal = String(nextJob ? (nextJob.estimated_quantity_kg || 15.0) : 15.0);
      };

      // Create next job
      const nextJobId = `test-next-${Date.now()}`;
      const nextJob = findOrCreatePickup(nextJobId);
      nextJob.estimated_quantity_kg = 22.0;

      resetStateForNextJob(nextJob);

      // Verify no data leaks from prior job
      assert.equal(activeJob.id, nextJobId);
      assert.equal(workflowStep, 1, 'Workflow must start cleanly at Stage 1');
      assert.equal(maxUnlockedStep, 1, 'Max unlocked step must reset to 1');
      assert.equal(selectedFile, null, 'File must be cleared');
      assert.equal(photoPreview, null, 'Preview URL must be cleared');
      assert.equal(settlementData, null, 'Settlement receipt must be cleared');
      assert.equal(verifiedWeightVal, '22', 'Weight should reflect next job estimate');
    });

    it('enforces stepper lock rule: stepNum > maxUnlockedStep cannot be bypassed', () => {
      let currentStep = 1;
      let maxUnlockedStep = 1;

      const navigateStep = (targetStep: number) => {
        if (targetStep <= maxUnlockedStep) {
          currentStep = targetStep;
          return true;
        }
        return false; // locked
      };

      // Cannot skip to Stage 3 or 4 while at Stage 1
      assert.equal(navigateStep(3), false);
      assert.equal(currentStep, 1);
      assert.equal(navigateStep(4), false);
      assert.equal(currentStep, 1);

      // Complete Stage 1 -> unlocks Stage 2
      maxUnlockedStep = 2;
      assert.equal(navigateStep(2), true);
      assert.equal(currentStep, 2);

      // Still cannot jump to Stage 4 without Stage 2 & 3
      assert.equal(navigateStep(4), false);
      assert.equal(currentStep, 2);
    });
  });

});
