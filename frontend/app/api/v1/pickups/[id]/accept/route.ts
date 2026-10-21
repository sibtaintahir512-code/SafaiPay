import { NextRequest, NextResponse } from 'next/server';
import { updatePickup, findOrCreatePickup } from '@/lib/pickupStore';
import { verifyJwt } from '@/lib/serverAuth';

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

    const item = updatePickup(pickupId, {
      status: 'accepted',
      assigned_collector_id: collectorId,
    });

    return NextResponse.json(item, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || 'Failed to accept pickup job.' },
      { status: 500 }
    );
  }
}
