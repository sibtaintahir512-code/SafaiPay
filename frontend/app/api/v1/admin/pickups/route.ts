import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_PICKUPS } from '@/lib/mockData';
import { authenticateRequest } from '@/lib/serverAuth';

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req, { allowedRoles: ['admin'], disallowGuests: true });
  if (auth.error) {
    return NextResponse.json({ detail: auth.error.detail }, { status: auth.error.status });
  }

  return NextResponse.json(INITIAL_PICKUPS);
}
