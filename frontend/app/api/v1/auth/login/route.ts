import { NextRequest, NextResponse } from 'next/server';
import {
  findUserByIdentifier,
  verifyPassword,
  signJwt,
  checkLoginLockout,
  recordFailedLogin,
  clearFailedLogins,
} from '@/lib/serverAuth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = String(body.identifier || '').trim();
    const password = String(body.password || '');

    if (!identifier || !password) {
      return NextResponse.json(
        { detail: 'Invalid credentials: Phone/email or password is required.' },
        { status: 400 }
      );
    }

    // Try forwarding to external FastAPI backend if running and configured
    const fastApiUrl = process.env.FASTAPI_BACKEND_URL;
    if (fastApiUrl) {
      try {
        const response = await fetch(`${fastApiUrl}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password }),
        });
        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        } else if (response.status === 401 || response.status === 429) {
          const errData = await response.json();
          return NextResponse.json(errData, { status: response.status });
        }
      } catch {
        // Fallback to secure serverless auth verification
      }
    }

    // Rate Limiting & Account Lockout Enforcement
    const lockoutStatus = checkLoginLockout(identifier);
    if (lockoutStatus.isLocked) {
      return NextResponse.json(
        {
          detail: `Account temporarily locked due to repeated failed login attempts. Please try again after ${lockoutStatus.remainingMinutes} minutes.`,
        },
        { status: 429 }
      );
    }

    // Look up registered user
    const user = findUserByIdentifier(identifier);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      recordFailedLogin(identifier);
      return NextResponse.json(
        { detail: 'Invalid credentials: Phone/email or password is incorrect.' },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { detail: 'Account is deactivated. Please contact SafaiPay support.' },
        { status: 403 }
      );
    }

    // Success: clear failed attempts
    clearFailedLogins(identifier);

    // Generate signed JWT token
    const token = signJwt({
      sub: user.id,
      role: user.role,
      roles: user.roles,
      phone_number: user.phone_number,
    });

    return NextResponse.json({
      access_token: token,
      token_type: 'Bearer',
      expires_in: 3600,
      user: {
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
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { detail: 'Invalid login request payload.' },
      { status: 400 }
    );
  }
}
