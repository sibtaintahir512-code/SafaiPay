import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_PICKUPS, INITIAL_MATERIAL_RATES } from '@/lib/mockData';
import { PickupRequest } from '@/lib/types';

export async function GET() {
  return NextResponse.json(INITIAL_PICKUPS);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rateItem = INITIAL_MATERIAL_RATES.find(r => r.code === body.material_code) || INITIAL_MATERIAL_RATES[0];
    const unitRate = rateItem.benchmark_rate_pkr;
    const qty = Number(body.estimated_quantity_kg) || 10;
    const estTotal = qty * unitRate;

    const newPickup: PickupRequest = {
      id: `sp-req-${Date.now().toString().slice(-6)}`,
      tracking_number: `SP-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      customer_id: 'usr-cust-001',
      assigned_collector_id: null,
      material_code: body.material_code || 'PET_PLASTIC',
      estimated_quantity_kg: qty,
      street_address: body.street_address || 'PECHS Block 6, Karachi',
      city: body.city || 'Karachi',
      preferred_time: body.preferred_time || 'Today',
      notes: body.notes || 'Doorstep recyclable collection',
      status: 'requested',
      created_at: new Date().toISOString(),
      pricing_calculations: [
        {
          id: `calc-${Date.now()}`,
          material_code: body.material_code || 'PET_PLASTIC',
          verified_weight_kg: qty,
          material_rate_applied: unitRate,
          quality_factor: 1.0,
          total_price: estTotal,
          calculation_breakdown: `${qty} kg * PKR ${unitRate.toFixed(2)}/kg * Q(1.00) (Estimated)`,
          is_estimated: true,
        },
      ],
    };

    return NextResponse.json(newPickup, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ detail: 'Invalid pickup creation payload' }, { status: 400 });
  }
}
