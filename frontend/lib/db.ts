import fs from 'fs';
import path from 'path';
import { PickupRequest, WasteImage, PricingCalculation, PaymentRecord, UserRole } from './types';
import { broadcastEvent } from './realtime';

export interface StatusHistoryEntry {
  status: string;
  timestamp: string;
  user_id?: string;
  user_role?: string;
  user_name?: string;
  note?: string;
}

export interface PickupJob extends PickupRequest {
  customer_name?: string;
  customer_phone?: string;
  collector_name?: string;
  collector_phone?: string;
  assigned_recycler_id?: string | null;
  recycler_name?: string;
  customer_photo_url?: string | null;
  scale_photo_url?: string | null;
  recycler_photo_url?: string | null;
  verified_weight_kg?: number | null;
  recycled_weight_kg?: number | null;
  recycler_notes?: string | null;
  payout_pkr?: number | null;
  status_history: StatusHistoryEntry[];
  updated_at: string;
}

export interface StoredFile {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  data_base64: string;
  uploaded_by_user_id?: string;
  uploaded_by_role?: string;
  job_id?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  target_role: 'customer' | 'collector' | 'recycler' | 'all';
  title: string;
  body: string;
  job_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface DatabaseSchema {
  pickups: PickupJob[];
  files: StoredFile[];
  notifications: NotificationItem[];
}

// Valid lifecycle progression
export const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['available', 'cancelled'],
  available: ['accepted', 'assigned', 'cancelled'],
  accepted: ['pickup_started', 'in_progress', 'cancelled'],
  assigned: ['pickup_started', 'in_progress', 'cancelled'],
  in_progress: ['picked_up', 'weight_verified', 'cancelled'],
  pickup_started: ['picked_up', 'in_progress', 'cancelled'],
  weight_verified: ['picked_up', 'cancelled'],
  picked_up: ['delivered_to_recycler', 'processing'],
  delivered_to_recycler: ['processing', 'completed'],
  processing: ['completed'],
  completed: [],
  cancelled: [],
};

// Benchmark material rates (PKR / kg)
export const MATERIAL_BENCHMARKS: Record<string, { name: string; rate: number }> = {
  PET_PLASTIC: { name: 'PET Plastic', rate: 80.0 },
  MIXED_PLASTIC: { name: 'Mixed Plastic', rate: 55.0 },
  CARDBOARD_OCC: { name: 'Cardboard (OCC)', rate: 35.0 },
  MIXED_METAL: { name: 'Mixed Metal', rate: 120.0 },
  GLASS_BOTTLES: { name: 'Glass Bottles', rate: 15.0 },
  E_WASTE: { name: 'E-Waste', rate: 220.0 },
  ORGANIC_WASTE: { name: 'Organic Waste', rate: 8.0 },
  NON_RECYCLABLE: { name: 'Non-Recyclable', rate: 0.0 },
};

function getStorageFilePath(): string {
  const localDir = path.join(process.cwd(), '.data');
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return path.join(localDir, 'safaipay_store.json');
  } catch {
    const tmpDir = '/tmp';
    return path.join(tmpDir, 'safaipay_store.json');
  }
}

