'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SafaiPayLogo, SafaiPayLogoIcon } from '@/components/SafaiPayLogo';
import { CircularRecyclingOrbit } from '@/components/CircularRecyclingOrbit';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { 
  Sparkles, 
  ShieldCheck, 
  Scale, 
  ArrowRight, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface LandingLoginPageProps {
  onLogin: (identifier: string, pass: string) => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
}

export const LandingLoginPage: React.FC<LandingLoginPageProps> = ({
  onLogin,
  isLoading,
  errorMessage,
}) => {
  const { language, setLanguage, isUrdu } = useLanguage();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});

  const validate = (): boolean => {
    const errors: { identifier?: string; password?: string } = {};
    if (!identifier.trim()) {
      errors.identifier = isUrdu ? 'فون نمبر یا ای میل درج کریں' : 'Please enter your phone number or email address.';
    }
    if (!password) {
      errors.password = isUrdu ? 'پاس ورڈ درج کریں' : 'Please enter your account password.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!validate()) return;
    await onLogin(identifier.trim(), password);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-theme-bg text-theme-text font-sans transition-colors duration-200">
      
      {/* ================= LEFT SECTION (HERO & CIRCULAR RECYCLING ORBIT) ================= */}
      <div className="flex-1 relative overflow-hidden bg-theme-bg px-6 sm:px-10 lg:px-14 py-10 lg:py-16 flex flex-col justify-center">
        
        {/* Decorative Circles */}
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-theme-soft-mint/60 pointer-events-none blur-2xl" />
        <div className="absolute -bottom-40 right-10 w-[520px] h-[520px] rounded-full bg-theme-soft-mint/40 pointer-events-none blur-2xl" />

        <div className="relative z-10 max-w-2xl mx-auto lg:mx-0 space-y-6">
          
          {/* Header Brand & Category Tag */}
          <div className="space-y-3">
            <SafaiPayLogo size="lg" isDark={isDark} />

            <div>
              <div className="inline-flex items-center space-x-2 rtl:space-x-reverse px-3.5 py-1.5 rounded-full bg-theme-surface border border-theme-border text-xs font-bold text-theme-primary shadow-xs">
                <span className="w-2 h-2 rounded-full bg-theme-primary animate-pulse" />
                <span className="tracking-wider uppercase text-[10px]">
                  Smart Recycling Platform
                </span>
              </div>
            </div>
          </div>

          {/* Headline & Mission */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-theme-text leading-[1.15]">
              Turn waste into{' '}
              <span className="bg-gradient-to-r from-theme-primary to-theme-bright-green bg-clip-text text-transparent">
                verified value.
              </span>
            </h1>

            <p className="text-theme-secondary text-sm sm:text-base leading-relaxed max-w-xl">
              Book doorstep recyclables collection, leverage computer-vision AI waste classification, certified digital scale weight verification, and transparent real-time pricing—building digital income identities for informal waste collectors across urban hubs.
            </p>
          </div>

          {/* Circular Recycling Orbit Graphic */}
          <div className="py-2">
            <CircularRecyclingOrbit />
          </div>

        </div>
      </div>

      {/* ================= RIGHT SECTION (AUTHENTICATION & CONTROLS) ================= */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 bg-theme-surface/60 backdrop-blur-md lg:border-l rtl:lg:border-r rtl:lg:border-l-0 border-theme-border">
        
        <div className="w-full max-w-[440px] bg-theme-surface rounded-[28px] p-7 sm:p-9 shadow-theme-card border border-theme-border text-theme-text transition-colors">
          
          {/* Top Bar with Language Switcher and Theme Switcher */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-theme-border/60">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <SafaiPayLogoIcon className="w-8 h-8 shadow-sm" />
              <span className="font-extrabold text-base text-theme-text tracking-tight">SafaiPay</span>
            </div>

            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              {/* Theme Switcher Compact */}
              <ThemeSwitcher variant="compact" />

              {/* Language Switcher */}
              <div className="flex items-center bg-theme-bg border border-theme-border rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`min-h-[44px] min-w-[36px] sm:min-h-0 sm:min-w-0 px-2 py-0.5 text-xs font-bold rounded-lg transition ${
                    language === 'en'
                      ? 'bg-theme-primary text-white shadow-xs'
                      : 'text-theme-secondary hover:text-theme-text'
                  }`}
                  title="Switch to English"
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('ur')}
                  className={`min-h-[44px] min-w-[36px] sm:min-h-0 sm:min-w-0 px-2 py-0.5 text-xs font-bold rounded-lg transition ${
                    language === 'ur'
                      ? 'bg-theme-primary text-white shadow-xs'
                      : 'text-theme-secondary hover:text-theme-text'
                  }`}
                  title="اردو میں تبدیل کریں"
                >
                  اردو
                </button>
              </div>
            </div>
          </div>

          {/* Welcome Heading */}
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-theme-text tracking-tight">
              {isUrdu ? 'صفائی پے میں خوش آمدید' : 'Welcome to SafaiPay'}
            </h2>
            <p className="text-xs text-theme-secondary mt-1 font-medium">
              {isUrdu 
                ? 'اپنے ری سائیکلنگ اکاؤنٹ میں سائن ان کریں'
                : 'Sign in to access your verified recycling portal.'}
            </p>
          </div>

          {/* Generic Error Message Alert */}
          {errorMessage && (
            <div 
              role="alert"
              className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/40 border border-theme-error/40 text-theme-error rounded-2xl text-xs font-medium flex items-start space-x-2 rtl:space-x-reverse"
            >
              <AlertCircle className="w-4 h-4 text-theme-error shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Sign-in Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            
            {/* Phone or Email Field */}
            <div>
              <label 
                htmlFor="identifier"
                className="block text-xs font-bold text-theme-text mb-1.5"
              >
                {isUrdu ? 'فون نمبر یا ای میل' : 'Phone or email'}
              </label>
              <div className="relative">
                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  placeholder="+92 300 1234567 or user@example.com"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (fieldErrors.identifier) setFieldErrors({ ...fieldErrors, identifier: undefined });
                  }}
                  disabled={isLoading}
                  className={`w-full bg-theme-input border ${
                    fieldErrors.identifier ? 'border-theme-error focus:border-theme-error' : 'border-theme-border focus:border-theme-focus'
                  } rounded-[14px] px-4 py-3.5 text-xs text-theme-text placeholder:text-theme-secondary/60 focus:outline-none transition min-h-[44px] disabled:opacity-60`}
                />
                <div className="absolute inset-y-0 right-0 rtl:left-0 rtl:right-auto pr-3.5 rtl:pl-3.5 flex items-center pointer-events-none text-theme-secondary">
                  <UserIcon className="w-4 h-4" />
                </div>
              </div>
              {fieldErrors.identifier && (
                <p className="text-[11px] text-theme-error mt-1">{fieldErrors.identifier}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label 
                  htmlFor="password"
                  className="text-xs font-bold text-theme-text"
                >
                  {isUrdu ? 'پاس ورڈ' : 'Password'}
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-theme-primary hover:underline font-semibold transition"
                >
                  {isUrdu ? 'پاس ورڈ بھول گئے؟' : 'Forgot password?'}
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                  }}
                  disabled={isLoading}
                  className={`w-full bg-theme-input border ${
                    fieldErrors.password ? 'border-theme-error focus:border-theme-error' : 'border-theme-border focus:border-theme-focus'
                  } rounded-[14px] px-4 py-3.5 text-xs text-theme-text placeholder:text-theme-secondary/60 focus:outline-none transition min-h-[44px] disabled:opacity-60`}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="min-h-[44px] min-w-[44px] absolute inset-y-0 right-0 rtl:left-0 rtl:right-auto pr-3.5 rtl:pl-3.5 flex items-center justify-center text-theme-secondary hover:text-theme-primary transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-[11px] text-theme-error mt-1">{fieldErrors.password}</p>
              )}
            </div>

            {/* Primary Sign-in Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-theme-primary hover:opacity-95 text-white font-bold py-3.5 rounded-[14px] text-sm transition shadow-md flex items-center justify-center space-x-2 rtl:space-x-reverse disabled:opacity-60 disabled:cursor-not-allowed mt-3 min-h-[48px]"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>{isUrdu ? 'سائن ان ہو رہا ہے...' : 'Signing in...'}</span>
                </>
              ) : (
                <>
                  <span>{isUrdu ? 'سائن ان کریں' : 'Sign in'}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </>
              )}
            </button>
          </form>

          {/* Create Account Link */}
          <div className="mt-6 pt-5 border-t border-theme-border text-center">
            <Link
              href="/register"
              className="text-xs text-theme-primary hover:underline font-semibold transition inline-block py-1 min-h-[44px] flex items-center justify-center"
            >
              {isUrdu 
                ? 'نیا اکاؤنٹ بنائیں؟ صفائی پے رجسٹریشن' 
                : 'New to SafaiPay? Create an account'}
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
};
