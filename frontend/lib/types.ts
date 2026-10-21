export type UserRole = 'customer' | 'collector' | 'recycler' | 'admin';

export interface User {
  id: string;
  phone_number: string;
  email?: string | null;
  full_name: string;
  role: UserRole | 'unknown';
  roles: string[];
  is_active: boolean;
  is_phone_verified: boolean;
  created_at: string;
  updated_at?: string;
  profile_photo_url?: string | null;
  profile?: any;
  customer_profile?: any;
  collector_profile?: any;
  recycler_profile?: any;
  admin_profile?: any;
}

export interface MaterialRate {
  id: string;
  code: string;
  name: string;
  unit: string;
  description?: string;
  benchmark_rate_pkr: number;
  tier_a_factor: number;
  tier_b_factor: number;
  tier_c_factor: number;
  is_active: boolean;
}

export interface PricingCalculation {
  id: string;
  material_code: string;
  verified_weight_kg: number;
  material_rate_applied: number;
  quality_factor: number;
  total_price: number;
  calculation_breakdown: string;
  is_estimated: boolean;
}

export interface WasteImage {
  id: string;
  image_type: string;
  image_url: string;
  caption?: string;
}

export interface PaymentRecord {
  id: string;
  amount_pkr: number;
  transaction_reference: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'disputed';
  failure_reason?: string;
  retry_count: number;
}

export interface PickupRequest {
  id: string;
  tracking_number: string;
  customer_id: string;
  assigned_collector_id?: string | null;
  material_code: string;
  estimated_quantity_kg: number;
  street_address: string;
  city: string;
  preferred_time?: string;
  notes?: string;
  status: string;
  created_at: string;
  pricing_calculations: PricingCalculation[];
  images?: WasteImage[];
  payment?: PaymentRecord | null;
  scale_photo_url?: string | null;
}

export interface CollectorEarningsSummary {
  today_earnings_pkr: number;
  week_earnings_pkr: number;
  month_earnings_pkr: number;
  completed_jobs_count: number;
  total_verified_kg: number;
}
