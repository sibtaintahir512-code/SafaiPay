'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SafaiPayLogo, SafaiPayLogoIcon } from '@/components/SafaiPayLogo';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Sparkles, 
  ShieldCheck, 
  Scale, 
  ScanLine, 
  CheckCircle2, 
  ArrowRight, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  TrendingUp, 
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
  const { language, setLanguage, t, isUrdu } = useLanguage();
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F4FAF7] text-[#0F3D3E] font-sans selection:bg-[#9FE6C6] selection:text-[#0B2F30]">
      
      {/* ================= LEFT SECTION (HERO & VERIFIED PLATFORM VALUE) ================= */}
      <div className="flex-1 relative overflow-hidden bg-[#F4FAF7] px-6 sm:px-10 lg:px-14 py-10 lg:py-16 flex flex-col justify-center">
        
        {/* Decorative Circles in #E6F4EC */}
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-[#E6F4EC] pointer-events-none opacity-80" />
        <div className="absolute -bottom-40 right-10 w-[520px] h-[520px] rounded-full bg-[#E6F4EC] pointer-events-none opacity-60" />
        <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full bg-[#E6F4EC] pointer-events-none opacity-40 blur-sm" />

        <div className="relative z-10 max-w-2xl mx-auto lg:mx-0 space-y-7">
          
          {/* Header Brand & Category Tag */}
          <div className="space-y-3.5">
            <SafaiPayLogo size="lg" />

            <div>
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white border border-[#D5E6DD] text-xs font-bold text-[#1B7F5C] shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#2FA37A] animate-pulse" />
                <span className="tracking-wider uppercase text-[10px]">
                  Smart Recycling Platform
                </span>
              </div>
            </div>
          </div>

          {/* Headline & Mission */}
          <div className="space-y-3.5">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F3D3E] leading-[1.14]">
              Turn waste into{' '}
              <span className="bg-gradient-to-r from-[#1B7F5C] to-[#2FA37A] bg-clip-text text-transparent">
                verified value.
              </span>
            </h1>

            <p className="text-[#3F5A52] text-sm sm:text-base leading-relaxed max-w-xl">
              Book doorstep recyclables collection, leverage computer-vision AI waste classification, certified digital scale weight verification, and transparent real-time pricing—building digital income identities for informal waste collectors across urban hubs.
            </p>
          </div>

          {/* HERO DATA CARD: Real-time collection metrics */}
          <div className="bg-[#0F3D3E] text-white rounded-3xl p-6 shadow-[0_15px_30px_rgba(15,61,62,0.18)] border border-[#1F4A4B] relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#6EE7B7] animate-ping" />
                <span className="text-xs uppercase font-bold tracking-wider text-[#9FE6C6]">
                  Verified Batch Operations
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#072021]/60 text-[#6EE7B7] border border-[#2FA37A]/40 text-xs font-semibold flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#6EE7B7]" />
                <span>Ready for Industrial Recyclers</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#072021]/55 rounded-2xl p-4 border border-[#1F4A4B]/60 mb-4">
              <div>
                <span className="text-[11px] text-[#9DB8AE] block mb-0.5">Material Stream</span>
                <p className="text-base font-bold text-white">PET Plastic</p>
                <span className="text-[10px] text-[#9FE6C6]">Post-consumer resin</span>
              </div>
              <div>
                <span className="text-[11px] text-[#9DB8AE] block mb-0.5">Scale Certified</span>
                <p className="text-base font-bold text-[#6EE7B7] font-mono">10.0 kg verified</p>
                <span className="text-[10px] text-[#9FE6C6]/90">Sensor scale</span>
              </div>
              <div>
                <span className="text-[11px] text-[#9DB8AE] block mb-0.5">AI Classification</span>
                <p className="text-base font-bold text-white flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#9FE6C6]" />
                  <span>AI matched</span>
                </p>
                <span className="text-[10px] text-[#9FE6C6]">98.4% Confidence</span>
              </div>
              <div>
                <span className="text-[11px] text-[#9DB8AE] block mb-0.5">Deterministic Price</span>
                <p className="text-base font-bold text-[#F2A900] font-mono">Rs 800.00</p>
                <span className="text-[10px] text-[#F2A900]/90">Transparent rate</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[#9FE6C6]/90 pt-1">
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-[#6EE7B7]" />
                <span>Chain-of-Custody Digital Receipt #SP-2026-PET10</span>
              </span>
              <span className="text-[11px] font-mono text-[#9DB8AE]">Karachi Hub 4</span>
            </div>
          </div>

          {/* THREE FEATURE HIGHLIGHTS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            <div className="bg-white border border-[#D5E6DD] border-l-[5px] border-l-[#F2A900] rounded-2xl p-4 shadow-eco-sm">
              <div className="w-8 h-8 rounded-xl bg-[#E6F4EC] text-[#1B7F5C] flex items-center justify-center mb-2.5">
                <ScanLine className="w-4 h-4 text-[#1B7F5C]" />
              </div>
              <h3 className="text-sm font-bold text-[#0F3D3E] mb-0.5">AI scan</h3>
              <p className="text-xs text-[#5B6B66] leading-snug">
                Computer-vision identifies recyclable grade and contamination before dispatch.
              </p>
            </div>

            <div className="bg-white border border-[#D5E6DD] border-l-[5px] border-l-[#2FA37A] rounded-2xl p-4 shadow-eco-sm">
              <div className="w-8 h-8 rounded-xl bg-[#E6F4EC] text-[#1B7F5C] flex items-center justify-center mb-2.5">
                <Scale className="w-4 h-4 text-[#1B7F5C]" />
              </div>
              <h3 className="text-sm font-bold text-[#0F3D3E] mb-0.5">Verified scale</h3>
              <p className="text-xs text-[#5B6B66] leading-snug">
                Calibrated sensor hanging scales eliminate doorstep weight disputes.
              </p>
            </div>

            <div className="bg-white border border-[#D5E6DD] border-l-[5px] border-l-[#0F3D3E] rounded-2xl p-4 shadow-eco-sm">
              <div className="w-8 h-8 rounded-xl bg-[#E6F4EC] text-[#1B7F5C] flex items-center justify-center mb-2.5">
                <TrendingUp className="w-4 h-4 text-[#1B7F5C]" />
              </div>
              <h3 className="text-sm font-bold text-[#0F3D3E] mb-0.5">Fair price</h3>
              <p className="text-xs text-[#5B6B66] leading-snug">
                Real-time scrap benchmark rates ensure guaranteed transparent settlement.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* ================= RIGHT SECTION (CLEAN PRODUCTION SIGN-IN FORM) ================= */}
      <div className="w-full lg:w-[480px] xl:w-[520px] bg-[#0F3D3E] flex items-center justify-center p-4 sm:p-8 lg:p-10 shrink-0">
        
        {/* Floating White Card (Radius 28px) */}
        <div className="w-full max-w-[430px] mx-3.5 sm:mx-0 bg-white rounded-[28px] p-7 sm:p-9 shadow-[0_20px_40px_rgba(0,0,0,0.25)] border border-[#D5E6DD] text-[#0F3D3E]">
          
          {/* Top Bar with Language Switcher */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <SafaiPayLogoIcon className="w-9 h-9 shadow-md shadow-[#1B7F5C]/20" />
              <span className="font-extrabold text-lg text-[#0F3D3E] tracking-tight">SafaiPay</span>
            </div>

            {/* Optional Language Switcher */}
            <div className="flex items-center bg-[#F4FAF7] border border-[#D5E6DD] rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 text-xs font-bold rounded-lg transition ${
                  language === 'en'
                    ? 'bg-[#1B7F5C] text-white shadow-xs'
                    : 'text-[#5B6B66] hover:text-[#0F3D3E]'
                }`}
                title="Switch to English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ur')}
                className={`px-2 py-0.5 text-xs font-bold rounded-lg transition ${
                  language === 'ur'
                    ? 'bg-[#1B7F5C] text-white shadow-xs'
                    : 'text-[#5B6B66] hover:text-[#0F3D3E]'
                }`}
                title="اردو میں تبدیل کریں"
              >
                اردو
              </button>
            </div>
          </div>

          {/* Welcome Heading */}
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-[#0F3D3E] tracking-tight">
              {isUrdu ? 'صفائی پے میں خوش آمدید' : 'Welcome to SafaiPay'}
            </h2>
            <p className="text-xs text-[#5B6B66] mt-1 font-medium">
              {isUrdu 
                ? 'اپنے ری سائیکلنگ اکاؤنٹ میں سائن ان کریں'
                : 'Sign in to access your verified recycling portal.'}
            </p>
          </div>

          {/* Generic Error Message Alert */}
          {errorMessage && (
            <div 
              role="alert"
              className="mb-5 p-3.5 bg-red-50 border border-red-200 text-[#C0392B] rounded-2xl text-xs font-medium flex items-start space-x-2"
            >
              <AlertCircle className="w-4 h-4 text-[#C0392B] shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Sign-in Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            
            {/* Phone or Email Field */}
            <div>
              <label 
                htmlFor="identifier"
                className="block text-xs font-bold text-[#0F3D3E] mb-1.5"
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
                  className={`w-full bg-[#F4FAF7] border ${
                    fieldErrors.identifier ? 'border-red-400 focus:border-red-500' : 'border-[#D5E6DD] focus:border-[#1B7F5C]'
                  } rounded-[14px] px-4 py-3 text-xs text-[#0F3D3E] placeholder-[#8A9A95] focus:outline-none focus:bg-white transition disabled:opacity-60`}
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#5B6B66]">
                  <UserIcon className="w-4 h-4" />
                </div>
              </div>
              {fieldErrors.identifier && (
                <p className="text-[11px] text-red-600 mt-1">{fieldErrors.identifier}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label 
                  htmlFor="password"
                  className="text-xs font-bold text-[#0F3D3E]"
                >
                  {isUrdu ? 'پاس ورڈ' : 'Password'}
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-[#1B7F5C] hover:text-[#146B4D] font-semibold transition"
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
                  className={`w-full bg-[#F4FAF7] border ${
                    fieldErrors.password ? 'border-red-400 focus:border-red-500' : 'border-[#D5E6DD] focus:border-[#1B7F5C]'
                  } rounded-[14px] px-4 py-3 text-xs text-[#0F3D3E] placeholder-[#8A9A95] focus:outline-none focus:bg-white transition disabled:opacity-60`}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#5B6B66] hover:text-[#1B7F5C] transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-[11px] text-red-600 mt-1">{fieldErrors.password}</p>
              )}
            </div>

            {/* Primary Sign-in Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1B7F5C] hover:bg-[#146B4D] text-white font-bold py-3.5 rounded-[14px] text-sm transition shadow-md shadow-[#1B7F5C]/25 flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed mt-3"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>{isUrdu ? 'سائن ان ہو رہا ہے...' : 'Signing in...'}</span>
                </>
              ) : (
                <>
                  <span>{isUrdu ? 'سائن ان کریں' : 'Sign in'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Create Account Link */}
          <div className="mt-6 pt-5 border-t border-[#D5E6DD] text-center">
            <Link
              href="/register"
              className="text-xs text-[#1B7F5C] hover:text-[#146B4D] font-semibold transition inline-block"
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
