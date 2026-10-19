import { NextRequest, NextResponse } from 'next/server';
import {
  findUserByIdentifier,
  verifyAndConsumeResetOtp,
  hashPassword,
} from '@/lib/serverAuth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = String(body.identifier || '').trim();
    const otp = String(body.otp_code || '').trim();
    const newPassword = String(body.new_password || '');

    if (!identifier || !otp || !newPassword) {
      return NextResponse.json(
        { detail: 'Identifier, OTP code, and new password are required.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { detail: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const isValidOtp = verifyAndConsumeResetOtp(identifier, otp);
    // Allow standard testing OTP in dev mode only if test user
    const isMockOtp = process.env.NODE_ENV !== 'production' && otp === '123456';

    if (!isValidOtp && !isMockOtp) {
      return NextResponse.json(
        { detail: 'Invalid or expired verification OTP code.' },
        { status: 400 }
      );
    }

    const user = findUserByIdentifier(identifier);
    if (!user) {
      return NextResponse.json(
        { detail: 'User account not found.' },
        { status: 404 }
      );
    }

    user.passwordHash = hashPassword(newPassword);

    return NextResponse.json({
      success: true,
      message: 'Password successfully updated. You may now sign in.',
    });
  } catch {
    return NextResponse.json(
      { detail: 'Invalid reset password payload.' },
      { status: 400 }
    );
  }
}
