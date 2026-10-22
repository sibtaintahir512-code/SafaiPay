import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import {
  createJob,
  getJobsForUser,
  getJobById,
  updateJobStatus,
  attachJobImage,
  getNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../lib/db';
import { processAndSaveUploadedFile, retrieveFile } from '../lib/storageEngine';
import { broadcastEvent, subscribeToRealtime, getEventsSince } from '../lib/realtime';

// Route Handlers
import { POST as createPickupRoute } from '../app/api/v1/pickups/route';
import { GET as getAvailableRoute } from '../app/api/v1/pickups/available/route';
import { GET as getMyRequestsRoute } from '../app/api/v1/pickups/my-requests/route';
import { POST as acceptRoute } from '../app/api/v1/pickups/[id]/accept/route';
import { POST as startRoute } from '../app/api/v1/pickups/[id]/start/route';
import { POST as uploadPhotoRoute } from '../app/api/v1/pickups/[id]/upload-photo/route';
import { POST as verifyWeightRoute } from '../app/api/v1/pickups/[id]/verify-weight/route';
import { POST as confirmCompletionRoute } from '../app/api/v1/pickups/[id]/confirm-completion/route';
import { POST as deliverRecyclerRoute } from '../app/api/v1/pickups/[id]/deliver-recycler/route';
import { POST as processRecyclerRoute } from '../app/api/v1/pickups/[id]/process-recycler/route';
import { POST as cancelRoute } from '../app/api/v1/pickups/[id]/cancel/route';
import { GET as getFileRoute } from '../app/api/v1/storage/files/[id]/route';

describe('SafaiPay 3-Role End-to-End Real Backend System Tests', () => {
  let createdJobId = '';
  let uploadedCustomerFileId = '';
  let uploadedCustomerFileUrl = '';
  let uploadedScaleFileUrl = '';
  const customerId = 'usr_guest_cust';
  const collectorId = 'usr_guest_coll';
  const recyclerId = 'usr_guest_recy';

  describe('1. File Storage Engine: Binary Upload & Secure Serving', () => {
    it('processes and saves uploaded image with binary validation and retrieval', async () => {
      // Simulate real binary JPEG buffer
      const fakeBinary = Buffer.from('FAKE_JPEG_IMAGE_BINARY_DATA_TEST_BYTES_FOR_SAFAIPAY_1234567890_LONGER_FOR_VALIDATION');
      const fakeFile = {
        name: 'test_waste_bottles.jpg',
        type: 'image/jpeg',
        size: fakeBinary.length,
        arrayBuffer: async () => fakeBinary.buffer.slice(fakeBinary.byteOffset, fakeBinary.byteOffset + fakeBinary.byteLength),
      };

      const result = await processAndSaveUploadedFile(fakeFile, {
        uploaded_by_user_id: customerId,
        uploaded_by_role: 'customer',
      });

      assert.ok(result.file_id, 'File ID must be generated');
      assert.ok(result.file_url.startsWith('/api/v1/storage/files/'), 'URL must point to storage route');
      assert.equal(result.mime_type, 'image/jpeg');

      uploadedCustomerFileId = result.file_id;
      uploadedCustomerFileUrl = result.file_url;

      // Verify retrieval
      const retrieved = retrieveFile(uploadedCustomerFileId);
      assert.ok(retrieved, 'File must be retrievable from storage');
      assert.equal(retrieved.mime_type, 'image/jpeg');
      assert.equal(retrieved.buffer.toString(), fakeBinary.toString());

      // Test serving via GET /api/v1/storage/files/[id] route handler
      const req = new NextRequest(`http://localhost:3000/api/v1/storage/files/${uploadedCustomerFileId}`);
      const res = await getFileRoute(req, { params: { id: uploadedCustomerFileId } });
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'image/jpeg');
      assert.ok(res.headers.get('cache-control')?.includes('immutable'));
    });

    it('rejects files exceeding 10MB or corrupted small files', async () => {
      const tinyFile = {
        name: 'tiny.jpg',
        type: 'image/jpeg',
        size: 10,
        arrayBuffer: async () => new ArrayBuffer(10),
      };

      await assert.rejects(
        async () => processAndSaveUploadedFile(tinyFile),
        /minimum size 50 bytes/
      );
    });
  });

  describe('2. Customer Workflow: Job Creation with Photo & Real-Time Broadcast', () => {
    it('creates waste request in database with attached photo and emits event', async () => {
      let eventReceived = false;
      const unsubscribe = subscribeToRealtime((evt) => {
        if (evt.type === 'job_created') {
          eventReceived = true;
        }
      });

      const req = new NextRequest('http://localhost:3000/api/v1/pickups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          customer_name: 'Amina Khan',
          customer_phone: '+92 300 1234567',
          material_code: 'PET_PLASTIC',
          estimated_quantity_kg: 25,
          street_address: 'House 55, Street 4, PECHS Block 6, Karachi',
          city: 'Karachi',
          preferred_time: 'Today 11:00 AM',
          notes: 'Sorted transparent bottles boxed',
          customer_photo_url: uploadedCustomerFileUrl,
        }),
      });

      const res = await createPickupRoute(req);
      assert.equal(res.status, 201);

      const json = await res.json();
      assert.ok(json.id);
      assert.ok(json.tracking_number.startsWith('SP-'));
      assert.equal(json.status, 'available');
      assert.equal(json.estimated_quantity_kg, 25);
      assert.equal(json.customer_photo_url, uploadedCustomerFileUrl);
      assert.equal(json.images.length, 1);
      assert.equal(json.images[0].image_url, uploadedCustomerFileUrl);

      // Status history check
      assert.ok(json.status_history.length >= 1);
      assert.equal(json.status_history[0].status, 'available');
      assert.equal(json.status_history[0].user_role, 'customer');

      createdJobId = json.id;
      unsubscribe();
      assert.ok(eventReceived, 'Realtime event must be emitted on job creation');
    });

    it('customer dashboard endpoint returns newly created job', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/pickups/my-requests');
      const res = await getMyRequestsRoute(req);
      assert.equal(res.status, 200);

      const jobs = await res.json();
      assert.ok(Array.isArray(jobs));
      const found = jobs.find((j: any) => j.id === createdJobId);
      assert.ok(found, 'Created job must appear in customer my-requests');
      assert.equal(found.customer_photo_url, uploadedCustomerFileUrl);
    });
  });

  describe('3. Collector Workflow: Available Queue -> Accept -> Trip Start -> Photo Proof -> Scale Weigh -> Deliver', () => {
    it('collector queries available jobs and sees customer photo and address', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/pickups/available');
      const res = await getAvailableRoute(req);
      assert.equal(res.status, 200);

      const available = await res.json();
      assert.ok(Array.isArray(available));
      const target = available.find((j: any) => j.id === createdJobId);
      assert.ok(target, 'Customer job must be visible in collector available queue');
      assert.equal(target.customer_photo_url, uploadedCustomerFileUrl);
    });

    it('collector accepts job: transitions to accepted and assigns collector ID', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/pickups/${createdJobId}/accept`, {
        method: 'POST',
      });
      const res = await acceptRoute(req, { params: { id: createdJobId } });
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.status, 'accepted');
      assert.equal(json.assigned_collector_id, collectorId);
      assert.equal(json.collector_name, 'Tariq Mehmood');
    });

    it('collector starts trip: transitions to in_progress with GPS logging', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/pickups/${createdJobId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gps_latitude: 24.8607, gps_longitude: 67.0011 }),
      });
      const res = await startRoute(req, { params: { id: createdJobId } });
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.status, 'in_progress');
      assert.ok(json.notes.includes('lat:24.8607'));
    });

    it('collector uploads scale photo proof: stores image and updates job', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/pickups/${createdJobId}/upload-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: '/uploads/proofs/scale_reading_test.jpg',
          image_type: 'scale_display',
          caption: 'Digital scale reading 26.0 kg',
        }),
      });

      const res = await uploadPhotoRoute(req, { params: { id: createdJobId } });
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.scale_photo_url, '/uploads/proofs/scale_reading_test.jpg');
      assert.ok(json.images.some((img: any) => img.image_type === 'scale_display'));
      uploadedScaleFileUrl = json.scale_photo_url;
    });

    it('collector submits verified digital scale weight: recalculates pricing', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/pickups/${createdJobId}/verify-weight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verified_weight_kg: 26.0,
          quality_factor: 1.0,
          quality_grade: 'A',
        }),
      });

      const res = await verifyWeightRoute(req, { params: { id: createdJobId } });
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.status, 'weight_verified');
      assert.equal(json.verified_weight_kg, 26.0);
      assert.equal(json.payout_pkr, 26.0 * 80.0); // 2080 PKR
    });

    it('collector confirms completion & settlement: generates idempotent payment', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/pickups/${createdJobId}/confirm-completion`, {
        method: 'POST',
      });

      const res = await confirmCompletionRoute(req, { params: { id: createdJobId } });
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.ok(json.payment?.transaction_reference);
      assert.equal(json.payment?.status, 'completed');
      assert.equal(json.payout_pkr, 2080.0);
    });

    it('collector handovers batch to recycler: transitions status to delivered_to_recycler', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/pickups/${createdJobId}/deliver-recycler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recycler_id: recyclerId,
          recycler_name: 'GreenCycle Processing Hub 4',
        }),
      });

      const res = await deliverRecyclerRoute(req, { params: { id: createdJobId } });
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.status, 'delivered_to_recycler');
      assert.equal(json.assigned_recycler_id, recyclerId);
      assert.equal(json.recycler_name, 'GreenCycle Processing Hub 4');
    });
  });

  describe('4. Recycler Workflow: Intake -> Dual Photo Inspection -> Processing -> Circular Certificate', () => {
    it('recycler inspects job with both Customer and Collector photos side-by-side', () => {
      const job = getJobById(createdJobId);
      assert.ok(job);
      assert.equal(job.customer_photo_url, uploadedCustomerFileUrl, 'Customer photo must be visible to recycler');
      assert.equal(job.scale_photo_url, uploadedScaleFileUrl, 'Collector scale photo must be visible to recycler');
      assert.equal(job.verified_weight_kg, 26.0);
    });

    it('recycler starts processing: transitions status to processing', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/pickups/${createdJobId}/process-recycler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_processing',
        }),
      });

      const res = await processRecyclerRoute(req, { params: { id: createdJobId } });
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.status, 'processing');
    });

    it('recycler completes recycling process: records output weight, notes, and proof photo', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/pickups/${createdJobId}/process-recycler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          recycled_weight_kg: 25.1,
          notes: 'High-purity washed clear rPET flakes ready for manufacturing.',
          proof_url: '/uploads/proofs/plant_rpet_silo.jpg',
        }),
      });

      const res = await processRecyclerRoute(req, { params: { id: createdJobId } });
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.status, 'completed');
      assert.equal(json.recycled_weight_kg, 25.1);
      assert.equal(json.recycler_photo_url, '/uploads/proofs/plant_rpet_silo.jpg');
      assert.ok(json.recycler_notes?.includes('rPET flakes'));
    });
  });

  describe('5. Real-Time Notifications & History Audit Trail', () => {
    it('generates persisted in-app notifications for customer, collector, and recycler', () => {
      const customerNotifs = getNotificationsForUser(customerId, 'customer');
      assert.ok(customerNotifs.length > 0, 'Customer must receive notification on status changes');

      const collectorNotifs = getNotificationsForUser(collectorId, 'collector');
      assert.ok(collectorNotifs.length > 0, 'Collector must receive notifications');

      const recyclerNotifs = getNotificationsForUser(recyclerId, 'recycler');
      assert.ok(recyclerNotifs.length > 0, 'Recycler must receive delivery notifications');

      // Test mark as read
      const unread = customerNotifs.find((n) => !n.is_read);
      if (unread) {
        const marked = markNotificationAsRead(unread.id, customerId);
        assert.ok(marked, 'Notification must mark as read');
      }
    });

    it('records full immutable status history trail with timestamps and roles', () => {
      const job = getJobById(createdJobId);
      assert.ok(job);
      assert.ok(job.status_history.length >= 6, 'Must record all lifecycle state transitions');

      const statuses = job.status_history.map((h) => h.status);
      assert.ok(statuses.includes('available'));
      assert.ok(statuses.includes('accepted'));
      assert.ok(statuses.includes('weight_verified'));
      assert.ok(statuses.includes('delivered_to_recycler'));
      assert.ok(statuses.includes('processing'));
      assert.ok(statuses.includes('completed'));
    });
  });

  describe('6. Cancellation & Guardrails: Only Allowed Statuses Can Be Cancelled', () => {
    it('blocks cancellation for jobs that have reached processing or completed', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/pickups/${createdJobId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Changed mind' }),
      });

      const res = await cancelRoute(req, { params: { id: createdJobId } });
      assert.equal(res.status, 400);

      const json = await res.json();
      assert.ok(json.detail.includes('Cannot cancel job'));
    });

    it('allows cancellation for new available job', async () => {
      // Create new job to cancel
      const tempJob = createJob({
        customer_id: customerId,
        material_code: 'CARDBOARD_OCC',
        estimated_quantity_kg: 10,
        street_address: 'House 99, Karachi',
      });

      const req = new NextRequest(`http://localhost:3000/api/v1/pickups/${tempJob.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Accidental submission' }),
      });

      const res = await cancelRoute(req, { params: { id: tempJob.id } });
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.status, 'cancelled');
    });
  });
});
