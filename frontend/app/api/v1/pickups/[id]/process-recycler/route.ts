import { NextRequest, NextResponse } from 'next/server';
import { updateJobStatus, attachJobImage, getJobById } from '@/lib/db';
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
    const recyclerId = decoded?.sub || decoded?.id || 'usr_guest_recy';
    const recyclerName = decoded?.full_name || decoded?.name || 'GreenCycle Processing Hub 4';

    const body = await req.json();
    const action = body.action || 'complete'; // 'start_processing' | 'complete'
    const recycledWeight = Number(body.recycled_weight_kg) || undefined;
    const notes = body.notes || body.recycler_notes || 'Washed, sorted, and granulated for manufacturing re-use.';
    const proofUrl = body.proof_url || body.recycler_photo_url || undefined;

    const job = getJobById(pickupId);
    if (!job) {
      return NextResponse.json({ detail: 'Job not found.' }, { status: 404 });
    }

    if (proofUrl) {
      attachJobImage(
        pickupId,
        {
          id: `img-recy-${Date.now()}`,
          image_type: 'recycler_proof',
          image_url: proofUrl,
          caption: `Recycler processing proof: ${notes}`,
        },
        { user_id: recyclerId, user_role: 'recycler' }
      );
    }

    const targetStatus = action === 'start_processing' ? 'processing' : 'completed';

    const updated = updateJobStatus(
      pickupId,
      targetStatus,
      { user_id: recyclerId, user_role: 'recycler', user_name: recyclerName },
      {
        recycled_weight_kg: recycledWeight || job.verified_weight_kg || job.estimated_quantity_kg,
        recycler_notes: notes,
        assigned_recycler_id: recyclerId,
        recycler_name: recyclerName,
      },
      action === 'start_processing'
        ? `Recycler started mechanical processing & sorting`
        : `Recycling certified completed: ${recycledWeight || job.verified_weight_kg || job.estimated_quantity_kg} kg yield`
    );

    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Failed to process recycling job.' }, { status: 400 });
  }
}
