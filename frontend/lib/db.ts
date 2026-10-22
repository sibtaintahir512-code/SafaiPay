import fs from 'fs';
import path from 'path';
import { PickupRequest, WasteImage, PricingCalculation, PaymentRecord, UserRole } from './types';
import { broadcastEvent } from './realtime';
import {
  ChatConversation,
  ChatMessage,
  ChatParticipant,
  ChatAttachment,
  ChatReplyPreview,
  ChatForwardInfo,
  ChatMessageSummary,
  UserPresenceRecord,
  UserBlockRecord,
  ChatReportRecord,
  ChatNotificationSetting,
  MessageType,
  ConversationType,
} from './chatTypes';
import { VERIFIED_USERS } from './serverAuth';

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
  conversations: ChatConversation[];
  messages: ChatMessage[];
  user_blocks: UserBlockRecord[];
  chat_reports: ChatReportRecord[];
  user_presence: Record<string, UserPresenceRecord>;
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

function getInitialSeedConversations(): ChatConversation[] {
  const now = new Date();
  const formatTimeAgo = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60000).toISOString();

  return [
    {
      id: 'conv-direct-001',
      type: 'direct',
      title: 'Amina Khan & Tariq Mehmood',
      created_by: 'usr_guest_coll',
      created_at: formatTimeAgo(120),
      updated_at: formatTimeAgo(10),
      participant_ids: ['usr_guest_cust', 'usr_guest_coll'],
      participants: [
        {
          user_id: 'usr_guest_cust',
          name: 'Amina Khan',
          role: 'customer',
          phone_number: '+92 300 1234567',
          joined_at: formatTimeAgo(120),
          last_read_message_id: 'msg-003',
          last_read_at: formatTimeAgo(8),
        },
        {
          user_id: 'usr_guest_coll',
          name: 'Tariq Mehmood',
          role: 'collector',
          phone_number: '+92 311 2345678',
          joined_at: formatTimeAgo(120),
          last_read_message_id: 'msg-003',
          last_read_at: formatTimeAgo(9),
        },
      ],
      last_message: {
        id: 'msg-003',
        sender_id: 'usr_guest_coll',
        sender_name: 'Tariq Mehmood',
        content_preview: 'Bohat shukriya, main 15 minutes mein pohnch raha hoon digital scale le kar.',
        type: 'text',
        created_at: formatTimeAgo(10),
      },
      unread_counts: {
        usr_guest_cust: 0,
        usr_guest_coll: 0,
      },
      pinned_by: ['usr_guest_cust'],
      muted_by: {},
    },
    {
      id: 'conv-direct-002',
      type: 'direct',
      title: 'Tariq Mehmood & GreenCycle Hub',
      created_by: 'usr_guest_coll',
      created_at: formatTimeAgo(90),
      updated_at: formatTimeAgo(25),
      participant_ids: ['usr_guest_coll', 'usr_guest_recy'],
      participants: [
        {
          user_id: 'usr_guest_coll',
          name: 'Tariq Mehmood',
          role: 'collector',
          phone_number: '+92 311 2345678',
          joined_at: formatTimeAgo(90),
          last_read_message_id: 'msg-005',
          last_read_at: formatTimeAgo(20),
        },
        {
          user_id: 'usr_guest_recy',
          name: 'GreenCycle Processing Hub 4',
          role: 'recycler',
          phone_number: '+92 322 3456789',
          joined_at: formatTimeAgo(90),
          last_read_message_id: 'msg-005',
          last_read_at: formatTimeAgo(22),
        },
      ],
      last_message: {
        id: 'msg-005',
        sender_id: 'usr_guest_recy',
        sender_name: 'GreenCycle Processing Hub 4',
        content_preview: 'Ji Tariq bhai, Gate 2 par weighbridge open hai. Aake drop kar dain.',
        type: 'text',
        created_at: formatTimeAgo(25),
      },
      unread_counts: {
        usr_guest_coll: 0,
        usr_guest_recy: 0,
      },
      pinned_by: [],
      muted_by: {},
    },
    {
      id: 'conv-group-001',
      type: 'group',
      title: 'SafaiPay Operations Coordination',
      created_by: 'usr_admin_001',
      created_at: formatTimeAgo(240),
      updated_at: formatTimeAgo(5),
      participant_ids: ['usr_admin_001', 'usr_guest_cust', 'usr_guest_coll', 'usr_guest_recy'],
      participants: [
        {
          user_id: 'usr_admin_001',
          name: 'SafaiPay Platform Superadmin',
          role: 'admin',
          phone_number: '+92 300 0009999',
          joined_at: formatTimeAgo(240),
          is_admin: true,
          last_read_message_id: 'msg-008',
          last_read_at: formatTimeAgo(4),
        },
        {
          user_id: 'usr_guest_cust',
          name: 'Amina Khan',
          role: 'customer',
          phone_number: '+92 300 1234567',
          joined_at: formatTimeAgo(240),
          last_read_message_id: 'msg-008',
          last_read_at: formatTimeAgo(4),
        },
        {
          user_id: 'usr_guest_coll',
          name: 'Tariq Mehmood',
          role: 'collector',
          phone_number: '+92 311 2345678',
          joined_at: formatTimeAgo(240),
          last_read_message_id: 'msg-008',
          last_read_at: formatTimeAgo(4),
        },
        {
          user_id: 'usr_guest_recy',
          name: 'GreenCycle Processing Hub 4',
          role: 'recycler',
          phone_number: '+92 322 3456789',
          joined_at: formatTimeAgo(240),
          last_read_message_id: 'msg-008',
          last_read_at: formatTimeAgo(4),
        },
      ],
      last_message: {
        id: 'msg-008',
        sender_id: 'usr_guest_recy',
        sender_name: 'GreenCycle Processing Hub 4',
        content_preview: 'Agreed. Weight discrepancies aur delivery timings real-time clear honge.',
        type: 'text',
        created_at: formatTimeAgo(5),
      },
      unread_counts: {
        usr_admin_001: 0,
        usr_guest_cust: 0,
        usr_guest_coll: 0,
        usr_guest_recy: 0,
      },
      pinned_by: ['usr_admin_001', 'usr_guest_coll'],
      muted_by: {},
    },
  ];
}

