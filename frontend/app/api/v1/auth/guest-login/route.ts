import { NextRequest, NextResponse } from 'next/server';
import { VERIFIED_USERS, signJwt, checkGuestRateLimit } from '@/lib/serverAuth';
import { UserRole } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    // 1. Abuse protection and rate limiting per IP
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const rateCheck = checkGuestRateLimit(clientIp);
    if (rateCheck.isLimited) {
      return NextResponse.json(
        { detail: 'Too many guest login requests. Please wait a moment and try again.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateCheck.retryAfterSeconds),
          },
        }
      );
    }

    const body = await req.json().catch(() => ({}));

    // 2. Reject missing or empty role with HTTP 400
    if (!body || !body.role || typeof body.role !== 'string' || !body.role.trim()) {
      return NextResponse.json(
        { detail: 'Role is required. Choose either customer, collector, or recycler.' },
        { status: 400 }
      );
    }

    const role = body.role.toLowerCase().trim() as UserRole;
    const allowedRoles: UserRole[] = ['customer', 'collector', 'recycler'];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { detail: 'Invalid guest role. Choose either customer, collector, or recycler.' },
        { status: 400 }
      );
    }

    // 3. Resolve dedicated guest user (usr_guest_cust, usr_guest_coll, usr_guest_recy)
    const guestUser =
      VERIFIED_USERS.find((u) => u.id === `usr_guest_${role.slice(0, 4)}`) ||
      VERIFIED_USERS.find((u) => u.role === role);

    if (!guestUser) {
      return NextResponse.json(
        { detail: `No guest profile configured for role: ${role}` },
        { status: 404 }
      );
    }

    // 4. Generate signed JWT token with exactly 24-hour expiration (86400 seconds)
    const token = signJwt(
      {
        sub: guestUser.id,
        role: guestUser.role,
        roles: guestUser.roles,
        phone_number: guestUser.phone_number,
        email: guestUser.email,
        isGuest: true,
        is_guest: true,
      },
      86400
    );

    return NextResponse.json({
      access_token: token,
      token_type: 'Bearer',
      expires_in: 86400,
      role: guestUser.role,
      isGuest: true,
      is_guest: true,
      user: {
        id: guestUser.id,
        phone_number: guestUser.phone_number,
        full_name: guestUser.full_name,
        email: guestUser.email,
        roles: guestUser.roles,
        role: guestUser.role,
        is_phone_verified: guestUser.is_phone_verified,
        is_active: guestUser.is_active,
        created_at: guestUser.created_at,
        [`${guestUser.role}_profile`]: guestUser.profile,
        isGuest: true,
        is_guest: true,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || 'Failed to initialize guest login session.' },
      { status: 500 }
    );
  }
}
