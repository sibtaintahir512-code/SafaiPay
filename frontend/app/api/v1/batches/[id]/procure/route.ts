import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  return NextResponse.json({
    id,
    batch_code: `BATCH-${id.toUpperCase()}`,
    status: 'PROCURED',
    procured_at: new Date().toISOString(),
    message: 'Purchase order placed successfully. Dispatch manifest scheduled.',
  });
}
