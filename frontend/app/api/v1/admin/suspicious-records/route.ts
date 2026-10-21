import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/serverAuth';

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req, { allowedRoles: ['admin'], disallowGuests: true });
  if (auth.error) {
    return NextResponse.json({ detail: auth.error.detail }, { status: auth.error.status });
  }

  return NextResponse.json({
    count: 2,
    records: [
      {
        pickup_id: 'sp-req-001',
        tracking_number: 'SP-202610-A91B2C',
        estimated_kg: 10,
        verified_kg: 48.5,
        variance_percentage: 385,
        quality_factor: 1.0,
        status: 'weight_verified',
        flag: 'High weight variance',
      },
      {
        pickup_id: 'sp-req-002',
        tracking_number: 'SP-202610-C34D5E',
        estimated_kg: 28,
        verified_kg: 12.0,
        variance_percentage: 57,
        quality_factor: 0.7,
        status: 'disputed',
        flag: 'Quality degradation',
      },
    ],
  });
}
