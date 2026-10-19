import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json([
    {
      id: 'disp-001',
      pickup_id: 'sp-req-002',
      reason_category: 'WEIGHT_MISMATCH',
      description: 'Customer claims scale showed different reading from final receipt.',
      status: 'OPEN',
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
  ]);
}
