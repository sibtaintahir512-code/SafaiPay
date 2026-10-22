import { NextRequest, NextResponse } from 'next/server';
import { updateJobStatus, getJobById } from '@/lib/db';
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
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const decoded = token ? verifyJwt(token) : null;
    const actorId = decoded?.sub || decoded?.id || 'usr_guest_coll';
    const actorName = decoded?.full_name || decoded?.name || 'Tariq Mehmood';

    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const recyclerId = body.recycler_id || 'usr_guest_recy';
    const recyclerName = body.recycler_name || 'GreenCycle Processing Hub 4';

    const updated = updateJobStatus(
      pickupId,
      'delivered_to_recycler',
      { user_id: actorId, user_role: decoded?.role || 'collector', user_name: actorName },
      {
        assigned_recycler_id: recyclerId,
        recycler_name: recyclerName,
      },
      `Batch delivered to recycling facility ${recyclerName}`
    );

    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Failed to deliver to recycler.' }, { status: 400 });
  }
}
