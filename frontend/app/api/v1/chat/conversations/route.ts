import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, VERIFIED_USERS } from '@/lib/serverAuth';
import {
  getConversationsForUser,
  createDirectConversation,
  createGroupConversation,
} from '@/lib/db';
import { UserRole } from '@/lib/chatTypes';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { session, error } = authenticateRequest(req);
  if (error || !session) {
    return NextResponse.json({ detail: error?.detail || 'Unauthorized' }, { status: error?.status || 401 });
  }

  const convs = getConversationsForUser(session.user.id);
  return NextResponse.json(convs);
}

export async function POST(req: NextRequest) {
  const { session, error } = authenticateRequest(req);
  if (error || !session) {
    return NextResponse.json({ detail: error?.detail || 'Unauthorized' }, { status: error?.status || 401 });
  }

  try {
    const body = await req.json();
    const type = body.type || 'direct';

    if (type === 'direct') {
      const targetUserId = body.target_user_id;
      if (!targetUserId) {
        return NextResponse.json({ detail: 'target_user_id is required for direct conversation.' }, { status: 400 });
      }

      if (targetUserId === session.user.id) {
        return NextResponse.json({ detail: 'Cannot start conversation with yourself.' }, { status: 400 });
      }

      const targetUser = VERIFIED_USERS.find((u) => u.id === targetUserId);
      if (!targetUser) {
        return NextResponse.json({ detail: 'Target user not found.' }, { status: 404 });
      }

      const conv = createDirectConversation(
        {
          id: session.user.id,
          name: session.user.full_name,
          role: session.user.role as UserRole,
          phone: session.user.phone_number,
        },
        {
          id: targetUser.id,
          name: targetUser.full_name,
          role: targetUser.role as UserRole,
          phone: targetUser.phone_number,
        }
      );

      return NextResponse.json(conv, { status: 201 });
    } else if (type === 'group') {
      const title = (body.title || '').trim();
      if (!title) {
        return NextResponse.json({ detail: 'Group title is required.' }, { status: 400 });
      }

      const participantIds: string[] = Array.isArray(body.participant_ids) ? body.participant_ids : [];
      const participants = participantIds
        .map((pId) => VERIFIED_USERS.find((u) => u.id === pId))
        .filter(Boolean)
        .map((u) => ({
          id: u!.id,
          name: u!.full_name,
          role: u!.role as UserRole,
          phone: u!.phone_number,
        }));

      const conv = createGroupConversation(
        {
          id: session.user.id,
          name: session.user.full_name,
          role: session.user.role as UserRole,
          phone: session.user.phone_number,
        },
        title,
        participants
      );

      return NextResponse.json(conv, { status: 201 });
    } else {
      return NextResponse.json({ detail: 'Invalid conversation type. Must be direct or group.' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Failed to create conversation.' }, { status: 500 });
  }
}
