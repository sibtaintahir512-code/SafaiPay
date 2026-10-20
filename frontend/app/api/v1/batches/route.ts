import { NextRequest, NextResponse } from 'next/server';

const MOCK_BATCHES = [
  {
    id: 'b-901',
    batch_code: 'BATCH-PET-2026-041',
    material_code: 'PET_PLASTIC',
    net_weight_kg: 12500.0,
    purity_percentage: 99.1,
    status: 'AVAILABLE',
    hub_location: 'Korangi Industrial Area Hub, Karachi',
  },
  {
    id: 'b-902',
    batch_code: 'BATCH-OCC-2026-088',
    material_code: 'CARDBOARD_OCC',
    net_weight_kg: 24000.0,
    purity_percentage: 98.4,
    status: 'AVAILABLE',
    hub_location: 'SITE Area Central Hub, Karachi',
  },
  {
    id: 'b-903',
    batch_code: 'BATCH-HDPE-2026-019',
    material_code: 'HDPE_PLASTIC',
    net_weight_kg: 8200.0,
    purity_percentage: 99.4,
    status: 'AVAILABLE',
    hub_location: 'Port Qasim Logistics Hub, Karachi',
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get('status');
  const materialCode = searchParams.get('material_code');

  let list = MOCK_BATCHES;
  if (statusFilter) list = list.filter((b) => b.status === statusFilter);
  if (materialCode) list = list.filter((b) => b.material_code === materialCode);

  return NextResponse.json(list);
}
