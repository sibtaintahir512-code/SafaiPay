'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SafaiPayLogo } from '@/components/SafaiPayLogo';
import { useLanguage } from '@/context/LanguageContext';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Lock, ArrowRight, CheckCircle2, KeyRound, RefreshCw, AlertCircle, Phone, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { isUrdu, language, setLanguage } = useLanguage();

  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!identifier.trim() || !otp.trim() || !newPassword) {
      setErrorMessage(isUrdu ? 'تمام خانے پر کریں۔' : 'Please provide your phone or email, the verification code, and your new password.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage(isUrdu ? 'پاس ورڈ کم از کم 8 حروف کا ہونا چاہیے۔' : 'Password must be at least 8 characters long.');
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
          {isUrdu ? 'نیا پاس ورڈ سیٹ کریں' : 'Set New Password'}
        </h2>
        <p className="text-xs text-theme-secondary">
          {isUrdu
            ? 'اپنا فون/ای میل، موصول شدہ کوڈ درج کریں اور نیا مضبوط پاس ورڈ منتخب کریں۔'
            : 'Enter your phone/email, verification code, and choose a strong password.'}
        </p>

        {errorMessage && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-theme-error rounded-2xl text-xs font-semibold flex items-start space-x-2 rtl:space-x-reverse text-left rtl:text-right">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {success ? (
          <div className="p-5 bg-theme-soft-mint border border-theme-border rounded-2xl text-center space-y-2.5">
            <CheckCircle2 className="w-8 h-8 text-theme-primary mx-auto" />
            <p className="text-sm font-bold text-theme-text">Password Updated Successfully!</p>
            <p className="text-xs text-theme-secondary">Redirecting to the login portal...</p>
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

            <div>
              <label className="block text-xs font-bold text-theme-secondary uppercase tracking-wider mb-1">
                {isUrdu ? 'تصدیقی کوڈ (OTP)' : 'Verification Code (OTP)'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. 123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-theme-input border border-theme-border rounded-xl pl-4 pr-11 rtl:pr-4 rtl:pl-11 py-3 text-xs text-theme-text font-mono tracking-widest placeholder-theme-secondary/60 focus:outline-none focus:border-theme-primary transition min-h-[48px] sm:min-h-[52px]"
                />
                <KeyRound className="w-4 h-4 text-theme-secondary absolute right-3.5 rtl:right-auto rtl:left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-theme-secondary uppercase tracking-wider mb-1">
                {isUrdu ? 'نیا پاس ورڈ (کم از کم 8 حروف)' : 'New Password (Min 8 Characters)'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-theme-input border border-theme-border rounded-xl pl-4 pr-11 rtl:pr-4 rtl:pl-11 py-3 text-xs text-theme-text placeholder-theme-secondary/60 focus:outline-none focus:border-theme-primary transition min-h-[48px] sm:min-h-[52px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 rtl:right-auto rtl:left-0 top-0 bottom-0 pr-3.5 rtl:pr-0 rtl:pl-3.5 flex items-center text-theme-secondary hover:text-theme-text min-h-[44px] min-w-[44px] justify-center"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
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
                  <span>{isUrdu ? 'پاس ورڈ تبدیل ہو رہا ہے...' : 'Updating Password...'}</span>
                </>
              ) : (
                <>
                  <span>{isUrdu ? 'پاس ورڈ محفوظ کریں' : 'Reset & Save Password'}</span>
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
