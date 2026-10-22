import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/serverAuth';
import { getConversationById, updateConversationSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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

  return NextResponse.json(conv);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = authenticateRequest(req);
  if (error || !session) {
    return NextResponse.json({ detail: error?.detail || 'Unauthorized' }, { status: error?.status || 401 });
  }

  try {
    const body = await req.json();
    const updated = updateConversationSettings(params.id, session.user.id, {
      title: body.title,
      isPinned: body.is_pinned !== undefined ? Boolean(body.is_pinned) : undefined,
      muteSetting: body.mute_setting,
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Failed to update conversation settings.' }, { status: 400 });
  }
}
