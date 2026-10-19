'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SafaiPayLogo } from '@/components/SafaiPayLogo';
import { Phone, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl border border-purple-100 p-8 shadow-xl space-y-6 text-center">
        <SafaiPayLogo size="lg" className="justify-center" />
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Forgot Password</h2>
        <p className="text-xs text-slate-500">
          Enter your registered mobile number or email to receive a password reset OTP.
        </p>

        {sent ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-sm font-bold text-emerald-900">OTP Sent Successfully!</p>
            <p className="text-xs text-emerald-700">Check your SMS for verification code (Sandbox code: 123456).</p>
            <Link
              href="/reset-password"
              className="inline-block mt-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-2 px-5 rounded-xl text-xs"
            >
              Enter OTP & Reset Password
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number or Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="+923001110001 or user@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-3.5 rounded-xl text-xs transition shadow-md shadow-purple-600/25 flex items-center justify-center space-x-2"
            >
              <span>Send Verification Code</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-slate-100">
          <Link href="/login" className="text-xs text-purple-600 hover:text-purple-700 font-bold">
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
