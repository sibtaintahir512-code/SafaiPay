import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_PICKUPS } from '@/lib/mockData';
import { PickupRequest } from '@/lib/types';
import { verifyJwt } from '@/lib/serverAuth';

// In-memory pickup store for runtime updates across serverless invocations
let activePickups: PickupRequest[] = [...INITIAL_PICKUPS];

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pickupId = params.id;
    if (!pickupId) {
      return NextResponse.json({ detail: 'Pickup ID is required.' }, { status: 400 });
    }

    // Resolve authenticated collector from JWT Bearer token
    const authHeader = req.headers.get('authorization') || '';
    let collectorId = 'usr_guest_coll';
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      const payload = verifyJwt(token);
      if (payload && payload.sub) {
        collectorId = payload.sub;
      }
    }

    // Locate target pickup in store
    let target = activePickups.find(p => p.id === pickupId);

    // If not found in current list, create or resolve it from known jobs
    if (!target) {
      target = {
        id: pickupId,
        tracking_number: `SP-2026-${pickupId.slice(-6).toUpperCase()}`,
        customer_id: 'usr_guest_cust',
        assigned_collector_id: collectorId,
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
            id: `calc-${pickupId}`,
            material_code: 'PET_PLASTIC',
            verified_weight_kg: 15,
            material_rate_applied: 80,
            quality_factor: 1.0,
            total_price: 1200,
            calculation_breakdown: '15 kg * 80 PKR/kg',
            is_estimated: true,
          },
        ],
      };
      activePickups.unshift(target);
    } else {
      // Apply accepted state transition
      target.status = 'accepted';
      target.assigned_collector_id = collectorId;
    }

    return NextResponse.json(target, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || 'Failed to accept pickup job.' },
      { status: 500 }
    );
  }
}
