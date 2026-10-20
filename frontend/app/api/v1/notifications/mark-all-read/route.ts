import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt, markAllNotificationsAsRead } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

async function handleMarkAllRead(req: NextRequest) {
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

    const fastApiUrl = process.env.FASTAPI_BACKEND_URL;
    if (fastApiUrl) {
      try {
        const response = await fetch(`${fastApiUrl}/api/v1/notifications/mark-all-read`, {
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
        console.warn('FastAPI mark-all-read proxy failed, falling back to serverless state');
      }
    }

    const count = markAllNotificationsAsRead(decoded.sub);
    return NextResponse.json({ success: true, marked_count: count });
  } catch (error: any) {
    return NextResponse.json(
      { detail: error.message || 'Failed to mark all notifications as read.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return handleMarkAllRead(req);
}

export async function PATCH(req: NextRequest) {
  return handleMarkAllRead(req);
}
