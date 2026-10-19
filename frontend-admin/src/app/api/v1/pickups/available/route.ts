import { NextResponse } from 'next/server';
import { INITIAL_PICKUPS } from '@/lib/mockData';

export async function GET() {
  const available = INITIAL_PICKUPS.filter(
    p => p.status === 'requested' || p.status === 'assigned' || p.status === 'accepted' || p.status === 'in_progress' || p.status === 'weight_verified'
  );
  return NextResponse.json(available);
}
