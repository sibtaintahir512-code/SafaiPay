import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/serverAuth';
import { editChatMessage, deleteChatMessage, getMessageById } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(
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

  if (existing.sender_id !== session.user.id) {
    return NextResponse.json({ detail: 'Only the original sender can modify this message.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const action = body.action || (body.content !== undefined ? 'edit' : 'delete');

    if (action === 'delete') {
      const deleted = deleteChatMessage(params.msgId, session.user.id);
      return NextResponse.json(deleted);
    } else if (action === 'edit') {
      const content = (body.content || '').trim();
      if (!content) {
        return NextResponse.json({ detail: 'Edited message content cannot be empty.' }, { status: 400 });
      }
      const updated = editChatMessage(params.msgId, session.user.id, content);
      return NextResponse.json(updated);
    } else {
      return NextResponse.json({ detail: "Invalid action. Must be 'edit' or 'delete'." }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Failed to update message.' }, { status: 400 });
  }
}
