import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt, markNotificationAsRead } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

async function handleMarkRead(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ detail: 'Authentication token is required.' }, { status: 401 });
    }

    const token = authHeader.substring(7).trim();
    const decoded = verifyJwt(token);
    if (!decoded || !decoded.sub) {
      return NextResponse.json({ detail: 'Invalid or expired token.' }, { status: 401 });
    }

    const notificationId = params.id;
    if (!notificationId) {
      return NextResponse.json({ detail: 'Notification ID is required.' }, { status: 400 });
    }

    const fastApiUrl = process.env.FASTAPI_BACKEND_URL;
    if (fastApiUrl) {
      try {
        const response = await fetch(`${fastApiUrl}/api/v1/notifications/${notificationId}/read`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        }
      } catch (e) {
        console.warn('FastAPI mark-read proxy failed, falling back to serverless state');
      }
    }

    const updated = markNotificationAsRead(decoded.sub, notificationId);
    if (!updated) {
      return NextResponse.json({ detail: 'Notification not found or access denied.' }, { status: 404 });
    }

    return NextResponse.json({
      id: updated.id,
      title: updated.title,
      message: updated.message,
      notification_type: updated.type,
      is_read: updated.isRead,
      read_at: updated.readAt,
      created_at: updated.createdAt,
    });
  } catch (error: any) {
    return NextResponse.json(
      { detail: error.message || 'Failed to mark notification as read.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  return handleMarkRead(req, ctx);
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  return handleMarkRead(req, ctx);
}
