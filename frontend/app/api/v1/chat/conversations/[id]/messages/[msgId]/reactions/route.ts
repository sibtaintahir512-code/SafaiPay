import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/serverAuth';
import { toggleMessageReaction, getMessageById } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; msgId: string } }
) {
  const { session, error } = authenticateRequest(req);
  if (error || !session) {
    return NextResponse.json({ detail: error?.detail || 'Unauthorized' }, { status: error?.status || 401 });
  }

  const existing = getMessageById(params.msgId);
  if (!existing || existing.conversation_id !== params.id) {
    return NextResponse.json({ detail: 'Message not found in this conversation.' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const emoji = (body.emoji || '').trim();
    if (!emoji) {
      return NextResponse.json({ detail: 'Emoji is required.' }, { status: 400 });
    }

    const updated = toggleMessageReaction(params.msgId, session.user.id, emoji);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Failed to toggle reaction.' }, { status: 400 });
  }
}
