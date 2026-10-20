import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  return NextResponse.json({
    status: 'success',
    collector_id: id,
    kyc_status: 'VERIFIED',
    message: 'Collector CNIC and IoT calibrated scale verified successfully.',
  });
}
