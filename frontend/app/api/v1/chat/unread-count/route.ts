import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/serverAuth';
import { getTotalUnreadChatCount } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { session, error } = authenticateRequest(req);
  if (error || !session) {
    return NextResponse.json({ unread_count: 0 });
  }

  const unreadCount = getTotalUnreadChatCount(session.user.id);
  return NextResponse.json({ unread_count: unreadCount });
}
