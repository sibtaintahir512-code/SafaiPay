import { NextRequest, NextResponse } from 'next/server';
import { getAllJobs, getJobsForUser, createJob } from '@/lib/db';
import { verifyJwt } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const decoded = token ? verifyJwt(token) : null;

  const { searchParams } = new URL(req.url);
  const queryRole = searchParams.get('role');

  if (decoded) {
    const role = queryRole || decoded.role;
    const userId = decoded.sub || decoded.id;
    const jobs = getJobsForUser({ id: userId, role });
    return NextResponse.json(jobs);
  }

  if (queryRole) {
    const defaultUserId = queryRole === 'collector' ? 'usr_guest_coll' : queryRole === 'recycler' ? 'usr_guest_recy' : 'usr_guest_cust';
    const jobs = getJobsForUser({ id: defaultUserId, role: queryRole });
    return NextResponse.json(jobs);
  }

  return NextResponse.json(getAllJobs());
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const decoded = token ? verifyJwt(token) : null;

    const body = await req.json();

    const customerId = decoded?.sub || decoded?.id || body.customer_id || 'usr_guest_cust';
    const customerName = decoded?.full_name || decoded?.name || body.customer_name || 'Amina Khan';
    const customerPhone = decoded?.phone_number || body.customer_phone || '+92 300 1234567';

    const materialCode = body.material_code || 'PET_PLASTIC';
    const qty = Number(body.estimated_quantity_kg) || 10;
    const streetAddress = body.street_address || 'PECHS Block 6, Karachi';
    const city = body.city || 'Karachi';
    const preferredTime = body.preferred_time || 'Today';
    const notes = body.notes || 'Doorstep recyclable collection';
    const customerPhotoUrl = body.customer_photo_url || body.photo_url || undefined;

    if (qty <= 0) {
      return NextResponse.json({ detail: 'Estimated quantity must be greater than zero.' }, { status: 400 });
    }

    if (!streetAddress.trim()) {
      return NextResponse.json({ detail: 'Street address is required.' }, { status: 400 });
    }

    const newJob = createJob({
      customer_id: customerId,
      customer_name: customerName,
      customer_phone: customerPhone,
      material_code: materialCode,
      estimated_quantity_kg: qty,
      street_address: streetAddress,
      city,
      preferred_time: preferredTime,
      notes,
      customer_photo_url: customerPhotoUrl,
    });

    return NextResponse.json(newJob, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Invalid pickup creation payload' }, { status: 400 });
  }
}
