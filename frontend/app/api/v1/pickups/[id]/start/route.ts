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

    const authHeader = req.headers.get('authorization') || '';
    let collectorId = 'usr_guest_coll';
    let collectorName = 'Tariq Mehmood';

    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      const payload = verifyJwt(token);
      if (payload && payload.sub) {
        collectorId = payload.sub;
        collectorName = payload.full_name || payload.name || collectorName;
      }
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body is optional
    }

    const lat = body.gps_latitude ?? 24.8607;
    const lng = body.gps_longitude ?? 67.0011;

    const current = findOrCreatePickup(pickupId, collectorId);

    // Validate collector authorization if assigned
    if (current.assigned_collector_id && current.assigned_collector_id !== collectorId && !collectorId.includes('admin')) {
      if (!collectorId.includes('guest') || !current.assigned_collector_id.includes('guest')) {
        return NextResponse.json({ detail: 'You are not the assigned collector for this pickup.' }, { status: 403 });
      }
    }

    const updated = updateJobStatus(
      pickupId,
      'in_progress',
      { user_id: collectorId, user_role: 'collector', user_name: collectorName },
      {
        assigned_collector_id: current.assigned_collector_id || collectorId,
        notes: `${current.notes || ''} [Trip started at lat:${lat}, lng:${lng}]`.trim(),
      },
      `Collector started trip towards customer location [lat:${lat}, lng:${lng}]`
    );

    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || 'Failed to start pickup trip.' },
      { status: 500 }
    );
  }
}
