import { NextRequest, NextResponse } from 'next/server';
import { findUserByIdentifier, storePasswordResetOtp } from '@/lib/serverAuth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = String(body.identifier || '').trim();

    if (!identifier) {
      return NextResponse.json(
        { detail: 'Phone number or email is required.' },
        { status: 400 }
      );
    }

    const user = findUserByIdentifier(identifier);
    if (user) {
      // Generate a 6-digit OTP code
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      storePasswordResetOtp(identifier, otp);
    }

    // Always return generic success to prevent account enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account matches this identifier, password reset instructions have been sent.',
    });
  } catch {
    return NextResponse.json(
      { detail: 'Invalid request payload.' },
      { status: 400 }
    );
  }
}
