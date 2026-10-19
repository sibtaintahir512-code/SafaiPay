import { NextRequest, NextResponse } from 'next/server';
import { DEMO_USERS_MAP } from '@/lib/mockData';
import { UserRole } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = String(body.identifier || '').trim().toLowerCase();

    let role: UserRole = 'customer';
    if (identifier.includes('admin') || identifier === '+923000000000') {
      role = 'admin';
    } else if (identifier === '+923002220001' || identifier.includes('rafiq') || identifier.includes('collector')) {
      role = 'collector';
    } else if (identifier === '+923003330001' || identifier.includes('indus') || identifier.includes('recycler')) {
      role = 'recycler';
    } else {
      role = 'customer';
    }

    const user = DEMO_USERS_MAP[role];
    const token = `jwt_token_${role}_${Date.now()}`;

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
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { detail: 'Invalid login request payload.' },
      { status: 400 }
    );
  }
}
