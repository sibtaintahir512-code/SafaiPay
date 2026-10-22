import { NextRequest, NextResponse } from 'next/server';
import { getJobById, updateJobStatus } from '@/lib/db';
import { verifyJwt } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pickupId = params.id;
    if (!pickupId) {
      return NextResponse.json({ detail: 'Pickup ID is required.' }, { status: 400 });
    }

    const item = getJobById(pickupId);
    if (!item) {
      return NextResponse.json({ detail: `Pickup job ${pickupId} not found.` }, { status: 404 });
    }

    return NextResponse.json(item, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Pickup not found.' }, { status: 404 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pickupId = params.id;
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const decoded = token ? verifyJwt(token) : null;

    const body = await req.json();
    const item = getJobById(pickupId);
    if (!item) {
      return NextResponse.json({ detail: `Pickup job ${pickupId} not found.` }, { status: 404 });
    }

    const statusToSet = body.status || item.status;
    const actor = {
      user_id: decoded?.sub || decoded?.id || 'usr_system',
      user_role: decoded?.role || 'system',
      user_name: decoded?.full_name || decoded?.name,
    };

    const updated = updateJobStatus(pickupId, statusToSet, actor, body, body.note);
    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Failed to update job' }, { status: 400 });
  }
}
