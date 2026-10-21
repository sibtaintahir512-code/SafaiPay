import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt, VERIFIED_USERS, updateUserProfile } from '@/lib/serverAuth';

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

  const isGuest = Boolean(payload.isGuest || payload.is_guest || user.id.startsWith('usr_guest_'));

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
    isGuest,
    is_guest: isGuest,
  });
}

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { detail: 'Authentication token is required.' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7).trim();
    const body = await req.json().catch(() => ({}));

    const payload = verifyJwt(token);
    if (!payload || !payload.sub) {
      return NextResponse.json(
        { detail: 'Invalid or expired session token.' },
        { status: 401 }
      );
    }

    // Guest demo profiles are strictly read-only
    if (payload.isGuest || payload.is_guest || payload.sub.startsWith('usr_guest_')) {
      return NextResponse.json(
        { detail: 'Guest demo accounts cannot modify profile information. Profile is read-only.' },
        { status: 403 }
      );
    }

    const fastApiUrl = process.env.FASTAPI_BACKEND_URL;
    if (fastApiUrl) {
      try {
        const response = await fetch(`${fastApiUrl}/api/v1/users/me`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        }
      } catch {
        // Fallback
      }
    }

    const userIdentifier = payload.phone_number || payload.email || payload.sub;
    const updated = updateUserProfile(userIdentifier, body);
    const { passwordHash: _hash, allowedPasswords: _pw, ...safeUser } = updated;

    return NextResponse.json(safeUser);
  } catch (error: any) {
    return NextResponse.json(
      { detail: error.message || 'Failed to update profile.' },
      { status: 400 }
    );
  }
}
