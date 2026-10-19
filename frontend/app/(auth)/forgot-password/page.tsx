'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SafaiPayLogo } from '@/components/SafaiPayLogo';
import { Phone, ArrowRight, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });

      if (!res.ok) {
        let msg = 'Failed to process request. Please try again.';
        try {
          const err = await res.json();
          msg = err.detail || msg;
        } catch {}
        throw new Error(msg);
      }

      setSent(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Request failed. Please verify your phone or email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4FAF7] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#D5E6DD] p-7 sm:p-9 shadow-xl space-y-6 text-center">
        <SafaiPayLogo size="lg" className="justify-center" />
        <h2 className="text-2xl font-extrabold text-[#0F3D3E] tracking-tight">Forgot Password</h2>
        <p className="text-xs text-[#5B6B66]">
          Enter your registered mobile number or email to receive password reset instructions.
        </p>

        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-[#C0392B] rounded-2xl text-xs font-medium flex items-start space-x-2 text-left">
            <AlertCircle className="w-4 h-4 text-[#C0392B] shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {sent ? (
          <div className="p-5 bg-[#E6F4EC] border border-[#D5E6DD] rounded-2xl text-center space-y-2.5">
            <CheckCircle2 className="w-8 h-8 text-[#1B7F5C] mx-auto" />
            <p className="text-sm font-bold text-[#0F3D3E]">Verification Code Sent</p>
            <p className="text-xs text-[#3F5A52] leading-relaxed">
              If an account matches your details, a single-use verification code has been dispatched.
            </p>
            <Link
              href="/reset-password"
              className="inline-flex items-center justify-center space-x-1.5 mt-2 bg-[#1B7F5C] hover:bg-[#146B4D] text-white font-bold py-2.5 px-5 rounded-xl text-xs transition shadow-sm"
            >
              <span>Enter Code & Set New Password</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1B7F5C] hover:bg-[#146B4D] text-white font-extrabold py-3.5 rounded-xl text-xs transition shadow-md shadow-[#1B7F5C]/25 flex items-center justify-center space-x-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Sending Instructions...</span>
                </>
              ) : (
                <>
                  <span>Send Verification Code</span>
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
