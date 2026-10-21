import { NextRequest, NextResponse } from 'next/server';
import { updatePickup, findOrCreatePickup } from '@/lib/pickupStore';
import { INITIAL_MATERIAL_RATES } from '@/lib/mockData';

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

    // Enforce prerequisite: Photo proof must exist before verifying weight
    const hasPhoto = Boolean(pickup.scale_photo_url || (pickup.images && pickup.images.length > 0));
    if (!hasPhoto) {
      return NextResponse.json(
        { detail: 'Prerequisite failed: You must upload on-site photo proof before submitting verified scale weight.' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const rawWeight = body.verified_weight_kg;

    // Strict validation: Reject zero, negative, NaN, or non-finite numbers
    if (typeof rawWeight !== 'number' || isNaN(rawWeight) || !isFinite(rawWeight)) {
      return NextResponse.json({ detail: 'Verified weight must be a valid numeric value.' }, { status: 400 });
    }

    if (rawWeight <= 0) {
      return NextResponse.json({ detail: 'Verified scale weight must be strictly greater than 0 kg.' }, { status: 400 });
    }

    if (rawWeight > 2500) {
      return NextResponse.json({ detail: 'Unrealistic load: Single collection cannot exceed 2500 kg.' }, { status: 400 });
    }

    const rawQuality = Number(body.quality_factor);
    const qualityFactor = !isNaN(rawQuality) && rawQuality >= 0.5 && rawQuality <= 1.0 ? rawQuality : 1.0;
    const qualityGrade = body.quality_grade || (qualityFactor >= 0.95 ? 'A' : qualityFactor >= 0.8 ? 'B' : 'C');

    // Resolve material rate
    const rateItem = INITIAL_MATERIAL_RATES.find((r) => r.code === pickup.material_code) || INITIAL_MATERIAL_RATES[0];
    const unitRate = rateItem ? rateItem.benchmark_rate_pkr : 80;
    const totalPrice = Number((rawWeight * unitRate * qualityFactor).toFixed(2));

    const calculation = {
      id: `calc-${Date.now()}`,
      material_code: pickup.material_code,
      verified_weight_kg: rawWeight,
      material_rate_applied: unitRate,
      quality_factor: qualityFactor,
      total_price: totalPrice,
      calculation_breakdown: `${rawWeight} kg * PKR ${unitRate.toFixed(2)}/kg * Q(${qualityFactor.toFixed(2)}) = PKR ${totalPrice.toFixed(2)}`,
      is_estimated: false,
    };

    const updated = updatePickup(pickupId, {
      status: 'weight_verified',
      scale_photo_url: body.scale_photo_url || pickup.scale_photo_url,
      pricing_calculations: [calculation],
    });

    return NextResponse.json(
      {
        ...updated,
        verified_weight: rawWeight,
        quality_grade: qualityGrade,
        quality_factor: qualityFactor,
        payout_pkr: totalPrice,
        message: 'Scale weight verified and logged to SafaiPay ledger.',
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || 'Failed to verify scale weight.' },
      { status: 500 }
    );
  }
}
