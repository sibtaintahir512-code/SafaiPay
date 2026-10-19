import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  // If external FastAPI backend is configured, notify it
  const fastApiUrl = process.env.FASTAPI_BACKEND_URL;
  if (fastApiUrl && token) {
    try {
      await fetch(`${fastApiUrl}/api/v1/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
  }

  // Clear any auth cookies if present
  const response = NextResponse.json({
    success: true,
    message: 'Session successfully terminated.',
  });

  response.cookies.set('safaipay_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