function getInitialSeedMessages(): ChatMessage[] {
  const now = new Date();
  const formatTimeAgo = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60000).toISOString();

  return [
    {
      id: 'msg-001',
      conversation_id: 'conv-direct-001',
      sender_id: 'usr_guest_coll',
      sender_name: 'Tariq Mehmood',
      sender_role: 'collector',
      content: 'Assalam-o-Alaikum Amina sahiba! Main aapki taraf nikal chuka hoon pickup ke liye. Kya aapka doorbell kaam kar raha hai?',
      type: 'text',
      reactions: { '👍': ['usr_guest_cust'] },
      status: 'read',
      read_by: [{ user_id: 'usr_guest_cust', read_at: formatTimeAgo(45) }],
      is_edited: false,
      is_deleted: false,
      created_at: formatTimeAgo(50),
      updated_at: formatTimeAgo(50),
    },
    {
      id: 'msg-002',
      conversation_id: 'conv-direct-001',
      sender_id: 'usr_guest_cust',
      sender_name: 'Amina Khan',
      sender_role: 'customer',
      content: 'Walaikum Assalam Tariq bhai, jee doorbell kaam kar raha hai. Bottles porch mein packed aur sorted hain.',
      type: 'text',
      reply_to: {
        message_id: 'msg-001',
        sender_name: 'Tariq Mehmood',
        content_preview: 'Assalam-o-Alaikum Amina sahiba! Main aapki taraf nikal chuka hoon...',
        type: 'text',
      },
      reactions: { '❤️': ['usr_guest_coll'] },
      status: 'read',
      read_by: [{ user_id: 'usr_guest_coll', read_at: formatTimeAgo(28) }],
      is_edited: false,
      is_deleted: false,
      created_at: formatTimeAgo(30),
      updated_at: formatTimeAgo(30),
    },
    {
      id: 'msg-003',
      conversation_id: 'conv-direct-001',
      sender_id: 'usr_guest_coll',
      sender_name: 'Tariq Mehmood',
      sender_role: 'collector',
      content: 'Bohat shukriya, main 15 minutes mein pohnch raha hoon digital scale le kar.',
      type: 'text',
      reactions: {},
      status: 'read',
      read_by: [{ user_id: 'usr_guest_cust', read_at: formatTimeAgo(8) }],
      is_edited: false,
      is_deleted: false,
      created_at: formatTimeAgo(10),
      updated_at: formatTimeAgo(10),
    },
    {
      id: 'msg-004',
      conversation_id: 'conv-direct-002',
      sender_id: 'usr_guest_coll',
      sender_name: 'Tariq Mehmood',
      sender_role: 'collector',
      content: 'GreenCycle team, aaj ka 52 kg PET bottle batch ready hai intake ke liye.',
      type: 'text',
      reactions: {},
      status: 'read',
      read_by: [{ user_id: 'usr_guest_recy', read_at: formatTimeAgo(32) }],
      is_edited: false,
      is_deleted: false,
      created_at: formatTimeAgo(40),
      updated_at: formatTimeAgo(40),
    },
    {
      id: 'msg-005',
      conversation_id: 'conv-direct-002',
      sender_id: 'usr_guest_recy',
      sender_name: 'GreenCycle Processing Hub 4',
      sender_role: 'recycler',
      content: 'Ji Tariq bhai, Gate 2 par weighbridge open hai. Aake drop kar dain.',
      type: 'text',
      reactions: { '🙏': ['usr_guest_coll'] },
      status: 'read',
      read_by: [{ user_id: 'usr_guest_coll', read_at: formatTimeAgo(20) }],
      is_edited: false,
      is_deleted: false,
      created_at: formatTimeAgo(25),
      updated_at: formatTimeAgo(25),
    },
    {
      id: 'msg-006',
      conversation_id: 'conv-group-001',
      sender_id: 'usr_admin_001',
      sender_name: 'SafaiPay Platform Superadmin',
      sender_role: 'admin',
      content: 'Welcome to SafaiPay Operations Chat. Yahan collectors, recyclers aur customers direct coordinate kar saktay hain.',
      type: 'text',
      reactions: { '🎉': ['usr_guest_cust', 'usr_guest_coll', 'usr_guest_recy'] },
      status: 'read',
      read_by: [
        { user_id: 'usr_guest_cust', read_at: formatTimeAgo(15) },
        { user_id: 'usr_guest_coll', read_at: formatTimeAgo(15) },
        { user_id: 'usr_guest_recy', read_at: formatTimeAgo(15) },
      ],
      is_edited: false,
      is_deleted: false,
      created_at: formatTimeAgo(60),
      updated_at: formatTimeAgo(60),
    },
    {
      id: 'msg-007',
      conversation_id: 'conv-group-001',
      sender_id: 'usr_guest_coll',
      sender_name: 'Tariq Mehmood',
      sender_role: 'collector',
      content: 'Great feature! Is se pickup aur delivery coordination bohat smooth aur transparent ho jayegi.',
      type: 'text',
      reactions: { '👍': ['usr_admin_001'] },
      status: 'read',
      read_by: [
        { user_id: 'usr_admin_001', read_at: formatTimeAgo(10) },
        { user_id: 'usr_guest_recy', read_at: formatTimeAgo(10) },
      ],
      is_edited: false,
      is_deleted: false,
      created_at: formatTimeAgo(20),
      updated_at: formatTimeAgo(20),
    },
    {
      id: 'msg-008',
      conversation_id: 'conv-group-001',
      sender_id: 'usr_guest_recy',
      sender_name: 'GreenCycle Processing Hub 4',
      sender_role: 'recycler',
      content: 'Agreed. Weight discrepancies aur delivery timings real-time clear honge.',
      type: 'text',
      reactions: { '💯': ['usr_guest_coll'] },
      status: 'read',
      read_by: [{ user_id: 'usr_admin_001', read_at: formatTimeAgo(4) }],
      is_edited: false,
      is_deleted: false,
      created_at: formatTimeAgo(5),
      updated_at: formatTimeAgo(5),
    },
  ];
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
    conversations: getInitialSeedConversations(),
    messages: getInitialSeedMessages(),
    user_blocks: [],
    chat_reports: [],
    user_presence: {
      usr_guest_cust: { user_id: 'usr_guest_cust', is_online: true, last_seen: new Date().toISOString() },
      usr_guest_coll: { user_id: 'usr_guest_coll', is_online: true, last_seen: new Date().toISOString() },
      usr_guest_recy: { user_id: 'usr_guest_recy', is_online: true, last_seen: new Date().toISOString() },
      usr_admin_001: { user_id: 'usr_admin_001', is_online: true, last_seen: new Date().toISOString() },
    },
  };
}

