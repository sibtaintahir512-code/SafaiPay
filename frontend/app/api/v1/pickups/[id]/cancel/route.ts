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
    const actorId = decoded?.sub || decoded?.id || 'usr_guest_cust';
    const actorRole = decoded?.role || 'customer';

    const job = getJobById(pickupId);
    if (!job) {
      return NextResponse.json({ detail: 'Job not found.' }, { status: 404 });
    }

    if (!['pending', 'available', 'requested'].includes(job.status)) {
      return NextResponse.json(
        { detail: `Cannot cancel job in '${job.status}' status. Only pending or available requests can be cancelled.` },
        { status: 400 }
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const reason = body.reason || 'Cancelled by customer';

    const updated = updateJobStatus(
      pickupId,
      'cancelled',
      { user_id: actorId, user_role: actorRole },
      { cancellation_reason: reason } as any,
      `Job cancelled: ${reason}`
    );

    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Failed to cancel job.' }, { status: 400 });
  }
}
