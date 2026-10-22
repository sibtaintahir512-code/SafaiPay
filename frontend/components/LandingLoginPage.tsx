'use client';

import React, { useState, useEffect } from 'react';
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
  ArrowLeft,
  User as UserIcon, 
  Eye, 
  EyeOff, 
  TrendingUp, 
  RefreshCw,
  AlertCircle,
  Truck,
  Factory
} from 'lucide-react';
import { MobileOrbitLanding } from '@/components/MobileOrbitLanding';

interface LandingLoginPageProps {
  onLogin: (identifier: string, pass: string) => Promise<void>;
  onGuestLogin?: (role: 'customer' | 'collector' | 'recycler') => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
}

export const LandingLoginPage: React.FC<LandingLoginPageProps> = ({
  onLogin,
  onGuestLogin,
  isLoading,
  errorMessage,
}) => {
  const { language, setLanguage, isUrdu } = useLanguage();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});
  const [selectedGuestRole, setSelectedGuestRole] = useState<'customer' | 'collector' | 'recycler'>('customer');
  const [isGuestSubmitting, setIsGuestSubmitting] = useState(false);

  // Optional mobile onboarding tour state (defaults to false so login and guest mode are instantly accessible)
  const [showTour, setShowTour] = useState<boolean>(false);

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

  const handleGuestSubmit = async (roleToUse: 'customer' | 'collector' | 'recycler') => {
    if (!onGuestLogin || isLoading || isGuestSubmitting) return;
    setIsGuestSubmitting(true);
    try {
      await onGuestLogin(roleToUse);
    } finally {
      setIsGuestSubmitting(false);
    }
  };

  const handleGuestRoleKeyDown = (e: React.KeyboardEvent, role: 'customer' | 'collector' | 'recycler') => {
    const roles: ('customer' | 'collector' | 'recycler')[] = ['customer', 'collector', 'recycler'];
    const currentIndex = roles.indexOf(role);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % roles.length;
      setSelectedGuestRole(roles[nextIndex]);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + roles.length) % roles.length;
      setSelectedGuestRole(roles[prevIndex]);
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      setSelectedGuestRole(role);
    }
  };

  return (
    <>
      {/* =========================================================================
          BRANCH 1: DEDICATED MOBILE VIEWPORT (< 768px / md:hidden)
          Circular Recycling Orbit Onboarding & Mobile Login
          ========================================================================= */}
      <div className="block md:hidden w-full min-h-screen">
        {showTour ? (
          <MobileOrbitLanding
            onStart={() => setShowTour(false)}
            onSignIn={() => setShowTour(false)}
            isLoading={isLoading}
          />
        ) : (
          /* Mobile Sign-in Screen (Always Directly Accessible on /login) */
          <div 
            className="min-h-screen w-full bg-[#073D3B] text-[#0F3D3E] flex flex-col items-center justify-start py-6 px-3 sm:px-6 font-sans overflow-x-hidden overflow-y-auto"
            style={{
              paddingTop: 'max(1.25rem, env(safe-area-inset-top))',
              paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
            }}
            dir={isUrdu ? 'rtl' : 'ltr'}
          >
            {/* Top Bar with Brand, Tour Toggle & Accessible Language Switcher */}
            <div className="w-[calc(100%-12px)] max-w-[420px] mx-auto flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <div className="w-8 h-8 rounded-xl bg-white p-1 flex items-center justify-center shadow-xs">
                  <SafaiPayLogoIcon className="w-full h-full text-[#16865F]" />
                </div>
                <span className="font-extrabold text-base text-white tracking-tight">SafaiPay</span>
              </div>

              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <button
                  type="button"
                  onClick={() => setShowTour(true)}
                  className="inline-flex items-center space-x-1 rtl:space-x-reverse text-[11px] font-bold text-[#9EE3C4] hover:text-white transition min-h-[44px] px-2 py-1"
                  aria-label={isUrdu ? 'پلیٹ فارم کا تعارف دیکھیں' : 'View Platform Tour'}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#F4B400]" />
                  <span>{isUrdu ? 'تعارف' : 'Tour'}</span>
                </button>

                <div 
                  className="flex items-center bg-[#0B4A47] border border-[#16605C] rounded-full p-0.5"
                  role="group"
                  aria-label="Language selection"
                >
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`min-w-[44px] h-[36px] px-2.5 text-xs font-bold rounded-full transition flex items-center justify-center ${
                      language === 'en'
                        ? 'bg-[#16865F] text-white shadow-xs'
                        : 'text-[#9EE3C4] hover:text-white'
                    }`}
                    aria-pressed={language === 'en'}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('ur')}
                    className={`min-w-[44px] h-[36px] px-2.5 text-xs font-bold rounded-full transition flex items-center justify-center ${
                      language === 'ur'
                        ? 'bg-[#16865F] text-white shadow-xs'
                        : 'text-[#9EE3C4] hover:text-white'
                    }`}
                    aria-pressed={language === 'ur'}
                  >
                    اردو
                  </button>
                </div>
              </div>
            </div>

            {/* Centered Floating White Sign-In Card (Ordered 1 through 8 strictly) */}
            <div className="w-[calc(100%-12px)] max-w-[420px] mx-auto bg-white rounded-[24px] sm:rounded-[28px] p-5 sm:p-7 shadow-[0_20px_45px_rgba(0,0,0,0.35)] border border-[#D5E6DD]">
              
              {/* 1. Header & Welcome Heading */}
              <div className="mb-5">
                <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#16865F]" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#16865F]">
                    {isUrdu ? 'ری سائیکلنگ پورٹل' : 'Recycling Portal'}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F3D3E] tracking-tight">
                  {isUrdu ? 'صفائی پے میں خوش آمدید' : 'Welcome to SafaiPay'}
                </h1>
                <p className="text-xs text-[#5B6B66] mt-1 font-medium">
                  {isUrdu 
                    ? 'اپنے ری سائیکلنگ اکاؤنٹ میں سائن ان کریں'
                    : 'Sign in to access your verified recycling portal.'}
                </p>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div 
                  role="alert"
                  className="mb-4 p-3 bg-red-50 border border-red-200 text-[#C0392B] rounded-2xl text-xs font-medium flex items-start space-x-2 rtl:space-x-reverse"
                >
                  <AlertCircle className="w-4 h-4 text-[#C0392B] shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 2. Sign-in Fields */}
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <label 
                    htmlFor="mobile-identifier"
                    className="block text-xs font-bold text-[#0F3D3E] mb-1.5"
                  >
                    {isUrdu ? 'فون نمبر یا ای میل' : 'Phone or email'}
                  </label>
                  <div className="relative">
                    <input
                      id="mobile-identifier"
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
                        fieldErrors.identifier ? 'border-red-400 focus:border-red-500' : 'border-[#D5E6DD] focus:border-[#16865F]'
                      } rounded-[14px] pl-4 pr-11 rtl:pr-4 rtl:pl-11 py-3 text-base sm:text-xs text-[#0F3D3E] placeholder-[#8A9A95] focus:outline-none focus:bg-white transition disabled:opacity-60 min-h-[48px]`}
                    />
                    <div className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-3.5 rtl:pr-0 rtl:pl-3.5 flex items-center pointer-events-none text-[#5B6B66]">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  </div>
                  {fieldErrors.identifier && (
                    <p className="text-[11px] text-red-600 mt-1 font-semibold">{fieldErrors.identifier}</p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label 
                      htmlFor="mobile-password"
                      className="text-xs font-bold text-[#0F3D3E]"
                    >
                      {isUrdu ? 'پاس ورڈ' : 'Password'}
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-[11px] text-[#16865F] hover:text-[#126E4E] font-semibold transition"
                    >
                      {isUrdu ? 'پاس ورڈ بھول گئے؟' : 'Forgot password?'}
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      id="mobile-password"
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
                        fieldErrors.password ? 'border-red-400 focus:border-red-500' : 'border-[#D5E6DD] focus:border-[#16865F]'
                      } rounded-[14px] pl-4 pr-11 rtl:pr-4 rtl:pl-11 py-3 text-base sm:text-xs text-[#0F3D3E] placeholder-[#8A9A95] focus:outline-none focus:bg-white transition disabled:opacity-60 min-h-[48px]`}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-3.5 rtl:pr-0 rtl:pl-3.5 flex items-center text-[#5B6B66] hover:text-[#16865F] transition min-h-[44px] min-w-[44px] justify-center"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-[11px] text-red-600 mt-1 font-semibold">{fieldErrors.password}</p>
                  )}
                </div>

                {/* 3. Primary Sign-in Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full min-h-[48px] sm:min-h-[52px] bg-[#16865F] hover:bg-[#126E4E] active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl shadow-md shadow-[#16865F]/25 flex items-center justify-center space-x-2 rtl:space-x-reverse transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>{isUrdu ? 'سائن ان ہو رہا ہے...' : 'Signing in...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isUrdu ? 'سائن ان کریں' : 'Sign in'}</span>
                      {isUrdu ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </>
                  )}
                </button>
              </form>

              {/* 4. Divider */}
              <div className="relative my-4 flex items-center justify-center">
                <div className="w-full border-t border-[#D5E6DD]" />
                <span className="absolute bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-[#6B817C]">
                  {isUrdu ? 'یا گیسٹ کے طور پر دیکھیں' : 'Or Explore as Guest'}
                </span>
              </div>

              {/* 5. Continue as Guest Container */}
              <div className="rounded-2xl border border-[#D5E6DD] bg-[#F4FAF7] p-3 text-left rtl:text-right space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                    <Sparkles className="w-3.5 h-3.5 text-[#16865F]" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#0F3D3E]">
                      {isUrdu ? 'گیسٹ پورٹل منتخب کریں' : 'Choose Guest Portal'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[#16865F] bg-[#E1F4EB] px-2 py-0.5 rounded-full border border-[#D5E6DD]">
                    {isUrdu ? 'فوری رسائی' : 'Instant Access'}
                  </span>
                </div>

                {/* 6. Guest Role Selector (Mobile: 1-col cards with description, sm: 3-cols) */}
                <div
                  className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1 bg-white rounded-xl border border-[#D5E6DD]"
                  role="radiogroup"
                  aria-label={isUrdu ? 'گیسٹ موڈ کا انتخاب' : 'Select guest user mode'}
                >
                  {/* Customer Option */}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selectedGuestRole === 'customer'}
                    tabIndex={selectedGuestRole === 'customer' ? 0 : -1}
                    onKeyDown={(e) => handleGuestRoleKeyDown(e, 'customer')}
                    onClick={() => setSelectedGuestRole('customer')}
                    disabled={isLoading || isGuestSubmitting}
                    className={`w-full py-2.5 px-3 rounded-lg text-left rtl:text-right sm:text-center transition-all min-h-[48px] flex items-center sm:flex-col sm:justify-center cursor-pointer relative ${
                      selectedGuestRole === 'customer'
                        ? 'bg-[#16865F] text-white shadow-xs font-bold ring-2 ring-[#16865F]/30'
                        : 'text-[#5B6B66] hover:text-[#0F3D3E] hover:bg-[#E6F4EC]/60 font-semibold bg-[#F9FCFA] border border-[#E1ECE7]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 rtl:space-x-reverse sm:flex-col sm:space-x-0 w-full justify-between sm:justify-center">
                      <div className="flex items-center space-x-2.5 rtl:space-x-reverse sm:flex-col sm:space-x-0 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          selectedGuestRole === 'customer' ? 'bg-white/20 text-white' : 'bg-[#E1F4EB] text-[#16865F]'
                        }`}>
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-extrabold block leading-tight break-words">
                            {isUrdu ? 'کسٹمر پورٹل' : 'Customer'}
                          </span>
                          <span className={`text-[10px] block sm:hidden leading-snug mt-0.5 ${
                            selectedGuestRole === 'customer' ? 'text-[#9EE3C4]' : 'text-[#7A8E89]'
                          }`}>
                            {isUrdu ? 'گھریلو ری سائیکلنگ و پک اپ' : 'Book pickups & payouts'}
                          </span>
                        </div>
                      </div>
                      {selectedGuestRole === 'customer' && (
                        <span className="text-[9px] uppercase tracking-wider font-extrabold bg-white/25 text-white px-2 py-0.5 rounded-full shrink-0">
                          {isUrdu ? 'فعال' : 'Active'}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Collector Option */}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selectedGuestRole === 'collector'}
                    tabIndex={selectedGuestRole === 'collector' ? 0 : -1}
                    onKeyDown={(e) => handleGuestRoleKeyDown(e, 'collector')}
                    onClick={() => setSelectedGuestRole('collector')}
                    disabled={isLoading || isGuestSubmitting}
                    className={`w-full py-2.5 px-3 rounded-lg text-left rtl:text-right sm:text-center transition-all min-h-[48px] flex items-center sm:flex-col sm:justify-center cursor-pointer relative ${
                      selectedGuestRole === 'collector'
                        ? 'bg-[#16865F] text-white shadow-xs font-bold ring-2 ring-[#16865F]/30'
                        : 'text-[#5B6B66] hover:text-[#0F3D3E] hover:bg-[#E6F4EC]/60 font-semibold bg-[#F9FCFA] border border-[#E1ECE7]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 rtl:space-x-reverse sm:flex-col sm:space-x-0 w-full justify-between sm:justify-center">
                      <div className="flex items-center space-x-2.5 rtl:space-x-reverse sm:flex-col sm:space-x-0 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          selectedGuestRole === 'collector' ? 'bg-white/20 text-white' : 'bg-[#E1F4EB] text-[#16865F]'
                        }`}>
                          <Truck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-extrabold block leading-tight break-words">
                            {isUrdu ? 'کولیکٹر پورٹل' : 'Collector'}
                          </span>
                          <span className={`text-[10px] block sm:hidden leading-snug mt-0.5 ${
                            selectedGuestRole === 'collector' ? 'text-[#9EE3C4]' : 'text-[#7A8E89]'
                          }`}>
                            {isUrdu ? 'علاقائی جابز اور پیمانہ وزن' : 'Accept jobs & digital scale'}
                          </span>
                        </div>
                      </div>
                      {selectedGuestRole === 'collector' && (
                        <span className="text-[9px] uppercase tracking-wider font-extrabold bg-white/25 text-white px-2 py-0.5 rounded-full shrink-0">
                          {isUrdu ? 'فعال' : 'Active'}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Recycler Option */}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selectedGuestRole === 'recycler'}
                    tabIndex={selectedGuestRole === 'recycler' ? 0 : -1}
                    onKeyDown={(e) => handleGuestRoleKeyDown(e, 'recycler')}
                    onClick={() => setSelectedGuestRole('recycler')}
                    disabled={isLoading || isGuestSubmitting}
                    className={`w-full py-2.5 px-3 rounded-lg text-left rtl:text-right sm:text-center transition-all min-h-[48px] flex items-center sm:flex-col sm:justify-center cursor-pointer relative ${
                      selectedGuestRole === 'recycler'
                        ? 'bg-[#16865F] text-white shadow-xs font-bold ring-2 ring-[#16865F]/30'
                        : 'text-[#5B6B66] hover:text-[#0F3D3E] hover:bg-[#E6F4EC]/60 font-semibold bg-[#F9FCFA] border border-[#E1ECE7]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 rtl:space-x-reverse sm:flex-col sm:space-x-0 w-full justify-between sm:justify-center">
                      <div className="flex items-center space-x-2.5 rtl:space-x-reverse sm:flex-col sm:space-x-0 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          selectedGuestRole === 'recycler' ? 'bg-white/20 text-white' : 'bg-[#E1F4EB] text-[#16865F]'
                        }`}>
                          <Factory className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-extrabold block leading-tight break-words">
                            {isUrdu ? 'ری سائیکلر پورٹل' : 'Recycler'}
                          </span>
                          <span className={`text-[10px] block sm:hidden leading-snug mt-0.5 ${
                            selectedGuestRole === 'recycler' ? 'text-[#9EE3C4]' : 'text-[#7A8E89]'
                          }`}>
                            {isUrdu ? 'صنعتی خام مال اور لاٹس' : 'Industrial raw materials'}
                          </span>
                        </div>
                      </div>
                      {selectedGuestRole === 'recycler' && (
                        <span className="text-[9px] uppercase tracking-wider font-extrabold bg-white/25 text-white px-2 py-0.5 rounded-full shrink-0">
                          {isUrdu ? 'فعال' : 'Active'}
                        </span>
                      )}
                    </div>
                  </button>
                </div>

                {/* Role Description Summary */}
                <p className="text-[11px] text-[#5B6B66] text-center px-1 font-medium leading-relaxed">
                  {selectedGuestRole === 'customer' && (isUrdu ? 'گھریلو کچرا ری سائیکل کریں، پک اپ بک کریں اور فوری ڈیجیٹل ادائیگی دیکھیں' : 'Book household scrap pickups & track instant digital payouts')}
                  {selectedGuestRole === 'collector' && (isUrdu ? 'علاقائی جابز قبول کریں، مصدقہ اسکیل وزن درج کریں اور رقم کمائیں' : 'Accept verified neighborhood jobs & record certified scale weights')}
                  {selectedGuestRole === 'recycler' && (isUrdu ? 'صنعتی فیکٹریوں کے لیے تصدیق شدہ خام مال کے بیچز خریدیں' : 'Procure industrial post-consumer verified scrap material streams')}
                </p>

                {/* 7. Dynamic Guest CTA Button */}
                <button
                  type="button"
                  disabled={isLoading || isGuestSubmitting}
                  onClick={() => handleGuestSubmit(selectedGuestRole)}
                  className="w-full bg-[#16865F] hover:bg-[#126E4E] active:scale-[0.98] text-white font-extrabold py-3.5 px-4 rounded-xl text-sm transition shadow-md shadow-[#16865F]/25 flex items-center justify-center space-x-2 rtl:space-x-reverse min-h-[48px] disabled:opacity-50 cursor-pointer"
                >
                  {isGuestSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>{isUrdu ? 'گیسٹ سائن ان ہو رہا ہے...' : 'Starting guest session...'}</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {isUrdu 
                          ? `بطور گیسٹ ${selectedGuestRole === 'customer' ? 'کسٹمر' : selectedGuestRole === 'collector' ? 'کولیکٹر' : 'ری سائیکلر'} داخل ہوں`
                          : `Sign In as Guest ${selectedGuestRole.charAt(0).toUpperCase() + selectedGuestRole.slice(1)}`}
                      </span>
                      {isUrdu ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </>
                  )}
                </button>
              </div>

              {/* 8. Supporting Text / Footer */}
              <div className="mt-5 pt-4 border-t border-[#D5E6DD] text-center space-y-2">
                <Link
                  href="/register"
                  className="text-xs text-[#16865F] hover:text-[#126E4E] font-semibold transition py-1 min-h-[44px] flex items-center justify-center"
                >
                  {isUrdu 
                    ? 'نیا اکاؤنٹ بنائیں؟ صفائی پے رجسٹریشن' 
                    : 'New to SafaiPay? Create an account'}
                </Link>
                <p className="text-[10px] text-[#8A9A95]">
                  256-Bit SSL Encrypted | Official SafaiPay Verification System
                </p>
              </div>

            </div>

            <div className="text-center py-4">
              <span className="text-[11px] text-[#9EE3C4]/70">
                SafaiPay Verified Recycling Platform • ISO 14001 Compliant
              </span>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          BRANCH 2: EXACT ORIGINAL DESKTOP & TABLET LANDING PAGE (>= 768px / hidden md:flex)
          100% Preserved: Layout, Copy, Cards, Spacing, Colors & Telemetry Metrics
          ========================================================================= */}
      <div className="hidden md:flex min-h-screen w-full flex-col lg:flex-row bg-[#F4FAF7] text-[#0F3D3E] font-sans selection:bg-[#9FE6C6] selection:text-[#0B2F30]">
        
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
          <div className="w-full max-w-[430px] mx-auto sm:mx-0 bg-white rounded-[28px] p-7 sm:p-9 shadow-[0_20px_40px_rgba(0,0,0,0.25)] border border-[#D5E6DD] text-[#0F3D3E]">
            
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
                  htmlFor="desktop-identifier"
                  className="block text-xs font-bold text-[#0F3D3E] mb-1.5"
                >
                  {isUrdu ? 'فون نمبر یا ای میل' : 'Phone or email'}
                </label>
                <div className="relative">
                  <input
                    id="desktop-identifier"
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
                    } rounded-[14px] pl-4 pr-11 rtl:pr-4 rtl:pl-11 py-3 text-base sm:text-xs text-[#0F3D3E] placeholder-[#8A9A95] focus:outline-none focus:bg-white transition disabled:opacity-60 min-h-[48px] sm:min-h-[52px]`}
                  />
                  <div className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-3.5 rtl:pr-0 rtl:pl-3.5 flex items-center pointer-events-none text-[#5B6B66]">
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
                    htmlFor="desktop-password"
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
                    id="desktop-password"
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
                    } rounded-[14px] pl-4 pr-11 rtl:pr-4 rtl:pl-11 py-3 text-base sm:text-xs text-[#0F3D3E] placeholder-[#8A9A95] focus:outline-none focus:bg-white transition disabled:opacity-60 min-h-[48px] sm:min-h-[52px]`}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-3.5 rtl:pr-0 rtl:pl-3.5 flex items-center text-[#5B6B66] hover:text-[#1B7F5C] transition min-h-[44px] min-w-[44px] justify-center"
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

            {/* Guest User Option Divider & Selector (Desktop) */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="w-full border-t border-[#D5E6DD]" />
              <span className="absolute bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-[#6B817C]">
                {isUrdu ? 'یا گیسٹ کے طور پر دیکھیں' : 'Or Explore as Guest'}
              </span>
            </div>

            <div className="rounded-2xl border border-[#D5E6DD] bg-[#F4FAF7] p-3 text-left rtl:text-right space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                  <Sparkles className="w-3.5 h-3.5 text-[#1B7F5C]" />
                  <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#0F3D3E]">
                    {isUrdu ? 'گیسٹ موڈ منتخب کریں' : 'Choose Guest Portal'}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#1B7F5C] bg-[#E1F4EB] px-2 py-0.5 rounded-full border border-[#D5E6DD]">
                  {isUrdu ? 'فوری رسائی' : 'Instant Access'}
                </span>
              </div>

              <div
                className="grid grid-cols-3 gap-1.5 p-1 bg-white rounded-xl border border-[#D5E6DD]"
                role="radiogroup"
                aria-label={isUrdu ? 'گیسٹ موڈ کا انتخاب' : 'Select guest user mode'}
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedGuestRole === 'customer'}
                  tabIndex={selectedGuestRole === 'customer' ? 0 : -1}
                  onKeyDown={(e) => handleGuestRoleKeyDown(e, 'customer')}
                  onClick={() => setSelectedGuestRole('customer')}
                  disabled={isLoading || isGuestSubmitting}
                  className={`py-2 px-1.5 rounded-lg text-center transition-all min-h-[44px] flex flex-col items-center justify-center cursor-pointer relative ${
                    selectedGuestRole === 'customer'
                      ? 'bg-[#16865F] text-white shadow-xs font-bold ring-2 ring-[#16865F]/30'
                      : 'text-[#5B6B66] hover:text-[#0F3D3E] hover:bg-[#E6F4EC]/60 font-semibold'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5 mb-0.5 shrink-0" />
                  <span className="text-[11px] leading-tight truncate">
                    {isUrdu ? 'کسٹمر' : 'Customer'}
                  </span>
                  {selectedGuestRole === 'customer' && (
                    <span className="text-[8px] uppercase tracking-wider font-extrabold bg-white/20 text-white px-1 py-0.2 rounded-full mt-0.5">
                      {isUrdu ? 'فعال' : 'Active'}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedGuestRole === 'collector'}
                  tabIndex={selectedGuestRole === 'collector' ? 0 : -1}
                  onKeyDown={(e) => handleGuestRoleKeyDown(e, 'collector')}
                  onClick={() => setSelectedGuestRole('collector')}
                  disabled={isLoading || isGuestSubmitting}
                  className={`py-2 px-1.5 rounded-lg text-center transition-all min-h-[44px] flex flex-col items-center justify-center cursor-pointer relative ${
                    selectedGuestRole === 'collector'
                      ? 'bg-[#16865F] text-white shadow-xs font-bold ring-2 ring-[#16865F]/30'
                      : 'text-[#5B6B66] hover:text-[#0F3D3E] hover:bg-[#E6F4EC]/60 font-semibold'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5 mb-0.5 shrink-0" />
                  <span className="text-[11px] leading-tight truncate">
                    {isUrdu ? 'کولیکٹر' : 'Collector'}
                  </span>
                  {selectedGuestRole === 'collector' && (
                    <span className="text-[8px] uppercase tracking-wider font-extrabold bg-white/20 text-white px-1 py-0.2 rounded-full mt-0.5">
                      {isUrdu ? 'فعال' : 'Active'}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedGuestRole === 'recycler'}
                  tabIndex={selectedGuestRole === 'recycler' ? 0 : -1}
                  onKeyDown={(e) => handleGuestRoleKeyDown(e, 'recycler')}
                  onClick={() => setSelectedGuestRole('recycler')}
                  disabled={isLoading || isGuestSubmitting}
                  className={`py-2 px-1.5 rounded-lg text-center transition-all min-h-[44px] flex flex-col items-center justify-center cursor-pointer relative ${
                    selectedGuestRole === 'recycler'
                      ? 'bg-[#16865F] text-white shadow-xs font-bold ring-2 ring-[#16865F]/30'
                      : 'text-[#5B6B66] hover:text-[#0F3D3E] hover:bg-[#E6F4EC]/60 font-semibold'
                  }`}
                >
                  <Factory className="w-3.5 h-3.5 mb-0.5 shrink-0" />
                  <span className="text-[11px] leading-tight truncate">
                    {isUrdu ? 'ری سائیکلر' : 'Recycler'}
                  </span>
                  {selectedGuestRole === 'recycler' && (
                    <span className="text-[8px] uppercase tracking-wider font-extrabold bg-white/20 text-white px-1 py-0.2 rounded-full mt-0.5">
                      {isUrdu ? 'فعال' : 'Active'}
                    </span>
                  )}
                </button>
              </div>

              <p className="text-[10px] text-[#5B6B66] text-center px-1 font-medium leading-tight">
                {selectedGuestRole === 'customer' && (isUrdu ? 'گھریلو کچرا ری سائیکل کریں، پک اپ بک کریں اور ادائیگی دیکھیں' : 'Book household scrap pickups & track digital payouts')}
                {selectedGuestRole === 'collector' && (isUrdu ? 'علاقائی جابز قبول کریں، اسکیل وزن ریکارڈ کریں اور کمائیں' : 'Accept verified neighborhood jobs & record scale weights')}
                {selectedGuestRole === 'recycler' && (isUrdu ? 'صنعتی ری سائیکلرز کے لیے تصدیق شدہ خام مال بیچز' : 'Procure industrial post-consumer verified material streams')}
              </p>

              <button
                type="button"
                disabled={isLoading || isGuestSubmitting}
                onClick={() => handleGuestSubmit(selectedGuestRole)}
                className="w-full bg-white hover:bg-[#E6F4EC] text-[#1B7F5C] border border-[#1B7F5C] font-extrabold py-2.5 px-3 rounded-xl text-xs transition flex items-center justify-center space-x-1.5 rtl:space-x-reverse min-h-[44px] shadow-2xs hover:shadow-xs active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {isGuestSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#1B7F5C]" />
                    <span>{isUrdu ? 'گیسٹ سائن ان ہو رہا ہے...' : 'Starting guest session...'}</span>
                  </>
                ) : (
                  <>
                    <span>
                      {isUrdu 
                        ? `بطور ${selectedGuestRole === 'customer' ? 'کسٹمر' : selectedGuestRole === 'collector' ? 'کولیکٹر' : 'ری سائیکلر'} داخل ہوں`
                        : `Sign In as Guest ${selectedGuestRole.charAt(0).toUpperCase() + selectedGuestRole.slice(1)}`}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

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

            {/* Security note */}
            <div className="mt-4 text-center">
              <p className="text-[10px] text-[#8A9A95]">
                256-Bit SSL Encrypted | Official SafaiPay Verification System
              </p>
            </div>

          </div>

        </div>

      </div>
    </>
  );
};
