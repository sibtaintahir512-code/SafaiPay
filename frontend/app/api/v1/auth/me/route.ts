import { NextRequest, NextResponse } from 'next/server';
import { DEMO_USERS_MAP } from '@/lib/mockData';
import { UserRole } from '@/lib/types';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  let role: UserRole = 'customer';

  if (authHeader.includes('admin')) {
    role = 'admin';
  } else if (authHeader.includes('collector')) {
    role = 'collector';
  } else if (authHeader.includes('recycler')) {
    role = 'recycler';
  } else {
    role = 'customer';
  }

  const user = DEMO_USERS_MAP[role];
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
    [`${role}_profile`]: {
      status: 'VERIFIED',
      verified_at: '2026-01-20T10:00:00Z',
    },
  });
}
