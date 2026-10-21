import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/serverAuth';

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req, { allowedRoles: ['admin'], disallowGuests: true });
  if (auth.error) {
    return NextResponse.json({ detail: auth.error.detail }, { status: auth.error.status });
  }

  return NextResponse.json([
    { id: 'usr-coll-001', full_name: 'Muhammad Rafiq', roles: ['COLLECTOR'], phone_number: '+923002220001' },
    { id: 'usr-coll-002', full_name: 'Tariq Mehmood', roles: ['COLLECTOR'], phone_number: '+923002220002' },
    { id: 'usr-coll-003', full_name: 'Abdul Sattar', roles: ['COLLECTOR'], phone_number: '+923002220003' },
  ]);
}
