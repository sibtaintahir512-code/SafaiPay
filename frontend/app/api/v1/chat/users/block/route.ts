import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/serverAuth';
import { blockUser, unblockUser, getBlockedUsers } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { session, error } = authenticateRequest(req);
  if (error || !session) {
    return NextResponse.json({ detail: error?.detail || 'Unauthorized' }, { status: error?.status || 401 });
  }

  const blocked = getBlockedUsers(session.user.id);
  return NextResponse.json({ blocked_user_ids: blocked });
}

export async function POST(req: NextRequest) {
  const { session, error } = authenticateRequest(req);
  if (error || !session) {
    return NextResponse.json({ detail: error?.detail || 'Unauthorized' }, { status: error?.status || 401 });
  }

  try {
    const body = await req.json();
    const targetUserId = body.user_id;
    if (!targetUserId) {
      return NextResponse.json({ detail: 'user_id is required.' }, { status: 400 });
    }

    if (targetUserId === session.user.id) {
      return NextResponse.json({ detail: 'Cannot block yourself.' }, { status: 400 });
    }

    const record = blockUser(session.user.id, targetUserId, body.reason);
    return NextResponse.json({ message: 'User blocked successfully.', block: record });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Failed to block user.' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const { session, error } = authenticateRequest(req);
  if (error || !session) {
    return NextResponse.json({ detail: error?.detail || 'Unauthorized' }, { status: error?.status || 401 });
  }

  try {
    let targetUserId = req.nextUrl.searchParams.get('user_id');
    if (!targetUserId) {
      try {
        const body = await req.json();
        targetUserId = body.user_id;
      } catch {}
    }

    if (!targetUserId) {
      return NextResponse.json({ detail: 'user_id is required.' }, { status: 400 });
    }

    const success = unblockUser(session.user.id, targetUserId);
    return NextResponse.json({ message: 'User unblocked successfully.', success });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Failed to unblock user.' }, { status: 400 });
  }
}