// Initial seed data with real records for Customer, Collector, and Recycler
function getInitialSeedData(): DatabaseSchema {
  const now = new Date();
  const formatTimeAgo = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60000).toISOString();

  const seedPickups: PickupJob[] = [
    {
      id: 'job-sp-001',
      tracking_number: 'SP-2026-PET001',
      customer_id: 'usr_guest_cust',
      customer_name: 'Amina Khan',
      customer_phone: '+92 300 1234567',
      assigned_collector_id: null,
      collector_name: undefined,
      collector_phone: undefined,
      assigned_recycler_id: null,
      recycler_name: undefined,
      material_code: 'PET_PLASTIC',
      estimated_quantity_kg: 18,
      verified_weight_kg: null,
      recycled_weight_kg: null,
      recycler_notes: null,
      street_address: 'House 42-B, Block 6, PECHS',
      city: 'Karachi',
      preferred_time: 'Today (10:00 AM - 1:00 PM)',
      notes: 'Clean sorted water bottles, boxed and ready for pickup at doorstep',
      status: 'available',
      customer_photo_url: '/uploads/mock_pet_bottle_batch.jpg',
      scale_photo_url: null,
      recycler_photo_url: null,
      images: [
        {
          id: 'img-cust-001',
          image_type: 'customer_upload',
          image_url: '/uploads/mock_pet_bottle_batch.jpg',
          caption: 'Customer uploaded batch of clean PET bottles',
        },
      ],
      pricing_calculations: [
        {
          id: 'calc-001',
          material_code: 'PET_PLASTIC',
          verified_weight_kg: 18,
          material_rate_applied: 85.0,
          quality_factor: 1.0,
          total_price: 1530.0,
          calculation_breakdown: '18 kg * 85.00 PKR/kg (Estimated)',
          is_estimated: true,
        },
      ],
      payout_pkr: 1530.0,
      payment: null,
      status_history: [
        {
          status: 'available',
          timestamp: formatTimeAgo(45),
          user_id: 'usr_guest_cust',
          user_role: 'customer',
          user_name: 'Amina Khan',
          note: 'Pickup request created by customer with photo evidence',
        },
      ],
      created_at: formatTimeAgo(45),
      updated_at: formatTimeAgo(45),
    },
    {
      id: 'job-sp-002',
      tracking_number: 'SP-2026-CRD002',
      customer_id: 'usr_guest_cust',
      customer_name: 'Amina Khan',
      customer_phone: '+92 300 1234567',
      assigned_collector_id: 'usr_guest_coll',
      collector_name: 'Tariq Mehmood',
      collector_phone: '+92 311 2345678',
      assigned_recycler_id: null,
      recycler_name: undefined,
      material_code: 'CARDBOARD_OCC',
      estimated_quantity_kg: 35,
      verified_weight_kg: null,
      recycled_weight_kg: null,
      recycler_notes: null,
      street_address: 'Plot 12-C, 7th Commercial St, Phase 2 Ext, DHA',
      city: 'Karachi',
      preferred_time: 'Within 2 hours',
      notes: 'Flattened packaging cartons dry and bundled',
      status: 'accepted',
      customer_photo_url: '/uploads/mock_pet_bottle_batch.jpg',
      scale_photo_url: null,
      recycler_photo_url: null,
      images: [
        {
          id: 'img-cust-002',
          image_type: 'customer_upload',
          image_url: '/uploads/mock_pet_bottle_batch.jpg',
          caption: 'Customer dry flattened cartons',
        },
      ],
      pricing_calculations: [
        {
          id: 'calc-002',
          material_code: 'CARDBOARD_OCC',
          verified_weight_kg: 35,
          material_rate_applied: 42.0,
          quality_factor: 1.0,
          total_price: 1470.0,
          calculation_breakdown: '35 kg * 42.00 PKR/kg (Estimated)',
          is_estimated: true,
        },
      ],
      payout_pkr: 1470.0,
      payment: null,
      status_history: [
        {
          status: 'available',
          timestamp: formatTimeAgo(60),
          user_id: 'usr_guest_cust',
          user_role: 'customer',
          user_name: 'Amina Khan',
          note: 'Pickup requested',
        },
        {
          status: 'accepted',
          timestamp: formatTimeAgo(20),
          user_id: 'usr_guest_coll',
          user_role: 'collector',
          user_name: 'Tariq Mehmood',
          note: 'Accepted by collector, assigned for pickup route',
        },
      ],
      created_at: formatTimeAgo(60),
      updated_at: formatTimeAgo(20),
    },
    {
      id: 'job-sp-003',
      tracking_number: 'SP-2026-MTL003',
      customer_id: 'usr_guest_cust',
      customer_name: 'Amina Khan',
      customer_phone: '+92 300 1234567',
      assigned_collector_id: 'usr_guest_coll',
      collector_name: 'Tariq Mehmood',
      collector_phone: '+92 311 2345678',
      assigned_recycler_id: 'usr_guest_recy',
      recycler_name: 'GreenCycle Processing Hub 4',
      material_code: 'MIXED_METAL',
      estimated_quantity_kg: 22,
      verified_weight_kg: 24.5,
      recycled_weight_kg: null,
      recycler_notes: null,
      street_address: 'Office 301, Business Avenue, PECHS Block 6',
      city: 'Karachi',
      preferred_time: 'Morning',
      notes: 'Clean beverage aluminum cans and copper wire cutoffs',
      status: 'delivered_to_recycler',
      customer_photo_url: '/uploads/mock_pet_bottle_batch.jpg',
      scale_photo_url: '/uploads/proofs/proof-scale-003.jpg',
      recycler_photo_url: null,
      images: [
        {
          id: 'img-cust-003',
          image_type: 'customer_upload',
          image_url: '/uploads/mock_pet_bottle_batch.jpg',
          caption: 'Customer metal scrap lot',
        },
        {
          id: 'img-coll-003',
          image_type: 'scale_display',
          image_url: '/uploads/proofs/proof-scale-003.jpg',
          caption: 'Digital scale display reading 24.50 kg verified by collector Tariq Mehmood',
        },
      ],
      pricing_calculations: [
        {
          id: 'calc-003',
          material_code: 'MIXED_METAL',
          verified_weight_kg: 24.5,
          material_rate_applied: 180.0,
          quality_factor: 1.0,
          total_price: 4410.0,
          calculation_breakdown: '24.5 kg * 180.00 PKR/kg = 4,410 PKR',
          is_estimated: false,
        },
      ],
      payout_pkr: 4410.0,
      payment: {
        id: 'pay-003',
        amount_pkr: 4410.0,
        transaction_reference: 'SP-TXN-RAAST-98214',
        status: 'completed',
        retry_count: 0,
      },
      status_history: [
        {
          status: 'available',
          timestamp: formatTimeAgo(180),
          user_id: 'usr_guest_cust',
          user_role: 'customer',
          user_name: 'Amina Khan',
          note: 'Request created',
        },
        {
          status: 'accepted',
          timestamp: formatTimeAgo(120),
          user_id: 'usr_guest_coll',
          user_role: 'collector',
          user_name: 'Tariq Mehmood',
          note: 'Job accepted',
        },
        {
          status: 'pickup_started',
          timestamp: formatTimeAgo(90),
          user_id: 'usr_guest_coll',
          user_role: 'collector',
          user_name: 'Tariq Mehmood',
          note: 'En route to customer',
        },
        {
          status: 'picked_up',
          timestamp: formatTimeAgo(40),
          user_id: 'usr_guest_coll',
          user_role: 'collector',
          user_name: 'Tariq Mehmood',
          note: 'Weighed and picked up 24.5 kg',
        },
        {
          status: 'delivered_to_recycler',
          timestamp: formatTimeAgo(15),
          user_id: 'usr_guest_coll',
          user_role: 'collector',
          user_name: 'Tariq Mehmood',
          note: 'Delivered to GreenCycle Processing Hub 4',
        },
      ],
      created_at: formatTimeAgo(180),
      updated_at: formatTimeAgo(15),
    },
    {
      id: 'job-sp-004',
      tracking_number: 'SP-2026-PET004',
      customer_id: 'usr_guest_cust',
      customer_name: 'Amina Khan',
      customer_phone: '+92 300 1234567',
      assigned_collector_id: 'usr_guest_coll',
      collector_name: 'Tariq Mehmood',
      collector_phone: '+92 311 2345678',
      assigned_recycler_id: 'usr_guest_recy',
      recycler_name: 'GreenCycle Processing Hub 4',
      material_code: 'PET_PLASTIC',
      estimated_quantity_kg: 50,
      verified_weight_kg: 52.0,
      recycled_weight_kg: 50.2,
      recycler_notes: 'Washed and flaked into Grade A clear rPET pellets. Yield 96.5%.',
      street_address: 'Building 14, Falcon Complex, Karachi',
      city: 'Karachi',
      preferred_time: 'Yesterday',
      notes: 'Commercial bottle scrap collection',
      status: 'completed',
      customer_photo_url: '/uploads/mock_pet_bottle_batch.jpg',
      scale_photo_url: '/uploads/proofs/proof-scale-003.jpg',
      recycler_photo_url: '/uploads/proofs/proof-recycler-004.jpg',
      images: [
        {
          id: 'img-cust-004',
          image_type: 'customer_upload',
          image_url: '/uploads/mock_pet_bottle_batch.jpg',
          caption: 'Customer sorted bottles',
        },
        {
          id: 'img-coll-004',
          image_type: 'scale_display',
          image_url: '/uploads/proofs/proof-scale-003.jpg',
          caption: 'Scale verified 52.0 kg',
        },
        {
          id: 'img-recy-004',
          image_type: 'recycler_proof',
          image_url: '/uploads/proofs/proof-recycler-004.jpg',
          caption: 'Processed rPET Flakes in silo at GreenCycle Facility',
        },
      ],
      pricing_calculations: [
        {
          id: 'calc-004',
          material_code: 'PET_PLASTIC',
          verified_weight_kg: 52.0,
          material_rate_applied: 85.0,
          quality_factor: 1.0,
          total_price: 4420.0,
          calculation_breakdown: '52.0 kg * 85.00 PKR/kg = 4,420 PKR',
          is_estimated: false,
        },
      ],
      payout_pkr: 4420.0,
      payment: {
        id: 'pay-004',
        amount_pkr: 4420.0,
        transaction_reference: 'SP-TXN-RAAST-71239',
        status: 'completed',
        retry_count: 0,
      },
      status_history: [
        {
          status: 'available',
          timestamp: formatTimeAgo(600),
          user_id: 'usr_guest_cust',
          user_role: 'customer',
          note: 'Request created',
        },
        {
          status: 'accepted',
          timestamp: formatTimeAgo(540),
          user_id: 'usr_guest_coll',
          user_role: 'collector',
          note: 'Accepted by Tariq Mehmood',
        },
        {
          status: 'picked_up',
          timestamp: formatTimeAgo(400),
          user_id: 'usr_guest_coll',
          user_role: 'collector',
          note: 'Picked up 52 kg',
        },
        {
          status: 'delivered_to_recycler',
          timestamp: formatTimeAgo(300),
          user_id: 'usr_guest_coll',
          user_role: 'collector',
          note: 'Delivered to GreenCycle',
        },
        {
          status: 'processing',
          timestamp: formatTimeAgo(150),
          user_id: 'usr_guest_recy',
          user_role: 'recycler',
          note: 'Granulation and hot wash wash cycle running',
        },
        {
          status: 'completed',
          timestamp: formatTimeAgo(30),
          user_id: 'usr_guest_recy',
          user_role: 'recycler',
          note: 'Certified recycled batch completed: 50.2 kg rPET pellets',
        },
      ],
      created_at: formatTimeAgo(600),
      updated_at: formatTimeAgo(30),
    },
  ];

  const seedNotifications: NotificationItem[] = [
    {
      id: 'notif-001',
      user_id: 'usr_guest_cust',
      target_role: 'customer',
      title: 'Batch Recycled & Completed!',
      body: 'Your 52 kg PET Plastic collection (SP-2026-PET004) has been certified and converted to rPET pellets.',
      job_id: 'job-sp-004',
      is_read: false,
      created_at: formatTimeAgo(30),
    },
    {
      id: 'notif-002',
      user_id: 'usr_guest_cust',
      target_role: 'customer',
      title: 'Batch Delivered to Recycler',
      body: 'Collector Tariq delivered your 24.5 kg Mixed Metal lot to GreenCycle Processing Hub 4.',
      job_id: 'job-sp-003',
      is_read: false,
      created_at: formatTimeAgo(15),
    },
    {
      id: 'notif-003',
      user_id: 'usr_guest_coll',
      target_role: 'collector',
      title: 'New Recyclable Job Available',
      body: '18 kg PET Plastic ready for pickup in PECHS Block 6. Tap to accept.',
      job_id: 'job-sp-001',
      is_read: false,
      created_at: formatTimeAgo(45),
    },
    {
      id: 'notif-004',
      user_id: 'usr_guest_recy',
      target_role: 'recycler',
      title: 'New Collected Batch Delivered',
      body: 'Tariq delivered 24.5 kg Mixed Metal batch (SP-2026-MTL003) ready for intake and processing.',
      job_id: 'job-sp-003',
      is_read: false,
      created_at: formatTimeAgo(15),
    },
  ];

  return {
    pickups: seedPickups,
    files: [],
    notifications: seedNotifications,
  };
}

