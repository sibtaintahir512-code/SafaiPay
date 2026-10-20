import { NextRequest, NextResponse } from 'next/server';
import { registerUser, signJwt } from '@/lib/serverAuth';
import { UserRole } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone_number = String(body.phone_number || '').trim();
    const full_name = String(body.full_name || '').trim();
    const email = body.email ? String(body.email).trim() : null;
    const password = String(body.password || '');
    const rawRole = String(body.role || 'customer').toLowerCase();

    if (!phone_number || !full_name || !password) {
      return NextResponse.json(
        { detail: 'Phone number, full name, and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { detail: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const validRoles: UserRole[] = ['customer', 'collector', 'recycler', 'admin'];
    const role: UserRole = validRoles.includes(rawRole as UserRole) ? (rawRole as UserRole) : 'customer';

    // Try forwarding to external FastAPI backend if running and configured
    const fastApiUrl = process.env.FASTAPI_BACKEND_URL;
    if (fastApiUrl) {
      try {
        const response = await fetch(`${fastApiUrl}/api/v1/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone_number,
            full_name,
            email,
            password,
            role: role.toUpperCase(),
          }),
        });
        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data, { status: 201 });
        } else if (response.status === 409 || response.status === 400) {
          const errData = await response.json();
          return NextResponse.json(errData, { status: response.status });
        }
      } catch {
        // Fallback to serverless registration
      }
    }

    try {
      const newUser = registerUser({
        phone_number,
        full_name,
        email,
        password,
        role,
      });

      const token = signJwt({
        sub: newUser.id,
        role: newUser.role,
        roles: newUser.roles,
        phone_number: newUser.phone_number,
      });

      return NextResponse.json(
        {
          access_token: token,
          token_type: 'Bearer',
          expires_in: 3600,
          user: {
            id: newUser.id,
            phone_number: newUser.phone_number,
            full_name: newUser.full_name,
            email: newUser.email,
            roles: newUser.roles,
            role: newUser.role,
            is_phone_verified: newUser.is_phone_verified,
            is_active: newUser.is_active,
            created_at: newUser.created_at,
            [`${newUser.role}_profile`]: newUser.profile,
          },
        },
        { status: 201 }
      );
    } catch (err: any) {
      return NextResponse.json(
        { detail: err.message || 'Registration failed.' },
        { status: 409 }
      );
    }
  } catch {
    return NextResponse.json(
      { detail: 'Invalid registration payload.' },
      { status: 400 }
    );
  }
}
