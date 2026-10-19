import { NextResponse } from 'next/server';
import { INITIAL_COLLECTOR_EARNINGS } from '@/lib/mockData';

export async function GET() {
  return NextResponse.json(INITIAL_COLLECTOR_EARNINGS);
}
