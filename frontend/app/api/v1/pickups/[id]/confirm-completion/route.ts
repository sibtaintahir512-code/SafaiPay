import { NextRequest, NextResponse } from 'next/server';
import { updateJobStatus } from '@/lib/db';
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
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const decoded = token ? verifyJwt(token) : null;
    const collectorId = decoded?.sub || decoded?.id || 'usr_guest_coll';
    const collectorName = decoded?.full_name || decoded?.name || 'Tariq Mehmood';

    const pickup = findOrCreatePickup(pickupId, collectorId);

    // Prerequisite 1: Photo proof must exist
    const hasPhoto = Boolean(pickup.scale_photo_url || (pickup.images && pickup.images.length > 0));
    if (!hasPhoto) {
      return NextResponse.json(
        { detail: 'Cannot complete settlement: Missing physical photo proof.' },
        { status: 400 }
      );
    }

    // Prerequisite 2: Must have verified weight calculation
    const verifiedCalc = pickup.pricing_calculations?.find((c) => !c.is_estimated) || pickup.pricing_calculations?.[0];
    if (!verifiedCalc || verifiedCalc.verified_weight_kg <= 0) {
      return NextResponse.json(
        { detail: 'Cannot complete settlement: Scale weight must be verified first.' },
        { status: 400 }
      );
    }

    // Idempotent execution: If already completed or settled, return existing settlement
    if ((pickup.status === 'completed' || pickup.status === 'picked_up') && pickup.payment?.status === 'completed') {
      return NextResponse.json(
        {
          ...pickup,
          status: 'completed',
          settlement: {
            verified_weight_kg: verifiedCalc?.verified_weight_kg || pickup.verified_weight_kg,
            total_payout_pkr: pickup.payout_pkr || pickup.payment?.amount_pkr,
            transaction_ref: pickup.payment?.transaction_reference,
            completed_at: pickup.updated_at || new Date().toISOString(),
          },
          already_completed: true,
          message: 'Pickup settlement was already completed previously.',
        },
        { status: 200 }
      );
    }

    const finalPayout = verifiedCalc.total_price;
    const payment = {
      id: `pay-${pickupId}`,
      amount_pkr: finalPayout,
      transaction_reference: `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${pickupId.slice(-6).toUpperCase()}`,
      status: 'completed' as const,
      retry_count: 0,
    };

    const updated = updateJobStatus(
      pickupId,
      'completed',
      { user_id: collectorId, user_role: 'collector', user_name: collectorName },
      {
        status: 'completed',
        payment,
        payout_pkr: finalPayout,
      },
      `Collector confirmed collection and settled payout PKR ${finalPayout} (Ref: ${payment.transaction_reference})`
    );

    const settlement = {
      verified_weight_kg: verifiedCalc.verified_weight_kg,
      total_payout_pkr: finalPayout,
      transaction_ref: payment.transaction_reference,
      completed_at: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        ...updated,
        settlement,
        message: 'Pickup settlement finalized successfully.',
        payout_pkr: finalPayout,
        transaction_reference: payment.transaction_reference,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || 'Failed to finalize settlement.' },
      { status: 500 }
    );
  }
}
