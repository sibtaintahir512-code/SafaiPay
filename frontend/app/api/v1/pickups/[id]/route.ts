import { NextRequest, NextResponse } from 'next/server';
import { findOrCreatePickup } from '@/lib/pickupStore';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pickupId = params.id;
    if (!pickupId) {
      return NextResponse.json({ detail: 'Pickup ID is required.' }, { status: 400 });
    }

    const item = findOrCreatePickup(pickupId);
    return NextResponse.json(item, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Pickup not found.' }, { status: 404 });
  }
}
