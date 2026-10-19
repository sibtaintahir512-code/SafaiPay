import { NextResponse } from 'next/server';
import { INITIAL_PICKUPS } from '@/lib/mockData';

export async function GET() {
  return NextResponse.json(INITIAL_PICKUPS);
}
