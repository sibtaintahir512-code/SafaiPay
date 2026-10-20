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
    let identifier = '';
    let password = '';

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      identifier = String(formData.get('username') || formData.get('identifier') || formData.get('email') || '').trim();
      password = String(formData.get('password') || '');
    } else {
      const body = await req.json().catch(() => ({}));
      identifier = String(body.username || body.identifier || body.email || '').trim();
      password = String(body.password || '');
    }

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
    if (!user || !verifyPassword(password, user.passwordHash, user)) {
      recordFailedLogin(identifier);
      return NextResponse.json(
        { detail: 'Invalid credentials: Phone/email or password is incorrect.' },
        { status: 401 }
      );
    }

    // Reset lockout counters on successful password match
    clearFailedLogins(identifier);

    const token = signJwt(user);
    const { passwordHash: _hash, ...safeUser } = user;

    return NextResponse.json({
      access_token: token,
      token_type: 'Bearer',
      expires_in: 3600,
      user: safeUser,
    });
  } catch (error) {
    console.error('Token endpoint authentication error:', error);
    return NextResponse.json(
      { detail: 'Authentication failed due to server error.' },
      { status: 500 }
    );
  }
}
