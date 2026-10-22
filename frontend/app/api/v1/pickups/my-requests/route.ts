import { NextRequest, NextResponse } from 'next/server';
import { getJobsForUser } from '@/lib/db';
import { verifyJwt } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const decoded = token ? verifyJwt(token) : null;

  const customerId = decoded?.sub || decoded?.id || 'usr_guest_cust';
  const customerPickups = getJobsForUser({ id: customerId, role: 'customer' });

  return NextResponse.json(customerPickups);
}
