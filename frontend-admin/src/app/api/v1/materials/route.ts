import { NextResponse } from 'next/server';
import { INITIAL_MATERIAL_RATES } from '@/lib/mockData';

export async function GET() {
  return NextResponse.json(INITIAL_MATERIAL_RATES);
}
