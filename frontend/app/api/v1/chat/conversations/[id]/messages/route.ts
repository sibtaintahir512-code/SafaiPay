import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/serverAuth';
import { getConversationById, getMessages, sendChatMessage } from '@/lib/db';
import { UserRole } from '@/lib/chatTypes';

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

  const searchParams = req.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const before = searchParams.get('before') || undefined;

  const result = getMessages(params.id, { limit, before });
  return NextResponse.json(result);
}

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

  try {
    const body = await req.json();
    const content = (body.content || '').trim();
    const attachments = Array.isArray(body.attachments) ? body.attachments : [];

    if (!content && attachments.length === 0) {
      return NextResponse.json({ detail: 'Message content or attachment is required.' }, { status: 400 });
    }

    const message = sendChatMessage({
      conversation_id: params.id,
      sender_id: session.user.id,
      sender_name: session.user.full_name,
      sender_role: session.user.role as UserRole,
      sender_avatar: (session.user.profile as any)?.profile_photo_url,
      content,
      type: body.type,
      attachments,
      reply_to: body.reply_to,
      forwarded_from: body.forwarded_from,
      client_temp_id: body.client_temp_id,
    });

    return NextResponse.json(message, { status: 201 });
  } catch (err: any) {
    const status = err.message?.includes('blocked') ? 403 : 400;
    return NextResponse.json({ detail: err.message || 'Failed to send message.' }, { status });
  }
}
