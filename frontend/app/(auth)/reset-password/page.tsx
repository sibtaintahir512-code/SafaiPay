'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SafaiPayLogo } from '@/components/SafaiPayLogo';
import { Lock, ArrowRight, CheckCircle2, KeyRound, RefreshCw, AlertCircle, Phone } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!identifier.trim() || !otp.trim() || !newPassword) {
      setErrorMessage('Please provide your phone or email, the verification code, and your new password.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          otp_code: otp.trim(),
          new_password: newPassword,
        }),
      });

      if (!res.ok) {
        let msg = 'Failed to reset password. Please check your verification code.';
        try {
          const err = await res.json();
          msg = err.detail || msg;
        } catch {}
        throw new Error(msg);
      }

      setSuccess(true);
      setTimeout(() => {
        router.replace('/login');
      }, 1800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed. Please check the OTP code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4FAF7] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#D5E6DD] p-7 sm:p-9 shadow-xl space-y-6 text-center">
        <SafaiPayLogo size="lg" className="justify-center" />
        <h2 className="text-2xl font-extrabold text-[#0F3D3E] tracking-tight">Set New Password</h2>
        <p className="text-xs text-[#5B6B66]">
          Enter your phone/email, verification code, and choose a strong password.
        </p>

        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-[#C0392B] rounded-2xl text-xs font-medium flex items-start space-x-2 text-left">
            <AlertCircle className="w-4 h-4 text-[#C0392B] shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {success ? (
          <div className="p-5 bg-[#E6F4EC] border border-[#D5E6DD] rounded-2xl text-center space-y-2.5">
            <CheckCircle2 className="w-8 h-8 text-[#1B7F5C] mx-auto" />
            <p className="text-sm font-bold text-[#0F3D3E]">Password Updated Successfully!</p>
            <p className="text-xs text-[#3F5A52]">Redirecting to the login portal...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-[#0F3D3E] uppercase tracking-wider mb-1">
                Phone Number or Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="+92 300 1234567 or user@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-[#F4FAF7] border border-[#D5E6DD] rounded-xl px-3.5 py-2.5 text-xs text-[#0F3D3E] placeholder-[#8A9A95] focus:outline-none focus:border-[#1B7F5C] focus:bg-white transition"
                />
                <Phone className="w-4 h-4 text-[#5B6B66] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F3D3E] uppercase tracking-wider mb-1">
                Verification OTP Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-[#F4FAF7] border border-[#D5E6DD] rounded-xl px-3.5 py-2.5 text-xs text-[#0F3D3E] font-mono tracking-widest text-center focus:outline-none focus:border-[#1B7F5C] focus:bg-white transition"
                />
                <KeyRound className="w-4 h-4 text-[#5B6B66] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F3D3E] uppercase tracking-wider mb-1">
                New Password (Min 8 Characters)
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-[#F4FAF7] border border-[#D5E6DD] rounded-xl px-3.5 py-2.5 text-xs text-[#0F3D3E] placeholder-[#8A9A95] focus:outline-none focus:border-[#1B7F5C] focus:bg-white transition"
                />
                <Lock className="w-4 h-4 text-[#5B6B66] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1B7F5C] hover:bg-[#146B4D] text-white font-extrabold py-3.5 rounded-xl text-xs transition shadow-md shadow-[#1B7F5C]/25 flex items-center justify-center space-x-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Confirm New Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-[#D5E6DD]">
          <Link href="/login" className="text-xs text-[#1B7F5C] hover:text-[#146B4D] font-bold">
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
