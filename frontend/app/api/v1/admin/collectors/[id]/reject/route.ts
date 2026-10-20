import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const { searchParams } = new URL(req.url);
  const reason = searchParams.get('reason') || 'Incomplete biometric documentation';

  return NextResponse.json({
    status: 'success',
    collector_id: id,
    kyc_status: 'REJECTED',
    reason,
  });
}
