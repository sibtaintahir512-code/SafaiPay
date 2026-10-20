'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SafaiPayLogo } from '@/components/SafaiPayLogo';
import { useLanguage } from '@/context/LanguageContext';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { 
  ArrowRight, 
  ShieldCheck, 
  Phone, 
  Lock, 
  User as UserIcon, 
  Mail, 
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { isUrdu, language, setLanguage } = useLanguage();

  const [role, setRole] = useState<'customer' | 'collector' | 'recycler'>('customer');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!fullName.trim() || !phone.trim() || !password) {
      setErrorMessage(isUrdu ? 'تمام ضروری خانے پر کریں۔' : 'Please fill in all required fields.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage(isUrdu ? 'پاس ورڈ کم از کم 8 حروف کا ہونا چاہیے۔' : 'Password must be at least 8 characters.');
      return;
    }

    // Normalize phone number to E.164 (+92...)
    let cleanPhone = phone.trim().replace(/\s+/g, '');
    if (cleanPhone.startsWith('03')) {
      cleanPhone = '+92' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('+92')) {
      cleanPhone = '+92' + cleanPhone;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: cleanPhone,
          full_name: fullName.trim(),
          email: email.trim() || null,
          password: password,
          role: role.toUpperCase(),
        }),
      });

      if (!res.ok) {
        let msg = 'Registration failed. Please check your information.';
        try {
          const err = await res.json();
          msg = err.detail || err.message || msg;
        } catch {}
        throw new Error(msg);
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.replace('/login');
      }, 1800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. An account with this phone or email may already exist.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text flex items-center justify-center p-4 sm:p-6 font-sans transition-colors duration-200">
      <div className="max-w-md w-full bg-theme-surface rounded-3xl border border-theme-border p-6 sm:p-8 shadow-2xl space-y-6">
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

        <div className="text-center space-y-2">
          <SafaiPayLogo size="lg" className="justify-center" />
          <h2 className="text-2xl font-extrabold text-theme-text tracking-tight">
            {isUrdu ? 'نیا اکاؤنٹ بنائیں' : 'Create SafaiPay Account'}
          </h2>
          <p className="text-xs text-theme-secondary">
            {isUrdu ? 'پاکستان کے تصدیق شدہ سرکلر ویسٹ نیٹ ورک میں شامل ہوں' : 'Join Pakistan’s verified circular waste network'}
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-theme-error rounded-2xl text-xs font-semibold flex items-start space-x-2 rtl:space-x-reverse">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="p-6 bg-theme-soft-mint border border-theme-border rounded-2xl text-center space-y-2.5">
            <ShieldCheck className="w-10 h-10 text-theme-primary mx-auto" />
            <p className="text-sm font-bold text-theme-text">Registration Successful!</p>
            <p className="text-xs text-theme-secondary">
              Your account has been created. Redirecting you to the sign-in portal...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-theme-secondary uppercase tracking-wider mb-1.5">
                {isUrdu ? 'اپنا کردار منتخب کریں' : 'Select Your Platform Role'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['customer', 'collector', 'recycler'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold capitalize transition border min-h-[44px] ${
                      role === r
                        ? 'bg-theme-primary text-white border-theme-primary shadow-xs'
                        : 'bg-theme-bg text-theme-text border-theme-border hover:bg-theme-soft-mint'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-theme-secondary uppercase tracking-wider mb-1">
                {isUrdu ? 'پورا نام / تنظیم' : 'Full Name / Organization'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Mehmood"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-theme-input border border-theme-border rounded-xl pl-4 pr-11 rtl:pr-4 rtl:pl-11 py-3 text-xs text-theme-text placeholder-theme-secondary/60 focus:outline-none focus:border-theme-primary transition min-h-[48px] sm:min-h-[52px]"
                />
                <UserIcon className="w-4 h-4 text-theme-secondary absolute right-3.5 rtl:right-auto rtl:left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-theme-secondary uppercase tracking-wider mb-1">
                {isUrdu ? 'موبائل نمبر' : 'Mobile Number'}
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="+92 300 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-theme-input border border-theme-border rounded-xl pl-4 pr-11 rtl:pr-4 rtl:pl-11 py-3 text-xs text-theme-text font-mono placeholder-theme-secondary/60 focus:outline-none focus:border-theme-primary transition min-h-[48px] sm:min-h-[52px]"
                />
                <Phone className="w-4 h-4 text-theme-secondary absolute right-3.5 rtl:right-auto rtl:left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-theme-secondary uppercase tracking-wider mb-1">
                {isUrdu ? 'ای میل ایڈریس (اختیاری)' : 'Email Address (Optional)'}
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-theme-input border border-theme-border rounded-xl pl-4 pr-11 rtl:pr-4 rtl:pl-11 py-3 text-xs text-theme-text placeholder-theme-secondary/60 focus:outline-none focus:border-theme-primary transition min-h-[48px] sm:min-h-[52px]"
                />
                <Mail className="w-4 h-4 text-theme-secondary absolute right-3.5 rtl:right-auto rtl:left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-theme-secondary uppercase tracking-wider mb-1">
                {isUrdu ? 'پاس ورڈ (کم از کم 8 حروف)' : 'Password (Min 8 Characters)'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  <span>{isUrdu ? 'اکاؤنٹ بنایا جا رہا ہے...' : 'Creating Account...'}</span>
                </>
              ) : (
                <>
                  <span>{isUrdu ? 'اکاؤنٹ مکمل کریں' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-theme-border/60">
          <Link href="/login" className="text-xs text-theme-primary hover:underline font-bold inline-block py-2 min-h-[44px]">
            {isUrdu ? 'پہلے سے اکاؤنٹ موجود ہے؟ سائن ان کریں' : 'Already have an account? Sign in'}
          </Link>
        </div>
      </div>
    </div>
  );
}
