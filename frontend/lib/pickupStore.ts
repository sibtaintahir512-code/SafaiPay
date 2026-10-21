import { INITIAL_PICKUPS } from './mockData';
import { PickupRequest } from './types';

// In-memory pickup store for runtime persistence across Next.js API route handlers
const globalStore = global as unknown as { __safaipay_pickups__?: PickupRequest[] };

if (!globalStore.__safaipay_pickups__) {
  globalStore.__safaipay_pickups__ = JSON.parse(JSON.stringify(INITIAL_PICKUPS));
}

export function getAllPickups(): PickupRequest[] {
  return globalStore.__safaipay_pickups__ || [];
}

export function getPickupById(id: string): PickupRequest | undefined {
  return getAllPickups().find((p) => p.id === id);
}

export function findOrCreatePickup(id: string, defaultCollectorId = 'usr_guest_coll'): PickupRequest {
  let item = getPickupById(id);
  if (!item) {
    item = {
      id,
      tracking_number: `SP-2026-${id.slice(-6).toUpperCase()}`,
      customer_id: 'usr_guest_cust',
      assigned_collector_id: defaultCollectorId,
      material_code: 'PET_PLASTIC',
      estimated_quantity_kg: 15,
      street_address: 'House 14-C, 7th Commercial St, Phase 2, DHA, Karachi',
      city: 'Karachi',
      preferred_time: 'Within 45 mins',
      notes: 'Doorstep recyclable collection accepted by collector',
      status: 'accepted',
      created_at: new Date().toISOString(),
      pricing_calculations: [
        {
          id: `calc-${id}`,
          material_code: 'PET_PLASTIC',
          verified_weight_kg: 15,
          material_rate_applied: 80,
          quality_factor: 1.0,
          total_price: 1200,
          calculation_breakdown: '15 kg * 80 PKR/kg',
          is_estimated: true,
        },
      ],
      images: [],
    };
    globalStore.__safaipay_pickups__!.unshift(item);
  }
  return item;
}

export function updatePickup(id: string, updates: Partial<PickupRequest>): PickupRequest {
  const item = findOrCreatePickup(id);
  Object.assign(item, updates);
  return item;
}
