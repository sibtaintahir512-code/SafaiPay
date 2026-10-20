import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt, getUserNotifications } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
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
        const response = await fetch(`${fastApiUrl}/api/v1/notifications`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        }
      } catch (e) {
        console.warn('FastAPI notifications proxy failed, falling back to serverless state');
      }
    }

    const notifications = getUserNotifications(decoded.sub);
    return NextResponse.json(notifications);
  } catch (error: any) {
    return NextResponse.json(
      { detail: error.message || 'Failed to retrieve notifications.' },
      { status: 500 }
    );
  }
}
