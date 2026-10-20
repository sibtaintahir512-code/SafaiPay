import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt, VERIFIED_USERS } from '@/lib/serverAuth';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { detail: 'Authentication token is required.' },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7).trim();

  // Try forwarding to external FastAPI backend if running and configured
  const fastApiUrl = process.env.FASTAPI_BACKEND_URL;
  if (fastApiUrl) {
    try {
      const response = await fetch(`${fastApiUrl}/api/v1/auth/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback to verified JWT verification
    }
  }

  // Validate signed JWT
  const payload = verifyJwt(token);
  if (!payload || !payload.sub) {
    return NextResponse.json(
      { detail: 'Invalid or expired session token.' },
      { status: 401 }
    );
  }

  const user = VERIFIED_USERS.find(
    (u) =>
      u.id === payload.sub ||
      u.phone_number === payload.phone_number ||
      u.email === payload.email ||
      (u.aliases && payload.phone_number && u.aliases.includes(payload.phone_number))
  );

  if (!user || !user.is_active) {
    return NextResponse.json(
      { detail: 'User session not found or account deactivated.' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    id: user.id,
    phone_number: user.phone_number,
    full_name: user.full_name,
    email: user.email,
    roles: user.roles,
    role: user.role,
    is_phone_verified: user.is_phone_verified,
    is_active: user.is_active,
    created_at: user.created_at,
    [`${user.role}_profile`]: user.profile,
  });
}