// Global runtime cache with file synchronization
const globalDb = global as unknown as {
  __safaipay_db__?: DatabaseSchema;
};

function loadDatabase(): DatabaseSchema {
  if (globalDb.__safaipay_db__) {
    return globalDb.__safaipay_db__;
  }

  const filePath = getStorageFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(data) as DatabaseSchema;
      if (parsed && Array.isArray(parsed.pickups)) {
        globalDb.__safaipay_db__ = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed reading database file from disk, using initial seed:', err);
  }

  const seed = getInitialSeedData();
  globalDb.__safaipay_db__ = seed;
  saveDatabase(seed);
  return seed;
}

function saveDatabase(db: DatabaseSchema) {
  globalDb.__safaipay_db__ = db;
  const filePath = getStorageFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    // Non-fatal if filesystem is restricted (e.g., read-only serverless outside /tmp)
    try {
      const tmpPath = path.join('/tmp', 'safaipay_store.json');
      fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf-8');
    } catch {}
  }
}

// ==========================================
// Pickup & Job Operations
// ==========================================

export function getAllJobs(): PickupJob[] {
  const db = loadDatabase();
  return db.pickups;
}

export function getJobsForUser(user: { id: string; role: string }): PickupJob[] {
  const db = loadDatabase();
  const role = user.role.toLowerCase();

  if (role === 'admin') {
    return db.pickups;
  }

  if (role === 'customer') {
    // Customer sees only their own requests
    return db.pickups.filter((p) => p.customer_id === user.id);
  }

  if (role === 'collector') {
    // Collector sees available/pending requests (to accept) AND jobs assigned to them
    return db.pickups.filter(
      (p) =>
        p.status === 'available' ||
        p.status === 'pending' ||
        p.assigned_collector_id === user.id ||
        (!p.assigned_collector_id && ['available', 'pending'].includes(p.status))
    );
  }

  if (role === 'recycler') {
    // Recycler sees jobs that have reached processing, delivered to recycling, or completed
    return db.pickups.filter(
      (p) =>
        ['picked_up', 'delivered_to_recycler', 'processing', 'completed'].includes(p.status) ||
        p.assigned_recycler_id === user.id
    );
  }

  return [];
}

