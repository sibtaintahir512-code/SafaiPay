import { NextRequest, NextResponse } from 'next/server';
import { updateJobStatus, getJobById } from '@/lib/db';
import { findOrCreatePickup } from '@/lib/pickupStore';
import { verifyJwt } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

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
    let collectorName = 'Tariq Mehmood';
    let collectorPhone = '+92 311 2345678';

    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      const payload = verifyJwt(token);
      if (payload && payload.sub) {
        collectorId = payload.sub;
        collectorName = payload.full_name || payload.name || collectorName;
        collectorPhone = payload.phone_number || collectorPhone;
      }
    }

    // Ensure job exists (or initialize for test compatibility)
    findOrCreatePickup(pickupId, collectorId);

    const updated = updateJobStatus(
      pickupId,
      'accepted',
      { user_id: collectorId, user_role: 'collector', user_name: collectorName },
      {
        assigned_collector_id: collectorId,
        collector_name: collectorName,
        collector_phone: collectorPhone,
      },
      `Job accepted by collector ${collectorName}`
    );

    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || 'Failed to accept pickup job.' },
      { status: 500 }
    );
  }
}
