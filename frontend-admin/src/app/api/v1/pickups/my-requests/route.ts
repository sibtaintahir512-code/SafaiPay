import { NextResponse } from 'next/server';
import { INITIAL_PICKUPS } from '@/lib/mockData';

export async function GET() {
  const customerPickups = INITIAL_PICKUPS.filter(p => p.customer_id === 'usr-cust-001');
  return NextResponse.json(customerPickups);
}