export function getJobById(id: string): PickupJob | undefined {
  const db = loadDatabase();
  return db.pickups.find((p) => p.id === id);
}

export function createJob(data: {
  id?: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  material_code: string;
  estimated_quantity_kg: number;
  street_address: string;
  city?: string;
  preferred_time?: string;
  notes?: string;
  customer_photo_url?: string;
}): PickupJob {
  const db = loadDatabase();
  const id = data.id || `job-sp-${Date.now().toString().slice(-6)}`;
  const trackingNumber = `SP-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const benchmark = MATERIAL_BENCHMARKS[data.material_code] || { name: 'Recyclables', rate: 50.0 };
  const qty = Number(data.estimated_quantity_kg) || 10;
  const unitRate = benchmark.rate;
  const estimatedPayout = qty * unitRate;

  const nowIso = new Date().toISOString();
  const images: WasteImage[] = [];

  if (data.customer_photo_url) {
    images.push({
      id: `img-cust-${Date.now()}`,
      image_type: 'customer_upload',
      image_url: data.customer_photo_url,
      caption: 'Customer uploaded waste evidence',
    });
  }

  const newJob: PickupJob = {
    id,
    tracking_number: trackingNumber,
    customer_id: data.customer_id,
    customer_name: data.customer_name || 'Customer',
    customer_phone: data.customer_phone || '+92 300 0000000',
    assigned_collector_id: null,
    collector_name: undefined,
    collector_phone: undefined,
    assigned_recycler_id: null,
    recycler_name: undefined,
    material_code: data.material_code,
    estimated_quantity_kg: qty,
    verified_weight_kg: null,
    recycled_weight_kg: null,
    recycler_notes: null,
    street_address: data.street_address,
    city: data.city || 'Karachi',
    preferred_time: data.preferred_time || 'Within 2 hours',
    notes: data.notes || '',
    status: 'available',
    customer_photo_url: data.customer_photo_url || null,
    scale_photo_url: null,
    recycler_photo_url: null,
    images,
    pricing_calculations: [
      {
        id: `calc-${Date.now()}`,
        material_code: data.material_code,
        verified_weight_kg: qty,
        material_rate_applied: unitRate,
        quality_factor: 1.0,
        total_price: estimatedPayout,
        calculation_breakdown: `${qty} kg * ${unitRate.toFixed(2)} PKR/kg (Estimated)`,
        is_estimated: true,
      },
    ],
    payout_pkr: estimatedPayout,
    payment: null,
    status_history: [
      {
        status: 'available',
        timestamp: nowIso,
        user_id: data.customer_id,
        user_role: 'customer',
        user_name: data.customer_name || 'Customer',
        note: 'Pickup request created by customer with validated address and material',
      },
    ],
    created_at: nowIso,
    updated_at: nowIso,
  };

  db.pickups.unshift(newJob);

  // Add notification for collectors
  addNotification({
    user_id: 'usr_guest_coll',
    target_role: 'collector',
    title: 'New Recyclable Job Available',
    body: `${qty} kg ${benchmark.name} in ${data.street_address.split(',')[0]}. Tap to view and accept.`,
    job_id: newJob.id,
  });

  saveDatabase(db);

  // Broadcast realtime event
  broadcastEvent({
    type: 'job_created',
    job_id: newJob.id,
    target_role: 'all',
    payload: newJob,
  });

  return newJob;
}

export function updateJobStatus(
  id: string,
  newStatus: string,
  actor: { user_id?: string; user_role: string; user_name?: string },
  updates: Partial<PickupJob> = {},
  note?: string
): PickupJob {
  const db = loadDatabase();
  let job = db.pickups.find((p) => p.id === id);

  if (!job) {
    job = createJob({
      id,
      customer_id: updates.customer_id || 'usr_guest_cust',
      customer_name: updates.customer_name || 'Amina Khan',
      material_code: updates.material_code || 'PET_PLASTIC',
      estimated_quantity_kg: updates.estimated_quantity_kg || 15,
      street_address: updates.street_address || 'House 14-C, 7th Commercial St, Phase 2, DHA, Karachi',
    });
  }

  // Validate state transitions
  const currentStatus = job.status;
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];

  // Allow idempotent updates or explicit allowed transitions
  if (currentStatus !== newStatus && !allowed.includes(newStatus)) {
    // If transitioning from in_progress or accepted flexibly:
    const relaxedAllowed = ['in_progress', 'pickup_started', 'accepted', 'weight_verified', 'picked_up', 'delivered_to_recycler', 'processing', 'completed', 'cancelled'];
    if (!relaxedAllowed.includes(newStatus)) {
      throw new Error(`Invalid status transition from '${currentStatus}' to '${newStatus}'. Allowed: ${allowed.join(', ')}`);
    }
  }

  const nowIso = new Date().toISOString();

  // Apply updates
  Object.assign(job, updates);
  job.status = newStatus;
  job.updated_at = nowIso;

  // Append history log
  job.status_history.push({
    status: newStatus,
    timestamp: nowIso,
    user_id: actor.user_id,
    user_role: actor.user_role,
    user_name: actor.user_name || actor.user_role,
    note: note || `Status transitioned to ${newStatus}`,
  });

  // Targeted Notifications & Realtime Event Types
  let eventType: any = 'status_changed';

  if (newStatus === 'accepted') {
    eventType = 'job_accepted';
    addNotification({
      user_id: job.customer_id,
      target_role: 'customer',
      title: 'Pickup Job Accepted!',
      body: `Collector ${actor.user_name || 'Tariq Mehmood'} accepted your pickup (${job.tracking_number}).`,
      job_id: job.id,
    });
  } else if (newStatus === 'pickup_started' || newStatus === 'in_progress') {
    eventType = 'pickup_started';
    addNotification({
      user_id: job.customer_id,
      target_role: 'customer',
      title: 'Collector On The Way',
      body: `Collector is heading to your address (${job.street_address}) for pickup.`,
      job_id: job.id,
    });
  } else if (newStatus === 'picked_up') {
    eventType = 'job_updated';
    addNotification({
      user_id: job.customer_id,
      target_role: 'customer',
      title: 'Waste Collected & Weighed',
      body: `Your recyclable material (${job.verified_weight_kg || job.estimated_quantity_kg} kg) has been collected.`,
      job_id: job.id,
    });
    addNotification({
      user_id: 'usr_guest_recy',
      target_role: 'recycler',
      title: 'New Collected Batch in Transit',
      body: `${job.verified_weight_kg || job.estimated_quantity_kg} kg ${job.material_code} picked up and on route to recycling facility.`,
      job_id: job.id,
    });
  } else if (newStatus === 'delivered_to_recycler') {
    eventType = 'delivered_to_recycler';
    addNotification({
      user_id: 'usr_guest_recy',
      target_role: 'recycler',
      title: 'Batch Delivered for Recycling',
      body: `Batch ${job.tracking_number} delivered to facility. Ready for intake and processing.`,
      job_id: job.id,
    });
    addNotification({
      user_id: job.customer_id,
      target_role: 'customer',
      title: 'Delivered to Recycling Facility',
      body: `Your recyclable waste has arrived at the licensed recycling facility.`,
      job_id: job.id,
    });
  } else if (newStatus === 'processing') {
    eventType = 'recycler_processing';
    addNotification({
      user_id: job.customer_id,
      target_role: 'customer',
      title: 'Recycling in Progress',
      body: `Recycling facility has commenced sorting, washing, and processing.`,
      job_id: job.id,
    });
  } else if (newStatus === 'completed') {
    eventType = 'job_completed';
    addNotification({
      user_id: job.customer_id,
      target_role: 'customer',
      title: 'Processing Complete & Certified!',
      body: `Your recycled material (${job.recycled_weight_kg || job.verified_weight_kg} kg output) has been certified. Thank you for contributing to green Pakistan!`,
      job_id: job.id,
    });
    if (job.assigned_collector_id) {
      addNotification({
        user_id: job.assigned_collector_id,
        target_role: 'collector',
        title: 'Batch Processed by Recycler',
        body: `Delivered batch ${job.tracking_number} has been verified and fully processed by recycler.`,
        job_id: job.id,
      });
    }
  }

  saveDatabase(db);

  broadcastEvent({
    type: eventType,
    job_id: job.id,
    target_role: 'all',
    payload: job,
  });

  return job;
}

export function attachJobImage(
  jobId: string,
  image: WasteImage,
  actor: { user_id?: string; user_role: string }
): PickupJob {
  const db = loadDatabase();
  const job = db.pickups.find((p) => p.id === jobId);

  if (!job) {
    throw new Error(`Job not found with ID ${jobId}`);
  }

  job.images = job.images || [];
  // Avoid duplicate entries for same image_type
  job.images = [...job.images.filter((img) => img.image_type !== image.image_type), image];

  if (image.image_type === 'customer_upload') {
    job.customer_photo_url = image.image_url;
  } else if (image.image_type === 'scale_display' || image.image_type === 'collector_proof') {
    job.scale_photo_url = image.image_url;
  } else if (image.image_type === 'recycler_proof') {
    job.recycler_photo_url = image.image_url;
  }

  job.updated_at = new Date().toISOString();

  saveDatabase(db);

  broadcastEvent({
    type: 'photo_uploaded',
    job_id: job.id,
    target_role: 'all',
    payload: { job, uploaded_image: image },
  });

  return job;
}

// ==========================================
// File Storage Operations
// ==========================================

export function storeFileRecord(file: Omit<StoredFile, 'id' | 'created_at'>): StoredFile {
  const db = loadDatabase();
  const id = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const stored: StoredFile = {
    id,
    created_at: new Date().toISOString(),
    ...file,
  };

  db.files.push(stored);
  saveDatabase(db);
  return stored;
}

export function getFileRecord(id: string): StoredFile | undefined {
  const db = loadDatabase();
  return db.files.find((f) => f.id === id);
}

// ==========================================
// Notifications Operations
// ==========================================

export function addNotification(item: Omit<NotificationItem, 'id' | 'is_read' | 'created_at'>): NotificationItem {
  const db = loadDatabase();
  const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const notif: NotificationItem = {
    id,
    is_read: false,
    created_at: new Date().toISOString(),
    ...item,
  };

  db.notifications.unshift(notif);
  saveDatabase(db);

  broadcastEvent({
    type: 'notification',
    target_user_id: item.user_id,
    target_role: item.target_role,
    payload: notif,
  });

  return notif;
}

export function getNotificationsForUser(userId: string, role?: string): NotificationItem[] {
  const db = loadDatabase();
  return db.notifications.filter(
    (n) => n.user_id === userId || (role && (n.target_role === 'all' || n.target_role === role.toLowerCase()))
  );
}

export function markNotificationAsRead(id: string, userId: string): boolean {
  const db = loadDatabase();
  const notif = db.notifications.find((n) => n.id === id && (n.user_id === userId || n.target_role === 'all'));
  if (notif) {
    notif.is_read = true;
    saveDatabase(db);
    return true;
  }
  return false;
}

export function markAllNotificationsAsRead(userId: string): number {
  const db = loadDatabase();
  let count = 0;
  for (const n of db.notifications) {
    if ((n.user_id === userId || n.target_role === 'all') && !n.is_read) {
      n.is_read = true;
      count++;
    }
  }
  if (count > 0) {
    saveDatabase(db);
  }
  return count;
}
