import { NextRequest, NextResponse } from 'next/server';
import { getEventsSince } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const since = searchParams.get('since') || undefined;
  const role = searchParams.get('role') || undefined;
  const userId = searchParams.get('userId') || undefined;

  const events = getEventsSince(since, { role, userId });

  return NextResponse.json({
    events,
    timestamp: new Date().toISOString(),
  });
}
