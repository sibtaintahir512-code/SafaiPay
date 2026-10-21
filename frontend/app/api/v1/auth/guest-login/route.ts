import { NextRequest, NextResponse } from 'next/server';
import { VERIFIED_USERS, signJwt } from '@/lib/serverAuth';
import { UserRole } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const role = (body.role || 'customer').toLowerCase().trim() as UserRole;

    const allowedRoles: UserRole[] = ['customer', 'collector', 'recycler'];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { detail: 'Invalid guest role. Choose either customer, collector, or recycler.' },
        { status: 400 }
      );
    }

    // Try finding dedicated guest user first, or standard role user
    const guestUser =
      VERIFIED_USERS.find((u) => u.id === `usr_guest_${role.slice(0, 4)}`) ||
      VERIFIED_USERS.find((u) => u.role === role);

    if (!guestUser) {
      return NextResponse.json(
        { detail: `No guest profile configured for role: ${role}` },
        { status: 404 }
      );
    }

    // Generate signed JWT token for the guest session (valid for 24 hours)
    const token = signJwt(
      {
        sub: guestUser.id,
        role: guestUser.role,
        roles: guestUser.roles,
        phone_number: guestUser.phone_number,
        email: guestUser.email,
        isGuest: true,
      },
      86400
    );

    return NextResponse.json({
      access_token: token,
      token_type: 'Bearer',
      expires_in: 86400,
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
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || 'Failed to initialize guest login session.' },
      { status: 500 }
    );
  }
}
