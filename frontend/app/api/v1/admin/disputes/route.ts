import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/serverAuth';

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req, { allowedRoles: ['admin'], disallowGuests: true });
  if (auth.error) {
    return NextResponse.json({ detail: auth.error.detail }, { status: auth.error.status });
  }

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
