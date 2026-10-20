import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt, VERIFIED_USERS, updateUserProfile } from '@/lib/serverAuth';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { detail: 'Authentication token is required.' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7).trim();

    // Forward to FastAPI if configured
    const fastApiUrl = process.env.FASTAPI_BACKEND_URL;
    if (fastApiUrl) {
      try {
        const response = await fetch(`${fastApiUrl}/api/v1/users/me`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        }
      } catch {
        // Fallback
      }
    }

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

    const { passwordHash: _hash, allowedPasswords: _pw, ...safeUser } = user;
    return NextResponse.json(safeUser);
  } catch (error: any) {
    return NextResponse.json(
      { detail: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
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

    // Forward to FastAPI if configured
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

    const payload = verifyJwt(token);
    if (!payload || !payload.sub) {
      return NextResponse.json(
        { detail: 'Invalid or expired session token.' },
        { status: 401 }
      );
    }

    const userIdentifier = payload.phone_number || payload.email || payload.sub;
    const updated = updateUserProfile(userIdentifier, body);
    const { passwordHash: _hash, allowedPasswords: _pw, ...safeUser } = updated;

    return NextResponse.json(safeUser);
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { detail: error.message || 'Failed to update profile.' },
      { status: 400 }
    );
  }
}
