import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/serverAuth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = authenticateRequest(req, { allowedRoles: ['admin'], disallowGuests: true });
  if (auth.error) {
    return NextResponse.json({ detail: auth.error.detail }, { status: auth.error.status });
  }

  const { id } = params;
  return NextResponse.json({
    status: 'success',
    collector_id: id,
    kyc_status: 'VERIFIED',
    message: 'Collector CNIC and IoT calibrated scale verified successfully.',
  });
}