// Global runtime cache with file synchronization
const globalDb = global as unknown as {
  __safaipay_db__?: DatabaseSchema;
};

export function loadDatabase(): DatabaseSchema {
  if (globalDb.__safaipay_db__) {
    return globalDb.__safaipay_db__;
  }

  const filePath = getStorageFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(data) as DatabaseSchema;
      if (parsed && Array.isArray(parsed.pickups)) {
        if (!Array.isArray(parsed.conversations)) parsed.conversations = getInitialSeedConversations();
        if (!Array.isArray(parsed.messages)) parsed.messages = getInitialSeedMessages();
        if (!Array.isArray(parsed.user_blocks)) parsed.user_blocks = [];
        if (!Array.isArray(parsed.chat_reports)) parsed.chat_reports = [];
        if (!parsed.user_presence || typeof parsed.user_presence !== 'object') {
          parsed.user_presence = {
            usr_guest_cust: { user_id: 'usr_guest_cust', is_online: true, last_seen: new Date().toISOString() },
            usr_guest_coll: { user_id: 'usr_guest_coll', is_online: true, last_seen: new Date().toISOString() },
            usr_guest_recy: { user_id: 'usr_guest_recy', is_online: true, last_seen: new Date().toISOString() },
            usr_admin_001: { user_id: 'usr_admin_001', is_online: true, last_seen: new Date().toISOString() },
          };
        }
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

export function saveDatabase(db: DatabaseSchema) {
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

// ==========================================
// Real-Time Chat & Messaging Operations
// ==========================================

export function getConversationsForUser(userId: string): ChatConversation[] {
  const db = loadDatabase();
  const convs = db.conversations.filter((c) => c.participant_ids.includes(userId));

  // Sort: pinned first, then by updated_at descending
  return convs.sort((a, b) => {
    const aPinned = a.pinned_by?.includes(userId) ? 1 : 0;
    const bPinned = b.pinned_by?.includes(userId) ? 1 : 0;
    if (aPinned !== bPinned) return bPinned - aPinned;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
}

export function getConversationById(convId: string): ChatConversation | null {
  const db = loadDatabase();
  return db.conversations.find((c) => c.id === convId) || null;
}

export function createDirectConversation(
  userA: { id: string; name: string; role: UserRole; phone?: string; avatar?: string },
  userB: { id: string; name: string; role: UserRole; phone?: string; avatar?: string }
): ChatConversation {
  const db = loadDatabase();

  // Check if a direct conversation between these two already exists
  const existing = db.conversations.find(
    (c) =>
      c.type === 'direct' &&
      c.participant_ids.length === 2 &&
      c.participant_ids.includes(userA.id) &&
      c.participant_ids.includes(userB.id)
  );

  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const newConv: ChatConversation = {
    id: `conv-dir-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type: 'direct',
    title: `${userA.name} & ${userB.name}`,
    avatar_url: userB.avatar,
    created_by: userA.id,
    created_at: now,
    updated_at: now,
    participant_ids: [userA.id, userB.id],
    participants: [
      {
        user_id: userA.id,
        name: userA.name,
        role: userA.role,
        phone_number: userA.phone,
        avatar_url: userA.avatar,
        joined_at: now,
      },
      {
        user_id: userB.id,
        name: userB.name,
        role: userB.role,
        phone_number: userB.phone,
        avatar_url: userB.avatar,
        joined_at: now,
      },
    ],
    last_message: null,
    unread_counts: {
      [userA.id]: 0,
      [userB.id]: 0,
    },
    pinned_by: [],
    muted_by: {},
  };

  db.conversations.unshift(newConv);
  saveDatabase(db);

  broadcastEvent({
    type: 'chat_conversation_new',
    target_user_id: userB.id,
    payload: newConv,
  });

  return newConv;
}

export function createGroupConversation(
  creator: { id: string; name: string; role: UserRole; phone?: string; avatar?: string },
  title: string,
  participants: Array<{ id: string; name: string; role: UserRole; phone?: string; avatar?: string }>
): ChatConversation {
  const db = loadDatabase();
  const now = new Date().toISOString();

  // Deduplicate participants including creator
  const map = new Map<string, ChatParticipant>();
  map.set(creator.id, {
    user_id: creator.id,
    name: creator.name,
    role: creator.role,
    phone_number: creator.phone,
    avatar_url: creator.avatar,
    joined_at: now,
    is_admin: true,
  });

  participants.forEach((p) => {
    if (!map.has(p.id)) {
      map.set(p.id, {
        user_id: p.id,
        name: p.name,
        role: p.role,
        phone_number: p.phone,
        avatar_url: p.avatar,
        joined_at: now,
        is_admin: false,
      });
    }
  });

  const partList = Array.from(map.values());
  const unreadCounts: Record<string, number> = {};
  partList.forEach((p) => {
    unreadCounts[p.user_id] = 0;
  });

  const newConv: ChatConversation = {
    id: `conv-grp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type: 'group',
    title: title.trim() || 'New Group Chat',
    created_by: creator.id,
    created_at: now,
    updated_at: now,
    participant_ids: partList.map((p) => p.user_id),
    participants: partList,
    last_message: null,
    unread_counts: unreadCounts,
    pinned_by: [],
    muted_by: {},
  };

  db.conversations.unshift(newConv);
  saveDatabase(db);

  partList.forEach((p) => {
    if (p.user_id !== creator.id) {
      broadcastEvent({
        type: 'chat_conversation_new',
        target_user_id: p.user_id,
        payload: newConv,
      });
    }
  });

  return newConv;
}

export function updateConversationSettings(
  convId: string,
  userId: string,
  updates: {
    title?: string;
    isPinned?: boolean;
    muteSetting?: ChatNotificationSetting;
  }
): ChatConversation {
  const db = loadDatabase();
  const conv = db.conversations.find((c) => c.id === convId);
  if (!conv) {
    throw new Error('Conversation not found');
  }

  if (!conv.participant_ids.includes(userId)) {
    throw new Error('Unauthorized: User is not a participant');
  }

  if (updates.title && conv.type === 'group') {
    conv.title = updates.title.trim();
  }

  if (updates.isPinned !== undefined) {
    if (!conv.pinned_by) conv.pinned_by = [];
    if (updates.isPinned && !conv.pinned_by.includes(userId)) {
      conv.pinned_by.push(userId);
    } else if (!updates.isPinned) {
      conv.pinned_by = conv.pinned_by.filter((id) => id !== userId);
    }
  }

  if (updates.muteSetting) {
    if (!conv.muted_by) conv.muted_by = {};
    conv.muted_by[userId] = updates.muteSetting;
  }

  conv.updated_at = new Date().toISOString();
  saveDatabase(db);
  return conv;
}

export function getMessages(
  convId: string,
  options: { limit?: number; before?: string } = {}
): { messages: ChatMessage[]; hasMore: boolean } {
  const db = loadDatabase();
  const limit = Math.min(options.limit || 50, 100);

  let list = db.messages.filter((m) => m.conversation_id === convId);

  if (options.before) {
    const beforeTime = new Date(options.before).getTime();
    list = list.filter((m) => new Date(m.created_at).getTime() < beforeTime);
  }

  // Sort by created_at ascending
  list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const total = list.length;
  const sliced = list.slice(Math.max(0, total - limit));
  const hasMore = total > limit;

  // Format soft-deleted messages for client privacy
  const sanitized = sliced.map((m) => {
    if (m.is_deleted) {
      return {
        ...m,
        content: 'This message was deleted',
        attachments: [],
      };
    }
    return m;
  });

  return { messages: sanitized, hasMore };
}

export function getMessageById(msgId: string): ChatMessage | null {
  const db = loadDatabase();
  return db.messages.find((m) => m.id === msgId) || null;
}

export function sendChatMessage(params: {
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: UserRole;
  sender_avatar?: string;
  content: string;
  type?: MessageType;
  attachments?: ChatAttachment[];
  reply_to?: ChatReplyPreview | null;
  forwarded_from?: ChatForwardInfo | null;
  client_temp_id?: string;
}): ChatMessage {
  const db = loadDatabase();
  const conv = db.conversations.find((c) => c.id === params.conversation_id);
  if (!conv) {
    throw new Error('Conversation not found');
  }

  if (!conv.participant_ids.includes(params.sender_id)) {
    throw new Error('Unauthorized: Sender is not a participant in this conversation.');
  }

  // Check if any participant in this direct chat has blocked the other
  if (conv.type === 'direct') {
    const recipientId = conv.participant_ids.find((id) => id !== params.sender_id);
    if (recipientId && isUserBlocked(params.sender_id, recipientId)) {
      throw new Error('Cannot send message: Communication is blocked with this user.');
    }
  }

  // Deduplication check using client_temp_id
  if (params.client_temp_id) {
    const existing = db.messages.find(
      (m) => m.conversation_id === params.conversation_id && m.client_temp_id === params.client_temp_id
    );
    if (existing) {
      return existing;
    }
  }

  const now = new Date().toISOString();
  const msgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const newMsg: ChatMessage = {
    id: msgId,
    conversation_id: params.conversation_id,
    sender_id: params.sender_id,
    sender_name: params.sender_name,
    sender_role: params.sender_role,
    sender_avatar: params.sender_avatar,
    content: (params.content || '').trim(),
    type: params.type || (params.attachments?.length ? 'image' : 'text'),
    attachments: params.attachments || [],
    reply_to: params.reply_to || null,
    forwarded_from: params.forwarded_from || null,
    reactions: {},
    status: 'sent',
    read_by: [{ user_id: params.sender_id, read_at: now }],
    is_edited: false,
    is_deleted: false,
    created_at: now,
    updated_at: now,
    client_temp_id: params.client_temp_id,
  };

  db.messages.push(newMsg);

  // Update conversation last_message and unread counts
  let preview = newMsg.content;
  if (!preview) {
    if (newMsg.type === 'voice') preview = '🎤 Voice note';
    else if (newMsg.type === 'image') preview = '📷 Image';
    else if (newMsg.type === 'file') preview = '📎 Attachment';
    else preview = 'Message';
  }

  conv.last_message = {
    id: newMsg.id,
    sender_id: newMsg.sender_id,
    sender_name: newMsg.sender_name,
    content_preview: preview.slice(0, 100),
    type: newMsg.type,
    created_at: now,
  };
  conv.updated_at = now;

  // Increment unread count for other participants
  if (!conv.unread_counts) conv.unread_counts = {};
  conv.participant_ids.forEach((pId) => {
    if (pId !== params.sender_id) {
      conv.unread_counts[pId] = (conv.unread_counts[pId] || 0) + 1;
    }
  });

  saveDatabase(db);

  // Broadcast real-time message event to all participants
  broadcastEvent({
    type: 'chat_message',
    target_role: 'all',
    payload: newMsg,
  });

  // Create persistent notifications for participants who haven't muted
  conv.participant_ids.forEach((pId) => {
    if (pId !== params.sender_id) {
      const muteSetting = conv.muted_by?.[pId] || 'all';
      if (muteSetting !== 'mute') {
        addNotification({
          user_id: pId,
          target_role: 'all',
          title: `New message from ${params.sender_name}`,
          body: preview.slice(0, 80),
        });
      }
    }
  });

  return newMsg;
}

export function editChatMessage(msgId: string, userId: string, newContent: string): ChatMessage {
  const db = loadDatabase();
  const msg = db.messages.find((m) => m.id === msgId);
  if (!msg) {
    throw new Error('Message not found');
  }

  if (msg.sender_id !== userId) {
    throw new Error('Unauthorized: Only the sender can edit this message');
  }

  if (msg.is_deleted) {
    throw new Error('Cannot edit a deleted message');
  }

  msg.content = newContent.trim();
  msg.is_edited = true;
  msg.edited_at = new Date().toISOString();
  msg.updated_at = msg.edited_at;

  saveDatabase(db);

  broadcastEvent({
    type: 'chat_message_update',
    target_role: 'all',
    payload: {
      message_id: msg.id,
      conversation_id: msg.conversation_id,
      content: msg.content,
      is_edited: true,
      edited_at: msg.edited_at,
    },
  });

  return msg;
}

export function deleteChatMessage(msgId: string, userId: string): ChatMessage {
  const db = loadDatabase();
  const msg = db.messages.find((m) => m.id === msgId);
  if (!msg) {
    throw new Error('Message not found');
  }

  if (msg.sender_id !== userId) {
    throw new Error('Unauthorized: Only the sender can delete this message');
  }

  msg.is_deleted = true;
  msg.deleted_at = new Date().toISOString();
  msg.content = 'This message was deleted';
  msg.attachments = [];
  msg.updated_at = msg.deleted_at;

  saveDatabase(db);

  broadcastEvent({
    type: 'chat_message_delete',
    target_role: 'all',
    payload: {
      message_id: msg.id,
      conversation_id: msg.conversation_id,
      is_deleted: true,
      deleted_at: msg.deleted_at,
    },
  });

  return msg;
}

export function toggleMessageReaction(msgId: string, userId: string, emoji: string): ChatMessage {
  const db = loadDatabase();
  const msg = db.messages.find((m) => m.id === msgId);
  if (!msg) {
    throw new Error('Message not found');
  }

  if (!msg.reactions) {
    msg.reactions = {};
  }

  const existingList = msg.reactions[emoji] || [];
  if (existingList.includes(userId)) {
    msg.reactions[emoji] = existingList.filter((id) => id !== userId);
    if (msg.reactions[emoji].length === 0) {
      delete msg.reactions[emoji];
    }
  } else {
    msg.reactions[emoji] = [...existingList, userId];
  }

  msg.updated_at = new Date().toISOString();
  saveDatabase(db);

  broadcastEvent({
    type: 'chat_reaction',
    target_role: 'all',
    payload: {
      message_id: msg.id,
      conversation_id: msg.conversation_id,
      reactions: msg.reactions,
    },
  });

  return msg;
}

export function markConversationAsRead(
  convId: string,
  userId: string,
  messageId?: string
): { success: boolean; unreadCount: number } {
  const db = loadDatabase();
  const conv = db.conversations.find((c) => c.id === convId);
  if (!conv) {
    return { success: false, unreadCount: 0 };
  }

  if (!conv.unread_counts) conv.unread_counts = {};
  conv.unread_counts[userId] = 0;

  const now = new Date().toISOString();
  const participant = conv.participants.find((p) => p.user_id === userId);
  if (participant) {
    participant.last_read_at = now;
    if (messageId) {
      participant.last_read_message_id = messageId;
    }
  }

  // Update read status for messages in this conversation
  db.messages
    .filter((m) => m.conversation_id === convId && m.sender_id !== userId)
    .forEach((m) => {
      if (!m.read_by.some((r) => r.user_id === userId)) {
        m.read_by.push({ user_id: userId, read_at: now });
      }
      m.status = 'read';
    });

  saveDatabase(db);

  broadcastEvent({
    type: 'chat_read_receipt',
    target_role: 'all',
    payload: {
      conversation_id: convId,
      user_id: userId,
      read_at: now,
      message_id: messageId,
    },
  });

  return { success: true, unreadCount: 0 };
}

export function setTypingStatus(
  convId: string,
  userId: string,
  userName: string,
  isTyping: boolean
): void {
  broadcastEvent({
    type: 'chat_typing',
    target_role: 'all',
    payload: {
      conversation_id: convId,
      user_id: userId,
      user_name: userName,
      is_typing: isTyping,
      timestamp: new Date().toISOString(),
    },
  });
}

export function setUserPresence(
  userId: string,
  isOnline: boolean,
  currentConvId?: string
): UserPresenceRecord {
  const db = loadDatabase();
  if (!db.user_presence) db.user_presence = {};

  const record: UserPresenceRecord = {
    user_id: userId,
    is_online: isOnline,
    last_seen: new Date().toISOString(),
    current_conversation_id: currentConvId,
  };

  db.user_presence[userId] = record;
  saveDatabase(db);

  broadcastEvent({
    type: 'chat_presence',
    target_role: 'all',
    payload: record,
  });

  return record;
}

export function getUserPresence(userId: string): UserPresenceRecord {
  const db = loadDatabase();
  if (!db.user_presence) db.user_presence = {};
  return (
    db.user_presence[userId] || {
      user_id: userId,
      is_online: false,
      last_seen: new Date(Date.now() - 3600000).toISOString(),
    }
  );
}

export function getAllUsersPresence(): Record<string, UserPresenceRecord> {
  const db = loadDatabase();
  return db.user_presence || {};
}

export function blockUser(blockerId: string, blockedId: string, reason?: string): UserBlockRecord {
  const db = loadDatabase();
  if (!db.user_blocks) db.user_blocks = [];

  const existing = db.user_blocks.find(
    (b) => b.blocker_user_id === blockerId && b.blocked_user_id === blockedId
  );
  if (existing) return existing;

  const record: UserBlockRecord = {
    id: `blk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    blocker_user_id: blockerId,
    blocked_user_id: blockedId,
    created_at: new Date().toISOString(),
    reason,
  };

  db.user_blocks.push(record);
  saveDatabase(db);
  return record;
}

export function unblockUser(blockerId: string, blockedId: string): boolean {
  const db = loadDatabase();
  if (!db.user_blocks) return false;

  const initLen = db.user_blocks.length;
  db.user_blocks = db.user_blocks.filter(
    (b) => !(b.blocker_user_id === blockerId && b.blocked_user_id === blockedId)
  );

  const changed = db.user_blocks.length !== initLen;
  if (changed) {
    saveDatabase(db);
  }
  return changed;
}

export function isUserBlocked(userA: string, userB: string): boolean {
  const db = loadDatabase();
  if (!db.user_blocks) return false;
  return db.user_blocks.some(
    (b) =>
      (b.blocker_user_id === userA && b.blocked_user_id === userB) ||
      (b.blocker_user_id === userB && b.blocked_user_id === userA)
  );
}

export function getBlockedUsers(userId: string): string[] {
  const db = loadDatabase();
  if (!db.user_blocks) return [];
  return db.user_blocks
    .filter((b) => b.blocker_user_id === userId)
    .map((b) => b.blocked_user_id);
}

export function reportChatMessage(params: {
  reporter_id: string;
  reported_id: string;
  conversation_id: string;
  message_id?: string;
  reason: 'spam' | 'harassment' | 'fraud' | 'inappropriate' | 'other';
  notes?: string;
}): ChatReportRecord {
  const db = loadDatabase();
  if (!db.chat_reports) db.chat_reports = [];

  const record: ChatReportRecord = {
    id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    reporter_user_id: params.reporter_id,
    reported_user_id: params.reported_id,
    conversation_id: params.conversation_id,
    message_id: params.message_id,
    reason: params.reason,
    notes: params.notes,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  db.chat_reports.push(record);
  saveDatabase(db);
  return record;
}

export function getChatReports(status?: string): ChatReportRecord[] {
  const db = loadDatabase();
  if (!db.chat_reports) return [];
  if (status) {
    return db.chat_reports.filter((r) => r.status === status);
  }
  return db.chat_reports;
}

export function getTotalUnreadChatCount(userId: string): number {
  const db = loadDatabase();
  let total = 0;
  for (const c of db.conversations) {
    if (c.participant_ids.includes(userId)) {
      total += c.unread_counts?.[userId] || 0;
    }
  }
  return total;
}

export function searchChatUsers(
  query: string,
  currentUserId: string
): Array<{
  id: string;
  full_name: string;
  role: UserRole;
  phone_number?: string;
  email?: string;
  avatar_url?: string;
  is_online?: boolean;
}> {
  const db = loadDatabase();
  const q = (query || '').toLowerCase().trim();

  // Collect known users from VERIFIED_USERS and conversation participants
  const userMap = new Map<
    string,
    {
      id: string;
      full_name: string;
      role: UserRole;
      phone_number?: string;
      email?: string;
      avatar_url?: string;
      is_online?: boolean;
    }
  >();

  // Add from VERIFIED_USERS
  for (const u of VERIFIED_USERS) {
    if (u.id !== currentUserId) {
      const presence = db.user_presence?.[u.id];
      userMap.set(u.id, {
        id: u.id,
        full_name: u.full_name,
        role: u.role as UserRole,
        phone_number: u.phone_number,
        email: u.email,
        avatar_url: (u.profile as any)?.profile_photo_url || undefined,
        is_online: presence?.is_online ?? false,
      });
    }
  }

  // Add / overlay from known conversation participants
  for (const c of db.conversations) {
    for (const p of c.participants) {
      if (p.user_id !== currentUserId) {
        const existing = userMap.get(p.user_id);
        const presence = db.user_presence?.[p.user_id];
        userMap.set(p.user_id, {
          id: p.user_id,
          full_name: p.name || existing?.full_name || 'Pilot User',
          role: (p.role || existing?.role || 'customer') as UserRole,
          phone_number: p.phone_number || existing?.phone_number,
          email: existing?.email,
          avatar_url: p.avatar_url || existing?.avatar_url,
          is_online: presence?.is_online ?? existing?.is_online ?? false,
        });
      }
    }
  }

  const allUsers = Array.from(userMap.values());

  if (!q) return allUsers;

  return allUsers.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone_number?.includes(q) ||
      u.role?.toLowerCase().includes(q)
  );
}

