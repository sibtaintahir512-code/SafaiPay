import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/serverAuth';
import { reportChatMessage, getChatReports } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { session, error } = authenticateRequest(req);
  if (error || !session) {
    return NextResponse.json({ detail: error?.detail || 'Unauthorized' }, { status: error?.status || 401 });
  }

  try {
    const body = await req.json();
    const { reported_id, conversation_id, message_id, reason, notes } = body;

    if (!reported_id || !conversation_id || !reason) {
      return NextResponse.json(
        { detail: 'reported_id, conversation_id, and reason are required fields.' },
        { status: 400 }
      );
    }

    const report = reportChatMessage({
      reporter_id: session.user.id,
      reported_id,
      conversation_id,
      message_id,
      reason,
      notes,
    });

    return NextResponse.json({ message: 'Report submitted for moderation review.', report }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Failed to submit report.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { session, error } = authenticateRequest(req);
  if (error || !session) {
    return NextResponse.json({ detail: error?.detail || 'Unauthorized' }, { status: error?.status || 401 });
  }

  // Admin access check
  if (session.user.role !== 'admin' && !session.user.roles?.includes('ADMIN')) {
    return NextResponse.json({ detail: 'Access restricted to administrators.' }, { status: 403 });
  }

  const status = req.nextUrl.searchParams.get('status') || undefined;
  const reports = getChatReports(status);
  return NextResponse.json(reports);
}
