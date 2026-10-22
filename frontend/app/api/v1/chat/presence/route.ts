import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/serverAuth';
import { setUserPresence, getAllUsersPresence } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const presenceMap = getAllUsersPresence();
  return NextResponse.json(presenceMap);
}

export async function POST(req: NextRequest) {
  const { session, error } = authenticateRequest(req);
  if (error || !session) {
    return NextResponse.json({ detail: error?.detail || 'Unauthorized' }, { status: error?.status || 401 });
  }

  try {
    const body = await req.json();
    const isOnline = body.is_online !== undefined ? Boolean(body.is_online) : true;
    const convId = body.conversation_id || undefined;

    const record = setUserPresence(session.user.id, isOnline, convId);
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ detail: 'Invalid request body.' }, { status: 400 });
  }
}
