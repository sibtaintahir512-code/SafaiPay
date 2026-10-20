import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json([
    {
      id: 'dem-001',
      recycler_id: 'usr-rec-001',
      recycler_name: 'Indus Polymer Industries Ltd',
      material_type: 'PET plastic',
      required_quantity_kg: 5000.0,
      minimum_quality: 'Tier A',
      location: 'Korangi Industrial Area, Karachi',
      offered_price_per_kg: 85.0,
      total_budget_pkr: 425000.0,
      deadline: '2026-11-15T18:00:00Z',
      status: 'OPEN',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      offers_count: 2
    }
  ]);
}
