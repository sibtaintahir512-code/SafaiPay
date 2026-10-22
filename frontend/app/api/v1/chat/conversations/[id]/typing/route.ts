import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/serverAuth';
import { setTypingStatus, getConversationById } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = authenticateRequest(req);
  if (error || !session) {
    return NextResponse.json({ detail: error?.detail || 'Unauthorized' }, { status: error?.status || 401 });
  }

  const conv = getConversationById(params.id);
  if (!conv || !conv.participant_ids.includes(session.user.id)) {
    return NextResponse.json({ detail: 'Conversation not found or access denied.' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const isTyping = Boolean(body.is_typing);
    setTypingStatus(params.id, session.user.id, session.user.full_name, isTyping);
    return NextResponse.json({ ok: true, is_typing: isTyping });
  } catch {
    return NextResponse.json({ detail: 'Invalid request body.' }, { status: 400 });
  }
}
