'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SafaiPayLogo } from '@/components/SafaiPayLogo';
import { useLanguage } from '@/context/LanguageContext';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Phone, ArrowRight, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { isUrdu, language, setLanguage } = useLanguage();
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
    <div className="min-h-screen bg-theme-bg text-theme-text flex items-center justify-center p-4 sm:p-6 font-sans transition-colors duration-200">
      <div className="max-w-md w-full bg-theme-surface rounded-3xl border border-theme-border p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        {/* Top bar with Theme & Language */}
        <div className="flex items-center justify-between">
          <ThemeSwitcher variant="compact" />
          <div className="flex items-center bg-theme-bg border border-theme-border rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 text-xs font-bold rounded-lg transition min-h-[36px] ${
                language === 'en'
                  ? 'bg-theme-primary text-white shadow-xs'
                  : 'text-theme-secondary hover:text-theme-text'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('ur')}
              className={`px-2 py-0.5 text-xs font-bold rounded-lg transition min-h-[36px] ${
                language === 'ur'
                  ? 'bg-theme-primary text-white shadow-xs'
                  : 'text-theme-secondary hover:text-theme-text'
              }`}
            >
              اردو
            </button>
          </div>
        </div>

        <SafaiPayLogo size="lg" className="justify-center" />
        <h2 className="text-2xl font-extrabold text-theme-text tracking-tight">
          {isUrdu ? 'پاس ورڈ بحالی' : 'Forgot Password'}
        </h2>
        <p className="text-xs text-theme-secondary">
          {isUrdu
            ? 'اپنا رجسٹرڈ موبائل نمبر یا ای میل درج کریں تاکہ تصدیقی کوڈ بھیجا جا سکے۔'
            : 'Enter your registered mobile number or email to receive password reset instructions.'}
        </p>

        {errorMessage && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-theme-error rounded-2xl text-xs font-semibold flex items-start space-x-2 rtl:space-x-reverse text-left rtl:text-right">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {sent ? (
          <div className="p-5 bg-theme-soft-mint border border-theme-border rounded-2xl text-center space-y-2.5">
            <CheckCircle2 className="w-8 h-8 text-theme-primary mx-auto" />
            <p className="text-sm font-bold text-theme-text">Verification Code Sent</p>
            <p className="text-xs text-theme-secondary leading-relaxed">
              If an account matches your details, a single-use verification code has been dispatched.
            </p>
            <Link
              href="/reset-password"
              className="inline-flex items-center justify-center space-x-1.5 mt-2 bg-theme-primary hover:opacity-95 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition shadow-sm min-h-[44px]"
            >
              <span>Enter Code & Set New Password</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left rtl:text-right">
            <div>
              <label className="block text-xs font-bold text-theme-secondary uppercase tracking-wider mb-1">
                {isUrdu ? 'فون نمبر یا ای میل' : 'Phone Number or Email'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="+92 300 1234567 or user@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-theme-input border border-theme-border rounded-xl pl-4 pr-11 rtl:pr-4 rtl:pl-11 py-3 text-xs text-theme-text placeholder-theme-secondary/60 focus:outline-none focus:border-theme-primary transition min-h-[48px] sm:min-h-[52px]"
                />
                <Phone className="w-4 h-4 text-theme-secondary absolute right-3.5 rtl:right-auto rtl:left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-theme-primary hover:opacity-95 text-white font-extrabold py-3.5 rounded-xl text-xs transition shadow-md shadow-theme-primary/25 flex items-center justify-center space-x-2 rtl:space-x-reverse disabled:opacity-60 min-h-[48px] sm:min-h-[52px]"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>{isUrdu ? 'بھیجا جا رہا ہے...' : 'Sending Code...'}</span>
                </>
              ) : (
                <>
                  <span>{isUrdu ? 'تصدیقی کوڈ بھیجیں' : 'Send Verification Code'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-theme-border/60">
          <Link href="/login" className="text-xs text-theme-primary hover:underline font-bold inline-block py-2 min-h-[44px]">
            {isUrdu ? 'لاگ ان پر واپس جائیں' : 'Back to Sign In'}
          </Link>
        </div>
      </div>
    </div>
  );
}
