import { PickupRequest } from './types';
import { getAllJobs, getJobById, createJob, updateJobStatus, PickupJob } from './db';

export function getAllPickups(): PickupRequest[] {
  return getAllJobs();
}

export function getPickupById(id: string): PickupRequest | undefined {
  return getJobById(id);
}

export function findOrCreatePickup(id: string, defaultCollectorId = 'usr_guest_coll'): PickupRequest {
  let item = getJobById(id);
  if (!item) {
    item = createJob({
      id,
      customer_id: 'usr_guest_cust',
      customer_name: 'Amina Khan',
      customer_phone: '+92 300 1234567',
      material_code: 'PET_PLASTIC',
      estimated_quantity_kg: 15,
      street_address: 'House 14-C, 7th Commercial St, Phase 2, DHA, Karachi',
      city: 'Karachi',
      preferred_time: 'Within 45 mins',
      notes: 'Doorstep recyclable collection accepted by collector',
    });
    item.assigned_collector_id = defaultCollectorId;
    item.collector_name = 'Tariq Mehmood';
  }
  return item;
}

export function updatePickup(id: string, updates: Partial<PickupRequest>): PickupRequest {
  const item = findOrCreatePickup(id);
  const statusToUse = updates.status || item.status;
  return updateJobStatus(id, statusToUse, { user_role: 'system' }, updates);
}
