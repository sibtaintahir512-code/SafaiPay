import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt, changeUserPassword } from '@/lib/serverAuth';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { detail: 'Authentication token is required.' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7).trim();
    const payload = verifyJwt(token);
    if (!payload || !payload.sub) {
      return NextResponse.json(
        { detail: 'Invalid or expired session token.' },
        { status: 401 }
      );
    }

    // Guest demo accounts are strictly forbidden from changing passwords
    if (payload.isGuest || payload.is_guest || String(payload.sub).startsWith('usr_guest_')) {
      return NextResponse.json(
        { detail: 'Guest demo accounts cannot modify security credentials. Guest demo accounts are read-only.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const currentPassword = String(body.current_password || '');
    const newPassword = String(body.new_password || '');
    const confirmNewPassword = String(body.confirm_new_password || body.confirm_password || '');

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return NextResponse.json(
        { detail: 'Current password, new password, and confirmation are required.' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmNewPassword) {
      return NextResponse.json(
        { detail: 'New password and confirmation do not match.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { detail: 'New password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    // Forward to FastAPI if configured
    const fastApiUrl = process.env.FASTAPI_BACKEND_URL;
    if (fastApiUrl) {
      try {
        const response = await fetch(`${fastApiUrl}/api/v1/auth/change-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
            confirm_new_password: confirmNewPassword,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        } else {
          const errData = await response.json();
          return NextResponse.json(errData, { status: response.status });
        }
      } catch {
        // Fallback to serverless
      }
    }

    // Serverless fallback
    const userIdentifier = payload.phone_number || payload.email || payload.sub;
    changeUserPassword(userIdentifier, currentPassword, newPassword);

    return NextResponse.json({
      success: true,
      message: 'Password has been successfully updated.',
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { detail: error.message || 'Failed to update password.' },
      { status: 400 }
    );
  }
}
