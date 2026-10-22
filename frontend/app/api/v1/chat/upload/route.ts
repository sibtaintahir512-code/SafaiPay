import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/serverAuth';
import { processAndSaveUploadedFile } from '@/lib/storageEngine';
import { getConversationById } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { session, error } = authenticateRequest(req);
  if (error || !session) {
    return NextResponse.json({ detail: error?.detail || 'Unauthorized' }, { status: error?.status || 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const conversationId = formData.get('conversation_id') as string | null;
    const durationStr = formData.get('duration_seconds') as string | null;
    const durationSeconds = durationStr ? parseFloat(durationStr) : undefined;

    if (!file) {
      return NextResponse.json({ detail: 'No file provided in form data.' }, { status: 400 });
    }

    if (conversationId) {
      const conv = getConversationById(conversationId);
      if (conv && !conv.participant_ids.includes(session.user.id)) {
        return NextResponse.json({ detail: 'Access denied: You are not a participant in this conversation.' }, { status: 403 });
      }
    }

    const saved = await processAndSaveUploadedFile(
      file,
      {
        uploaded_by_user_id: session.user.id,
        uploaded_by_role: session.user.role,
        conversation_id: conversationId || undefined,
      },
      { allowChatMedia: true }
    );

    return NextResponse.json(
      {
        id: saved.file_id,
        file_url: saved.file_url,
        filename: saved.filename,
        mime_type: saved.mime_type,
        size_bytes: saved.size_bytes,
        duration_seconds: durationSeconds,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'File upload failed.' }, { status: 400 });
  }
}
