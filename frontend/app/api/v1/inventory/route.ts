import { NextRequest, NextResponse } from 'next/server';

let INVENTORY_STORE = [
  {
    id: 'inv-001',
    pickup_id: 'pk-demo-001',
    collector_id: 'usr-coll-001',
    material_type: 'PET plastic',
    verified_weight_kg: 320.0,
    quality_factor: 1.0,
    quality_grade: 'Tier A',
    location: 'Korangi Aggregation Hub, Sector 15',
    status: 'AVAILABLE',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'inv-002',
    pickup_id: 'pk-demo-002',
    collector_id: 'usr-coll-002',
    material_type: 'cardboard',
    verified_weight_kg: 540.0,
    quality_factor: 0.95,
    quality_grade: 'Tier A',
    location: 'SITE Central Warehouse, Karachi',
    status: 'AVAILABLE',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: 'inv-003',
    pickup_id: 'pk-demo-003',
    collector_id: 'usr-coll-001',
    material_type: 'PET plastic',
    verified_weight_kg: 480.0,
    quality_factor: 0.9,
    quality_grade: 'Tier B',
    location: 'Port Qasim Logistics Hub',
    status: 'AVAILABLE',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const material = searchParams.get('material');

  let list = INVENTORY_STORE;
  if (status) list = list.filter((item) => item.status.toUpperCase() === status.toUpperCase());
  if (material) list = list.filter((item) => item.material_type.toLowerCase().includes(material.toLowerCase()));

  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newItem = {
      id: 'inv-' + Math.random().toString(36).substring(2, 9),
      pickup_id: body.pickup_id || null,
      collector_id: 'usr-coll-001',
      material_type: body.material_type || 'PET plastic',
      verified_weight_kg: Number(body.verified_weight_kg) || 50.0,
      quality_factor: Number(body.quality_factor) || 1.0,
      quality_grade: body.quality_grade || 'Tier A',
      location: body.location || 'Karachi Aggregation Hub',
      status: 'AVAILABLE',
      created_at: new Date().toISOString()
    };
    INVENTORY_STORE = [newItem, ...INVENTORY_STORE];
    return NextResponse.json(newItem, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Invalid inventory item.' }, { status: 400 });
  }
}
