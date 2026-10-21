import { NextResponse } from 'next/server';
import { getAllPickups } from '@/lib/pickupStore';

export async function GET() {
  const available = getAllPickups().filter(
    p => p.status === 'requested' || p.status === 'assigned' || p.status === 'accepted' || p.status === 'in_progress' || p.status === 'weight_verified'
  );
  return NextResponse.json(available);
}
