import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json([
    { id: 'usr-coll-001', full_name: 'Muhammad Rafiq', roles: ['COLLECTOR'], phone_number: '+923002220001' },
    { id: 'usr-coll-002', full_name: 'Tariq Mehmood', roles: ['COLLECTOR'], phone_number: '+923002220002' },
    { id: 'usr-coll-003', full_name: 'Abdul Sattar', roles: ['COLLECTOR'], phone_number: '+923002220003' },
  ]);
}
