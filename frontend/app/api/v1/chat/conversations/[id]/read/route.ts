import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/serverAuth';
import { markConversationAsRead, getConversationById } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = authenticateRequest(req);
  if (error || !session) {
    return NextResponse.json({ detail: error?.detail || 'Unauthorized' }, { status: error?.status || 401 });
  }

  const conv = getConversationById(params.id);
  if (!conv) {
    return NextResponse.json({ detail: 'Conversation not found.' }, { status: 404 });
  }

  if (!conv.participant_ids.includes(session.user.id)) {
    return NextResponse.json({ detail: 'Access denied: You are not a participant in this conversation.' }, { status: 403 });
  }

  let messageId: string | undefined = undefined;
  try {
    const body = await req.json();
    messageId = body.message_id;
  } catch {}

  const result = markConversationAsRead(params.id, session.user.id, messageId);
  return NextResponse.json(result);
}
