import { NextRequest, NextResponse } from 'next/server';

let DEMANDS_STORE = [
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
  },
  {
    id: 'dem-002',
    recycler_id: 'usr-rec-002',
    recycler_name: 'Pak Board & Paper Mills',
    material_type: 'cardboard',
    required_quantity_kg: 10000.0,
    minimum_quality: 'Tier A',
    location: 'SITE Area, Karachi',
    offered_price_per_kg: 42.0,
    total_budget_pkr: 420000.0,
    deadline: '2026-11-20T18:00:00Z',
    status: 'OPEN',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    offers_count: 1
  }
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const material = searchParams.get('material');

  let filtered = DEMANDS_STORE;
  if (status) filtered = filtered.filter((d) => d.status.toUpperCase() === status.toUpperCase());
  if (material) filtered = filtered.filter((d) => d.material_type.toLowerCase().includes(material.toLowerCase()));

  return NextResponse.json(filtered);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newDemand = {
      id: 'dem-' + Math.random().toString(36).substring(2, 9),
      recycler_id: 'usr-rec-001',
      recycler_name: 'Indus Polymer Industries Ltd',
      material_type: body.material_type || 'PET plastic',
      required_quantity_kg: Number(body.required_quantity_kg) || 1000.0,
      minimum_quality: body.minimum_quality || 'Tier A',
      location: body.location || 'Karachi Industrial Hub',
      offered_price_per_kg: Number(body.offered_price_per_kg) || 80.0,
      total_budget_pkr: (Number(body.required_quantity_kg) || 1000) * (Number(body.offered_price_per_kg) || 80),
      deadline: body.deadline || new Date(Date.now() + 7 * 86400000).toISOString(),
      status: 'OPEN',
      created_at: new Date().toISOString(),
      offers_count: 0
    };
    DEMANDS_STORE = [newDemand, ...DEMANDS_STORE];
    return NextResponse.json(newDemand, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Invalid demand payload.' }, { status: 400 });
  }
}
