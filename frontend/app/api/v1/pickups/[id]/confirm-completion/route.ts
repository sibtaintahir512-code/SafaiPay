import { NextRequest, NextResponse } from 'next/server';
import { updatePickup, findOrCreatePickup } from '@/lib/pickupStore';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pickupId = params.id;
    if (!pickupId) {
      return NextResponse.json({ detail: 'Pickup ID is required.' }, { status: 400 });
    }

    const pickup = findOrCreatePickup(pickupId);

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

    // Idempotent execution: If already completed, return existing settlement without double payment
    if (pickup.status === 'completed' && pickup.payment?.status === 'completed') {
      return NextResponse.json(
        {
          ...pickup,
          already_completed: true,
          message: 'Pickup settlement was already completed previously.',
        },
        { status: 200 }
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Optional body
    }

    const finalPayout = verifiedCalc.total_price;
    const payment = {
      id: `pay-${pickupId}`,
      amount_pkr: finalPayout,
      transaction_reference: `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${pickupId.slice(-6).toUpperCase()}`,
      status: 'completed' as const,
      retry_count: 0,
    };

    const updated = updatePickup(pickupId, {
      status: 'completed',
      payment,
      notes: `${pickup.notes || ''} [Settlement completed: Rs ${finalPayout} disbursed]`.trim(),
    });

    return NextResponse.json(
      {
        ...updated,
        settlement: {
          verified_weight_kg: verifiedCalc.verified_weight_kg,
          rate_applied: verifiedCalc.material_rate_applied,
          quality_factor: verifiedCalc.quality_factor,
          total_payout_pkr: finalPayout,
          transaction_ref: payment.transaction_reference,
          completed_at: new Date().toISOString(),
        },
        message: 'Settlement finalized and disbursed to verified wallet.',
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || 'Failed to confirm pickup completion.' },
      { status: 500 }
    );
  }
}
