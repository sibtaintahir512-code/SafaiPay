'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Factory,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { MobileOrbitLanding } from '@/components/MobileOrbitLanding';

interface LandingLoginPageProps {
  initialView?: 'landing' | 'signin';
  onLogin: (identifier: string, pass: string) => Promise<void>;
  onGuestLogin?: (role: 'customer' | 'collector' | 'recycler') => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
}

export const LandingLoginPage: React.FC<LandingLoginPageProps> = ({
  initialView = 'landing',
  onLogin,
  onGuestLogin,
  isLoading,
  errorMessage,
}) => {
  const router = useRouter();
  const { language, setLanguage, isUrdu } = useLanguage();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});
  const [selectedGuestRole, setSelectedGuestRole] = useState<'customer' | 'collector' | 'recycler'>('customer');
  const [isGuestSubmitting, setIsGuestSubmitting] = useState(false);

  // Mobile View state: defaults to 'landing' on / and 'signin' on /login
  const [mobileView, setMobileView] = useState<'landing' | 'signin' | 'tour'>(
    initialView === 'signin' ? 'signin' : 'landing'
  );

  // Desktop Tour Modal state
  const [showDesktopTour, setShowDesktopTour] = useState<boolean>(false);
  const [tourStep, setTourStep] = useState<number>(1);

  // Handle browser back / forward buttons (popstate) between landing and signin
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        if (window.location.pathname === '/login') {
          setMobileView('signin');
        } else {
          setMobileView('landing');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update mobileView if initialView changes
  useEffect(() => {
    if (initialView === 'signin') {
      setMobileView('signin');
    }
  }, [initialView]);

  const handleGoToSignIn = () => {
    setMobileView('signin');
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      router.push('/login');
    }
  };

  const handleGoToLanding = () => {
    setMobileView('landing');
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      router.push('/');
    }
  };

  const handleGoToTour = () => {
    setTourStep(1);
    setMobileView('tour');
  };

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
    <div 
      id="landing-page"
      className="landing-page fixed inset-0 w-[100vw] h-[100dvh] max-w-[100vw] max-h-[100dvh] overflow-hidden select-none font-sans z-0"
      style={{
        width: '100vw',
        height: '100dvh',
        maxWidth: '100vw',
        maxHeight: '100dvh',
        overflow: 'hidden',
      }}
    >
      {/* =========================================================================
          BRANCH 1: DEDICATED MOBILE VIEWPORT (< 768px / md:hidden)
          1. Landing Page (Default: "Take a Tour" & "Sign In" clearly visible)
          2. Tour Flow (Onboarding walkthrough)
          3. Sign-In Page (With Back button to Landing)
          ========================================================================= */}
      <div className="block md:hidden w-[100vw] h-[100dvh] max-w-[100vw] max-h-[100dvh] bg-[#073D3B] text-[#0F3D3E] overflow-hidden">
        
        {/* VIEW 1: MOBILE LANDING PAGE (Presented FIRST to Mobile Users) */}
        {mobileView === 'landing' && (
          <MobileOrbitLanding
            onTour={handleGoToTour}
            onStart={handleGoToTour}
            onSignIn={handleGoToSignIn}
            isLoading={isLoading}
          />
        )}

        {/* VIEW 2: INTERACTIVE TOUR FLOW */}
        {mobileView === 'tour' && (
          <div 
            className="w-full h-full max-h-[100dvh] bg-[#073D3B] text-white flex flex-col justify-between py-[clamp(0.6rem,2vh,1.25rem)] px-4 overflow-hidden"
            style={{
              paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
              paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
            }}
            dir={isUrdu ? 'rtl' : 'ltr'}
          >
            {/* Tour Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#16605C] shrink-0">
              <button
                type="button"
                onClick={handleGoToLanding}
                className="inline-flex items-center space-x-1.5 rtl:space-x-reverse text-xs font-bold text-[#9EE3C4] hover:text-white transition min-h-[44px] px-2 py-1"
                aria-label={isUrdu ? 'ہوم پر واپس جائیں' : 'Back to Home'}
              >
                {isUrdu ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                <span>{isUrdu ? 'ہوم پر جائیں' : 'Back'}</span>
              </button>

              <span className="text-xs font-extrabold uppercase tracking-wider text-[#9EE3C4]">
                {isUrdu ? `مرحلہ ${tourStep} از 3` : `Step ${tourStep} of 3`}
              </span>

              <button
                type="button"
                onClick={handleGoToLanding}
                className="w-9 h-9 rounded-full bg-[#0B4A47] text-[#9EE3C4] hover:text-white flex items-center justify-center transition"
                aria-label="Close Tour"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tour Step Cards (Interactive Carousel) */}
            <div className="flex-1 flex flex-col items-center justify-center py-4 my-auto">
              {tourStep === 1 && (
                <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-[#0F3D3E] shadow-2xl border border-[#D5E6DD] space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-12 h-12 rounded-2xl bg-[#E6F4EC] text-[#16865F] flex items-center justify-center shadow-xs">
                    <ScanLine className="w-6 h-6 max-w-full" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#E1F4EB] text-[#16865F] px-2.5 py-1 rounded-full inline-block">
                    {isUrdu ? 'پہلا مرحلہ' : 'Step 1: AI Waste Scan'}
                  </span>
                  <h2 className="text-xl font-extrabold tracking-tight text-[#0F3D3E]">
                    {isUrdu ? 'اے آئی کے ذریعے کچرے کی جانچ' : 'Computer-Vision AI Classification'}
                  </h2>
                  <p className="text-xs text-[#5B6B66] leading-relaxed">
                    {isUrdu 
                      ? 'موبائل کیمرے سے کچرے کا گریڈ، مٹیریل کی قسم اور آلودگی پہلے ہی شناخت ہو جاتی ہے۔' 
                      : 'Real-time computer vision identifies plastic grades, paper, and metal scrap before dispatch.'}
                  </p>
                  <div className="p-2.5 rounded-xl bg-[#F4FAF7] border border-[#D5E6DD] text-[11px] text-[#16865F] font-bold flex items-center space-x-2 rtl:space-x-reverse">
                    <Sparkles className="w-4 h-4 text-[#F2A900] shrink-0" />
                    <span>98.4% Material Confidence Match</span>
                  </div>
                </div>
              )}

              {tourStep === 2 && (
                <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-[#0F3D3E] shadow-2xl border border-[#D5E6DD] space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-12 h-12 rounded-2xl bg-[#E6F4EC] text-[#16865F] flex items-center justify-center shadow-xs">
                    <Scale className="w-6 h-6 max-w-full" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#E1F4EB] text-[#16865F] px-2.5 py-1 rounded-full inline-block">
                    {isUrdu ? 'دوسرا مرحلہ' : 'Step 2: Verified Scale'}
                  </span>
                  <h2 className="text-xl font-extrabold tracking-tight text-[#0F3D3E]">
                    {isUrdu ? 'مصدقہ اسکیل سے درست وزن' : 'Doorstep Certified Hanging Scale'}
                  </h2>
                  <p className="text-xs text-[#5B6B66] leading-relaxed">
                    {isUrdu 
                      ? 'بلوٹوتھ سے منسلک کیلیبریٹڈ ہینگنگ اسکیل دہلیز پر وزن کی تمام خرابیاں اور تنازعات ختم کرتا ہے۔' 
                      : 'Bluetooth-connected digital hanging scale guarantees exact sensor-verified weight.'}
                  </p>
                  <div className="p-2.5 rounded-xl bg-[#F4FAF7] border border-[#D5E6DD] text-[11px] text-[#16865F] font-bold flex items-center space-x-2 rtl:space-x-reverse">
                    <CheckCircle2 className="w-4 h-4 text-[#16865F] shrink-0" />
                    <span>0.1 kg Calibrated Accuracy</span>
                  </div>
                </div>
              )}

              {tourStep === 3 && (
                <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-[#0F3D3E] shadow-2xl border border-[#D5E6DD] space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-12 h-12 rounded-2xl bg-[#E6F4EC] text-[#16865F] flex items-center justify-center shadow-xs">
                    <TrendingUp className="w-6 h-6 max-w-full" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#E1F4EB] text-[#16865F] px-2.5 py-1 rounded-full inline-block">
                    {isUrdu ? 'تیسرا مرحلہ' : 'Step 3: Instant Payout'}
                  </span>
                  <h2 className="text-xl font-extrabold tracking-tight text-[#0F3D3E]">
                    {isUrdu ? 'شفاف قیمت اور فوری ادائیگی' : 'Guaranteed Price & Digital Settlement'}
                  </h2>
                  <p className="text-xs text-[#5B6B66] leading-relaxed">
                    {isUrdu 
                      ? 'اسکریپ مارکیٹ کے ریئل ٹائم ریٹس اور مکمل ڈیجیٹل رسید کے ساتھ فوری محفوظ ڈیجیٹل ادائیگی۔' 
                      : 'Real-time scrap market benchmark pricing with immutable digital receipts.'}
                  </p>
                  <div className="p-2.5 rounded-xl bg-[#F4FAF7] border border-[#D5E6DD] text-[11px] text-[#16865F] font-bold flex items-center space-x-2 rtl:space-x-reverse">
                    <ShieldCheck className="w-4 h-4 text-[#16865F] shrink-0" />
                    <span>100% Chain-of-Custody Protected</span>
                  </div>
                </div>
              )}
            </div>

            {/* Tour Bottom Controls */}
            <div className="space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setTourStep(prev => Math.max(1, prev - 1))}
                  disabled={tourStep === 1}
                  className="px-4 py-2 rounded-xl bg-[#0B4A47] text-white text-xs font-bold disabled:opacity-30 min-h-[44px]"
                >
                  {isUrdu ? 'پچھلا' : 'Previous'}
                </button>

                <div className="flex space-x-1.5 rtl:space-x-reverse">
                  {[1, 2, 3].map(step => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => setTourStep(step)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        tourStep === step ? 'w-6 bg-[#9EE3C4]' : 'bg-white/30'
                      }`}
                      aria-label={`Go to slide ${step}`}
                    />
                  ))}
                </div>

                {tourStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setTourStep(prev => Math.min(3, prev + 1))}
                    className="px-4 py-2 rounded-xl bg-[#16865F] text-white text-xs font-bold min-h-[44px]"
                  >
                    {isUrdu ? 'اگلا' : 'Next'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleGoToSignIn}
                    className="px-4 py-2 rounded-xl bg-[#F2A900] text-[#0F3D3E] text-xs font-extrabold min-h-[44px]"
                  >
                    {isUrdu ? 'سائن ان' : 'Sign In'}
                  </button>
                )}
              </div>

              {/* Action Button: Proceed to Sign In */}
              <button
                type="button"
                onClick={handleGoToSignIn}
                className="w-full min-h-[48px] bg-[#16865F] hover:bg-[#126E4E] active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 rtl:space-x-reverse cursor-pointer"
              >
                <span>{isUrdu ? 'سائن ان کی طرف جائیں' : 'Proceed to Sign In'}</span>
                {isUrdu ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: MOBILE SIGN-IN SCREEN (Opened upon tapping "Sign In", with Back Button) */}
        {mobileView === 'signin' && (
          <div 
            className="w-full h-full max-h-[100dvh] flex flex-col justify-between py-[clamp(0.4rem,1.5vh,1rem)] px-3 font-sans overflow-hidden"
            style={{
              paddingTop: 'max(0.6rem, env(safe-area-inset-top))',
              paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom))',
            }}
            dir={isUrdu ? 'rtl' : 'ltr'}
          >
            {/* Top Bar with Back to Landing Page, Brand, Tour Link & Language Switcher */}
            <div className="w-[calc(100%-12px)] max-w-[420px] mx-auto flex items-center justify-between h-[clamp(36px,5vh,44px)] shrink-0 mb-1 sm:mb-2">
              <button
                type="button"
                onClick={handleGoToLanding}
                className="inline-flex items-center space-x-1.5 rtl:space-x-reverse text-xs font-bold text-[#9EE3C4] hover:text-white transition min-h-[44px] px-2 py-1"
                aria-label={isUrdu ? 'تعارف پر واپس جائیں' : 'Back to Overview'}
              >
                {isUrdu ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                <span>{isUrdu ? 'تعارف' : 'Overview'}</span>
              </button>

              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <button
                  type="button"
                  onClick={handleGoToTour}
                  className="inline-flex items-center space-x-1 rtl:space-x-reverse text-[11px] font-bold text-[#9EE3C4] hover:text-white transition min-h-[44px] px-2 py-1"
                  aria-label={isUrdu ? 'پلیٹ فارم کا تعارف دیکھیں' : 'View Platform Tour'}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#F4B400]" />
                  <span>{isUrdu ? 'ٹور' : 'Tour'}</span>
                </button>

                <div 
                  className="flex items-center bg-[#0B4A47] border border-[#16605C] rounded-full p-0.5"
                  role="group"
                  aria-label="Language selection"
                >
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`min-w-[40px] h-[32px] px-2.5 text-xs font-bold rounded-full transition flex items-center justify-center ${
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
                    className={`min-w-[40px] h-[32px] px-2.5 text-xs font-bold rounded-full transition flex items-center justify-center ${
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

            {/* Centered Floating White Sign-In Card (Strict 8-Step Order) */}
            <div className="w-[calc(100%-12px)] max-w-[420px] mx-auto bg-white rounded-[20px] sm:rounded-[26px] p-[clamp(0.65rem,1.8vh,1.25rem)] shadow-[0_20px_45px_rgba(0,0,0,0.35)] border border-[#D5E6DD] flex-1 flex flex-col justify-between overflow-hidden">
              
              {/* 1. Header & Welcome Heading */}
              <div className="mb-1 sm:mb-2">
                <div className="flex items-center space-x-1.5 rtl:space-x-reverse mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16865F]" />
                  <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-[#16865F]">
                    {isUrdu ? 'ری سائیکلنگ پورٹل' : 'Recycling Portal'}
                  </span>
                </div>
                <h1 className="text-[clamp(1.05rem,2.2vh,1.35rem)] font-extrabold text-[#0F3D3E] tracking-tight leading-tight">
                  {isUrdu ? 'صفائی پے میں خوش آمدید' : 'Welcome to SafaiPay'}
                </h1>
                <p className="text-[clamp(9.5px,1.2vh,11.5px)] text-[#5B6B66] mt-0.5 font-medium leading-tight">
                  {isUrdu 
                    ? 'اپنے ری سائیکلنگ اکاؤنٹ میں سائن ان کریں'
                    : 'Sign in to access your verified recycling portal.'}
                </p>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div 
                  role="alert"
                  className="mb-2 p-2 bg-red-50 border border-red-200 text-[#C0392B] rounded-xl text-[11px] font-medium flex items-start space-x-2 rtl:space-x-reverse"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-[#C0392B] shrink-0 mt-0.5" />
                  <span className="leading-tight">{errorMessage}</span>
                </div>
              )}

              {/* 2. Sign-in Fields */}
              <form onSubmit={handleSubmit} noValidate className="space-y-[clamp(0.35rem,1vh,0.75rem)]">
                <div>
                  <label 
                    htmlFor="mobile-identifier"
                    className="block text-[11px] font-bold text-[#0F3D3E] mb-1 leading-none"
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
                      } rounded-[12px] sm:rounded-[14px] pl-3.5 pr-10 rtl:pr-3.5 rtl:pl-10 py-2 sm:py-2.5 text-base sm:text-xs text-[#0F3D3E] placeholder-[#8A9A95] focus:outline-none focus:bg-white transition disabled:opacity-60 min-h-[42px] sm:min-h-[48px]`}
                    />
                    <div className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-3 rtl:pr-0 rtl:pl-3 flex items-center pointer-events-none text-[#5B6B66]">
                      <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 max-w-full" />
                    </div>
                  </div>
                  {fieldErrors.identifier && (
                    <p className="text-[10px] text-red-600 mt-0.5 font-semibold leading-tight">{fieldErrors.identifier}</p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1 leading-none">
                    <label 
                      htmlFor="mobile-password"
                      className="text-[11px] font-bold text-[#0F3D3E]"
                    >
                      {isUrdu ? 'پاس ورڈ' : 'Password'}
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-[10px] text-[#16865F] hover:text-[#126E4E] font-semibold transition"
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
                      } rounded-[12px] sm:rounded-[14px] pl-3.5 pr-10 rtl:pr-3.5 rtl:pl-10 py-2 sm:py-2.5 text-base sm:text-xs text-[#0F3D3E] placeholder-[#8A9A95] focus:outline-none focus:bg-white transition disabled:opacity-60 min-h-[42px] sm:min-h-[48px]`}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-3 rtl:pr-0 rtl:pl-3 flex items-center text-[#5B6B66] hover:text-[#16865F] transition min-h-[42px] min-w-[40px] justify-center"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 max-w-full" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 max-w-full" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-[10px] text-red-600 mt-0.5 font-semibold leading-tight">{fieldErrors.password}</p>
                  )}
                </div>

                {/* 3. Primary Sign-in Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full min-h-[42px] sm:min-h-[48px] bg-[#16865F] hover:bg-[#126E4E] active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-md shadow-[#16865F]/25 flex items-center justify-center space-x-2 rtl:space-x-reverse transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>{isUrdu ? 'سائن ان ہو رہا ہے...' : 'Signing in...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isUrdu ? 'سائن ان کریں' : 'Sign in'}</span>
                      {isUrdu ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    </>
                  )}
                </button>
              </form>

              {/* 4. Divider */}
              <div className="relative my-[clamp(0.2rem,0.8vh,0.5rem)] flex items-center justify-center shrink-0">
                <div className="w-full border-t border-[#D5E6DD]" />
                <span className="absolute bg-white px-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#6B817C]">
                  {isUrdu ? 'یا گیسٹ کے طور پر دیکھیں' : 'Or Explore as Guest'}
                </span>
              </div>

              {/* 5. Continue as Guest Container */}
              <div className="rounded-xl sm:rounded-2xl border border-[#D5E6DD] bg-[#F4FAF7] p-[clamp(0.45rem,1.2vh,0.75rem)] text-left rtl:text-right space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                    <Sparkles className="w-3 h-3 text-[#16865F]" />
                    <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wide text-[#0F3D3E]">
                      {isUrdu ? 'گیسٹ پورٹل منتخب کریں' : 'Choose Guest Portal'}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-[#16865F] bg-[#E1F4EB] px-1.5 py-0.2 rounded-full border border-[#D5E6DD]">
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
                    className={`w-full py-1.5 sm:py-2 px-2.5 rounded-lg text-left rtl:text-right sm:text-center transition-all min-h-[48px] flex items-center sm:flex-col sm:justify-center cursor-pointer relative ${
                      selectedGuestRole === 'customer'
                        ? 'bg-[#16865F] text-white shadow-xs font-bold ring-2 ring-[#16865F]/30'
                        : 'text-[#5B6B66] hover:text-[#0F3D3E] hover:bg-[#E6F4EC]/60 font-semibold bg-[#F9FCFA] border border-[#E1ECE7]'
                    }`}
                  >
                    <div className="flex items-center space-x-2 rtl:space-x-reverse sm:flex-col sm:space-x-0 w-full justify-between sm:justify-center">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse sm:flex-col sm:space-x-0 min-w-0">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                          selectedGuestRole === 'customer' ? 'bg-white/20 text-white' : 'bg-[#E1F4EB] text-[#16865F]'
                        }`}>
                          <UserIcon className="w-3.5 h-3.5 max-w-full" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[11px] sm:text-xs font-extrabold block leading-tight break-words">
                            {isUrdu ? 'کسٹمر پورٹل' : 'Customer'}
                          </span>
                          <span className={`text-[9px] block sm:hidden leading-none mt-0.5 ${
                            selectedGuestRole === 'customer' ? 'text-[#9EE3C4]' : 'text-[#7A8E89]'
                          }`}>
                            {isUrdu ? 'گھریلو ری سائیکلنگ و پک اپ' : 'Book pickups & payouts'}
                          </span>
                        </div>
                      </div>
                      {selectedGuestRole === 'customer' && (
                        <span className="text-[8px] uppercase tracking-wider font-extrabold bg-white/25 text-white px-1.5 py-0.2 rounded-full shrink-0">
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
                    className={`w-full py-1.5 sm:py-2 px-2.5 rounded-lg text-left rtl:text-right sm:text-center transition-all min-h-[48px] flex items-center sm:flex-col sm:justify-center cursor-pointer relative ${
                      selectedGuestRole === 'collector'
                        ? 'bg-[#16865F] text-white shadow-xs font-bold ring-2 ring-[#16865F]/30'
                        : 'text-[#5B6B66] hover:text-[#0F3D3E] hover:bg-[#E6F4EC]/60 font-semibold bg-[#F9FCFA] border border-[#E1ECE7]'
                    }`}
                  >
                    <div className="flex items-center space-x-2 rtl:space-x-reverse sm:flex-col sm:space-x-0 w-full justify-between sm:justify-center">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse sm:flex-col sm:space-x-0 min-w-0">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                          selectedGuestRole === 'collector' ? 'bg-white/20 text-white' : 'bg-[#E1F4EB] text-[#16865F]'
                        }`}>
                          <Truck className="w-3.5 h-3.5 max-w-full" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[11px] sm:text-xs font-extrabold block leading-tight break-words">
                            {isUrdu ? 'کولیکٹر پورٹل' : 'Collector'}
                          </span>
                          <span className={`text-[9px] block sm:hidden leading-none mt-0.5 ${
                            selectedGuestRole === 'collector' ? 'text-[#9EE3C4]' : 'text-[#7A8E89]'
                          }`}>
                            {isUrdu ? 'علاقائی جابز اور پیمانہ وزن' : 'Accept jobs & digital scale'}
                          </span>
                        </div>
                      </div>
                      {selectedGuestRole === 'collector' && (
                        <span className="text-[8px] uppercase tracking-wider font-extrabold bg-white/25 text-white px-1.5 py-0.2 rounded-full shrink-0">
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
                    className={`w-full py-1.5 sm:py-2 px-2.5 rounded-lg text-left rtl:text-right sm:text-center transition-all min-h-[48px] flex items-center sm:flex-col sm:justify-center cursor-pointer relative ${
                      selectedGuestRole === 'recycler'
                        ? 'bg-[#16865F] text-white shadow-xs font-bold ring-2 ring-[#16865F]/30'
                        : 'text-[#5B6B66] hover:text-[#0F3D3E] hover:bg-[#E6F4EC]/60 font-semibold bg-[#F9FCFA] border border-[#E1ECE7]'
                    }`}
                  >
                    <div className="flex items-center space-x-2 rtl:space-x-reverse sm:flex-col sm:space-x-0 w-full justify-between sm:justify-center">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse sm:flex-col sm:space-x-0 min-w-0">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                          selectedGuestRole === 'recycler' ? 'bg-white/20 text-white' : 'bg-[#E1F4EB] text-[#16865F]'
                        }`}>
                          <Factory className="w-3.5 h-3.5 max-w-full" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[11px] sm:text-xs font-extrabold block leading-tight break-words">
                            {isUrdu ? 'ری سائیکلر پورٹل' : 'Recycler'}
                          </span>
                          <span className={`text-[9px] block sm:hidden leading-none mt-0.5 ${
                            selectedGuestRole === 'recycler' ? 'text-[#9EE3C4]' : 'text-[#7A8E89]'
                          }`}>
                            {isUrdu ? 'صنعتی خام مال اور لاٹس' : 'Industrial raw materials'}
                          </span>
                        </div>
                      </div>
                      {selectedGuestRole === 'recycler' && (
                        <span className="text-[8px] uppercase tracking-wider font-extrabold bg-white/25 text-white px-1.5 py-0.2 rounded-full shrink-0">
                          {isUrdu ? 'فعال' : 'Active'}
                        </span>
                      )}
                    </div>
                  </button>
                </div>

                {/* 7. Dynamic Guest CTA Button */}
                <button
                  type="button"
                  disabled={isLoading || isGuestSubmitting}
                  onClick={() => handleGuestSubmit(selectedGuestRole)}
                  className="w-full bg-[#16865F] hover:bg-[#126E4E] active:scale-[0.98] text-white font-extrabold py-2.5 sm:py-3 px-3 rounded-xl text-xs sm:text-sm transition shadow-md shadow-[#16865F]/25 flex items-center justify-center space-x-2 rtl:space-x-reverse min-h-[48px] disabled:opacity-50 cursor-pointer"
                >
                  {isGuestSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>{isUrdu ? 'گیسٹ سائن ان ہو رہا ہے...' : 'Starting guest session...'}</span>
                    </>
                  ) : (
                    <>
                      <span className="truncate">
                        {isUrdu 
                          ? `بطور گیسٹ ${selectedGuestRole === 'customer' ? 'کسٹمر' : selectedGuestRole === 'collector' ? 'کولیکٹر' : 'ری سائیکلر'} داخل ہوں`
                          : `Sign In as Guest ${selectedGuestRole.charAt(0).toUpperCase() + selectedGuestRole.slice(1)}`}
                      </span>
                      {isUrdu ? <ArrowLeft className="w-3.5 h-3.5 shrink-0" /> : <ArrowRight className="w-3.5 h-3.5 shrink-0" />}
                    </>
                  )}
                </button>
              </div>

              {/* 8. Supporting Text / Footer */}
              <div className="mt-1 pt-1.5 border-t border-[#D5E6DD] text-center space-y-1 shrink-0">
                <Link
                  href="/register"
                  className="text-[11px] sm:text-xs text-[#16865F] hover:text-[#126E4E] font-semibold transition py-0.5 min-h-[44px] flex items-center justify-center"
                >
                  {isUrdu 
                    ? 'نیا اکاؤنٹ بنائیں؟ صفائی پے رجسٹریشن' 
                    : 'New to SafaiPay? Create an account'}
                </Link>
                <p className="text-[9px] text-[#8A9A95] leading-none">
                  256-Bit SSL Encrypted | Official SafaiPay Verification System
                </p>
              </div>

            </div>

            {/* Micro Platform Tagline */}
            <div className="text-center py-1 shrink-0">
              <span className="text-[10px] text-[#9EE3C4]/80">
                SafaiPay Verified Recycling Platform • ISO 14001
              </span>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          BRANCH 2: DESKTOP & TABLET LANDING PAGE (>= 768px / hidden md:flex)
          Fixed Full-Screen Viewport (100vw × 100dvh) with zero scrolling
          ========================================================================= */}
      <div className="hidden md:flex h-[100dvh] w-[100vw] max-h-[100dvh] max-w-[100vw] flex-row items-center justify-center bg-[#F4FAF7] text-[#0F3D3E] font-sans selection:bg-[#9FE6C6] selection:text-[#0B2F30] overflow-hidden p-4 md:p-6 lg:p-8 xl:p-12">
        
        {/* ================= LEFT SECTION (HERO & VERIFIED PLATFORM VALUE) ================= */}
        <div className="flex-1 min-w-0 max-w-[560px] xl:max-w-[620px] relative flex flex-col justify-center space-y-[clamp(0.6rem,1.8vh,1.5rem)] pr-4 lg:pr-8 xl:pr-12 select-none overflow-hidden">
          
          {/* Decorative Circles in #E6F4EC */}
          <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-[#E6F4EC] pointer-events-none opacity-80" />
          <div className="absolute -bottom-40 right-10 w-[520px] h-[520px] rounded-full bg-[#E6F4EC] pointer-events-none opacity-60" />

          {/* Header Brand & Category Tag & Take a Tour Button */}
          <div className="space-y-2 lg:space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <SafaiPayLogo size="lg" />

              {/* Prominent Take a Tour Button on Desktop/Tablet */}
              <button
                type="button"
                onClick={() => setShowDesktopTour(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#E6F4EC] border border-[#16865F] text-xs font-bold text-[#16865F] transition shadow-xs cursor-pointer min-h-[36px]"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#F2A900]" />
                <span>{isUrdu ? 'پلیٹ فارم کا ٹور' : 'Take a Tour'}</span>
              </button>
            </div>

            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white border border-[#D5E6DD] text-xs font-bold text-[#1B7F5C] shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#2FA37A] animate-pulse" />
                <span className="tracking-wider uppercase text-[10px]">
                  Smart Recycling Platform
                </span>
              </div>
            </div>
          </div>

          {/* Headline & Mission */}
          <div className="space-y-2 shrink-0">
            <h1 className="text-[clamp(1.5rem,2.8vw,2.75rem)] font-extrabold tracking-tight text-[#0F3D3E] leading-[1.14]">
              Turn waste into{' '}
              <span className="bg-gradient-to-r from-[#1B7F5C] to-[#2FA37A] bg-clip-text text-transparent">
                verified value.
              </span>
            </h1>

            <p className="text-[#3F5A52] text-[clamp(11px,1.15vw,13.5px)] leading-relaxed max-w-xl">
              Book doorstep recyclables collection, leverage computer-vision AI waste classification, certified digital scale weight verification, and transparent real-time pricing—building digital income identities for informal waste collectors across urban hubs.
            </p>
          </div>

          {/* HERO DATA CARD: Real-time collection metrics */}
          <div className="bg-[#0F3D3E] text-white rounded-2xl lg:rounded-3xl p-[clamp(0.75rem,1.6vh,1.35rem)] shadow-[0_15px_30px_rgba(15,61,62,0.18)] border border-[#1F4A4B] relative overflow-hidden shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-[#6EE7B7] animate-ping" />
                <span className="text-[11px] uppercase font-bold tracking-wider text-[#9FE6C6]">
                  Verified Batch Operations
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#072021]/60 text-[#6EE7B7] border border-[#2FA37A]/40 text-[11px] font-semibold flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#6EE7B7] max-w-full" />
                <span>Ready for Industrial Recyclers</span>
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 bg-[#072021]/55 rounded-xl p-3 border border-[#1F4A4B]/60 mb-2.5">
              <div>
                <span className="text-[10px] text-[#9DB8AE] block mb-0.5">Material Stream</span>
                <p className="text-sm font-bold text-white">PET Plastic</p>
                <span className="text-[9px] text-[#9FE6C6]">Post-consumer resin</span>
              </div>
              <div>
                <span className="text-[10px] text-[#9DB8AE] block mb-0.5">Scale Certified</span>
                <p className="text-sm font-bold text-[#6EE7B7] font-mono">10.0 kg verified</p>
                <span className="text-[9px] text-[#9FE6C6]/90">Sensor scale</span>
              </div>
              <div>
                <span className="text-[10px] text-[#9DB8AE] block mb-0.5">AI Classification</span>
                <p className="text-sm font-bold text-white flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-[#9FE6C6] max-w-full" />
                  <span>AI matched</span>
                </p>
                <span className="text-[9px] text-[#9FE6C6]">98.4% Confidence</span>
              </div>
              <div>
                <span className="text-[10px] text-[#9DB8AE] block mb-0.5">Deterministic Price</span>
                <p className="text-sm font-bold text-[#F2A900] font-mono">Rs 800.00</p>
                <span className="text-[9px] text-[#F2A900]/90">Transparent rate</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#9FE6C6]/90 pt-0.5">
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#6EE7B7] max-w-full" />
                <span className="truncate">Chain-of-Custody Digital Receipt #SP-2026-PET10</span>
              </span>
              <span className="text-[10px] font-mono text-[#9DB8AE] shrink-0">Karachi Hub 4</span>
            </div>
          </div>

          {/* THREE FEATURE HIGHLIGHTS */}
          <div className="grid grid-cols-3 gap-2 lg:gap-3 shrink-0">
            <div className="bg-white border border-[#D5E6DD] border-l-[4px] border-l-[#F2A900] rounded-xl p-2.5 shadow-eco-sm">
              <div className="w-7 h-7 rounded-lg bg-[#E6F4EC] text-[#1B7F5C] flex items-center justify-center mb-1.5">
                <ScanLine className="w-3.5 h-3.5 text-[#1B7F5C] max-w-full" />
              </div>
              <h3 className="text-xs font-bold text-[#0F3D3E] mb-0.5">AI scan</h3>
              <p className="text-[10px] text-[#5B6B66] leading-snug line-clamp-2">
                Identifies recyclable grade and contamination before dispatch.
              </p>
            </div>

            <div className="bg-white border border-[#D5E6DD] border-l-[4px] border-l-[#2FA37A] rounded-xl p-2.5 shadow-eco-sm">
              <div className="w-7 h-7 rounded-lg bg-[#E6F4EC] text-[#1B7F5C] flex items-center justify-center mb-1.5">
                <Scale className="w-3.5 h-3.5 text-[#1B7F5C] max-w-full" />
              </div>
              <h3 className="text-xs font-bold text-[#0F3D3E] mb-0.5">Verified scale</h3>
              <p className="text-[10px] text-[#5B6B66] leading-snug line-clamp-2">
                Calibrated hanging scales eliminate doorstep weight disputes.
              </p>
            </div>

            <div className="bg-white border border-[#D5E6DD] border-l-[4px] border-l-[#0F3D3E] rounded-xl p-2.5 shadow-eco-sm">
              <div className="w-7 h-7 rounded-lg bg-[#E6F4EC] text-[#1B7F5C] flex items-center justify-center mb-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#1B7F5C] max-w-full" />
              </div>
              <h3 className="text-xs font-bold text-[#0F3D3E] mb-0.5">Fair price</h3>
              <p className="text-[10px] text-[#5B6B66] leading-snug line-clamp-2">
                Real-time scrap benchmark rates ensure transparent settlement.
              </p>
            </div>
          </div>

        </div>

        {/* ================= RIGHT SECTION (CLEAN PRODUCTION SIGN-IN FORM) ================= */}
        <div className="w-full max-w-[390px] lg:max-w-[430px] shrink-0 flex items-center justify-center overflow-hidden">
          
          {/* Floating White Card */}
          <div className="w-full bg-white rounded-[24px] lg:rounded-[28px] p-[clamp(1rem,2.2vh,2rem)] shadow-[0_20px_40px_rgba(0,0,0,0.22)] border border-[#D5E6DD] text-[#0F3D3E] flex flex-col justify-between overflow-hidden">
            
            {/* Top Bar with Language Switcher */}
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center space-x-2">
                <SafaiPayLogoIcon className="w-8 h-8 shadow-md shadow-[#1B7F5C]/20 max-w-full" />
                <span className="font-extrabold text-base lg:text-lg text-[#0F3D3E] tracking-tight">SafaiPay</span>
              </div>

              {/* Language Switcher */}
              <div className="flex items-center bg-[#F4FAF7] border border-[#D5E6DD] rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition min-h-[32px] ${
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
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition min-h-[32px] ${
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
            <div className="mb-3">
              <h2 className="text-xl lg:text-2xl font-extrabold text-[#0F3D3E] tracking-tight">
                {isUrdu ? 'صفائی پے میں خوش آمدید' : 'Welcome to SafaiPay'}
              </h2>
              <p className="text-xs text-[#5B6B66] mt-0.5 font-medium">
                {isUrdu 
                  ? 'اپنے ری سائیکلنگ اکاؤنٹ میں سائن ان کریں'
                  : 'Sign in to access your verified recycling portal.'}
              </p>
            </div>

            {/* Generic Error Message Alert */}
            {errorMessage && (
              <div 
                role="alert"
                className="mb-3 p-2.5 bg-red-50 border border-red-200 text-[#C0392B] rounded-xl text-xs font-medium flex items-start space-x-2"
              >
                <AlertCircle className="w-4 h-4 text-[#C0392B] shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Sign-in Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-3">
              
              {/* Phone or Email Field */}
              <div>
                <label 
                  htmlFor="desktop-identifier"
                  className="block text-xs font-bold text-[#0F3D3E] mb-1"
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
                    } rounded-[12px] pl-3.5 pr-10 rtl:pr-3.5 rtl:pl-10 py-2.5 text-base sm:text-xs text-[#0F3D3E] placeholder-[#8A9A95] focus:outline-none focus:bg-white transition disabled:opacity-60 min-h-[44px]`}
                  />
                  <div className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-3 rtl:pr-0 rtl:pl-3 flex items-center pointer-events-none text-[#5B6B66]">
                    <UserIcon className="w-4 h-4 max-w-full" />
                  </div>
                </div>
                {fieldErrors.identifier && (
                  <p className="text-[10px] text-red-600 mt-0.5">{fieldErrors.identifier}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <div className="flex justify-between items-center mb-1">
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
                    } rounded-[12px] pl-3.5 pr-10 rtl:pr-3.5 rtl:pl-10 py-2.5 text-base sm:text-xs text-[#0F3D3E] placeholder-[#8A9A95] focus:outline-none focus:bg-white transition disabled:opacity-60 min-h-[44px]`}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-3 rtl:pr-0 rtl:pl-3 flex items-center text-[#5B6B66] hover:text-[#1B7F5C] transition min-h-[44px] min-w-[40px] justify-center"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 max-w-full" /> : <Eye className="w-4 h-4 max-w-full" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-[10px] text-red-600 mt-0.5">{fieldErrors.password}</p>
                )}
              </div>

              {/* Primary Sign-in Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#1B7F5C] hover:bg-[#146B4D] active:scale-[0.99] text-white font-bold py-2.5 rounded-[12px] text-sm transition shadow-md shadow-[#1B7F5C]/25 flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px] cursor-pointer"
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
            <div className="relative my-3 flex items-center justify-center">
              <div className="w-full border-t border-[#D5E6DD]" />
              <span className="absolute bg-white px-2.5 text-[10px] font-bold uppercase tracking-wider text-[#6B817C]">
                {isUrdu ? 'یا گیسٹ کے طور پر دیکھیں' : 'Or Explore as Guest'}
              </span>
            </div>

            <div className="rounded-xl border border-[#D5E6DD] bg-[#F4FAF7] p-2.5 text-left rtl:text-right space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                  <Sparkles className="w-3.5 h-3.5 text-[#1B7F5C]" />
                  <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#0F3D3E]">
                    {isUrdu ? 'گیسٹ موڈ منتخب کریں' : 'Choose Guest Portal'}
                  </span>
                </div>
                <span className="text-[9px] font-bold text-[#16865F] bg-[#E1F4EB] px-2 py-0.2 rounded-full border border-[#D5E6DD]">
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
                  className={`py-1.5 px-1 rounded-lg text-center transition-all min-h-[44px] flex flex-col items-center justify-center cursor-pointer relative ${
                    selectedGuestRole === 'customer'
                      ? 'bg-[#16865F] text-white shadow-xs font-bold ring-2 ring-[#16865F]/30'
                      : 'text-[#5B6B66] hover:text-[#0F3D3E] hover:bg-[#E6F4EC]/60 font-semibold'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5 mb-0.5 shrink-0 max-w-full" />
                  <span className="text-[10px] leading-tight truncate">
                    {isUrdu ? 'کسٹمر' : 'Customer'}
                  </span>
                  {selectedGuestRole === 'customer' && (
                    <span className="text-[7px] uppercase tracking-wider font-extrabold bg-white/20 text-white px-1 py-0.2 rounded-full mt-0.5">
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
                  className={`py-1.5 px-1 rounded-lg text-center transition-all min-h-[44px] flex flex-col items-center justify-center cursor-pointer relative ${
                    selectedGuestRole === 'collector'
                      ? 'bg-[#16865F] text-white shadow-xs font-bold ring-2 ring-[#16865F]/30'
                      : 'text-[#5B6B66] hover:text-[#0F3D3E] hover:bg-[#E6F4EC]/60 font-semibold'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5 mb-0.5 shrink-0 max-w-full" />
                  <span className="text-[10px] leading-tight truncate">
                    {isUrdu ? 'کولیکٹر' : 'Collector'}
                  </span>
                  {selectedGuestRole === 'collector' && (
                    <span className="text-[7px] uppercase tracking-wider font-extrabold bg-white/20 text-white px-1 py-0.2 rounded-full mt-0.5">
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
                  className={`py-1.5 px-1 rounded-lg text-center transition-all min-h-[44px] flex flex-col items-center justify-center cursor-pointer relative ${
                    selectedGuestRole === 'recycler'
                      ? 'bg-[#16865F] text-white shadow-xs font-bold ring-2 ring-[#16865F]/30'
                      : 'text-[#5B6B66] hover:text-[#0F3D3E] hover:bg-[#E6F4EC]/60 font-semibold'
                  }`}
                >
                  <Factory className="w-3.5 h-3.5 mb-0.5 shrink-0 max-w-full" />
                  <span className="text-[10px] leading-tight truncate">
                    {isUrdu ? 'ری سائیکلر' : 'Recycler'}
                  </span>
                  {selectedGuestRole === 'recycler' && (
                    <span className="text-[7px] uppercase tracking-wider font-extrabold bg-white/20 text-white px-1 py-0.2 rounded-full mt-0.5">
                      {isUrdu ? 'فعال' : 'Active'}
                    </span>
                  )}
                </button>
              </div>

              <p className="text-[9.5px] text-[#5B6B66] text-center px-1 font-medium leading-tight">
                {selectedGuestRole === 'customer' && (isUrdu ? 'گھریلو کچرا ری سائیکل کریں، پک اپ بک کریں اور ادائیگی دیکھیں' : 'Book household scrap pickups & track digital payouts')}
                {selectedGuestRole === 'collector' && (isUrdu ? 'علاقائی جابز قبول کریں، اسکیل وزن ریکارڈ کریں اور کمائیں' : 'Accept verified neighborhood jobs & record scale weights')}
                {selectedGuestRole === 'recycler' && (isUrdu ? 'صنعتی ری سائیکلرز کے لیے تصدیق شدہ خام مال بیچز' : 'Procure industrial post-consumer verified material streams')}
              </p>

              <button
                type="button"
                disabled={isLoading || isGuestSubmitting}
                onClick={() => handleGuestSubmit(selectedGuestRole)}
                className="w-full bg-white hover:bg-[#E6F4EC] text-[#1B7F5C] border border-[#1B7F5C] font-extrabold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center space-x-1.5 rtl:space-x-reverse min-h-[44px] shadow-2xs hover:shadow-xs active:scale-[0.99] disabled:opacity-50 cursor-pointer"
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
            <div className="mt-3 pt-2.5 border-t border-[#D5E6DD] text-center">
              <Link
                href="/register"
                className="text-xs text-[#1B7F5C] hover:text-[#146B4D] font-semibold transition inline-block min-h-[32px] py-1"
              >
                {isUrdu 
                  ? 'نیا اکاؤنٹ بنائیں؟ صفائی پے رجسٹریشن' 
                  : 'New to SafaiPay? Create an account'}
              </Link>
            </div>

            {/* Security Note */}
            <div className="mt-1 text-center">
              <p className="text-[9.5px] text-[#8A9A95]">
                256-Bit SSL Encrypted | Official SafaiPay Verification System
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* Desktop / Tablet Tour Walkthrough Modal */}
      {showDesktopTour && (
        <div 
          className="fixed inset-0 z-50 bg-[#072021]/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200"
          onClick={() => setShowDesktopTour(false)}
        >
          <div 
            className="w-full max-w-xl bg-white rounded-3xl p-8 shadow-2xl border border-[#D5E6DD] text-[#0F3D3E] space-y-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowDesktopTour(false)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#F4FAF7] hover:bg-[#E6F4EC] text-[#5B6B66] hover:text-[#0F3D3E] flex items-center justify-center transition"
              aria-label="Close Tour"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2">
              <SafaiPayLogo size="md" />
              <span className="text-xs font-extrabold uppercase tracking-wider bg-[#E1F4EB] text-[#16865F] px-2.5 py-1 rounded-full">
                Interactive Platform Tour
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#F4FAF7] border border-[#D5E6DD] rounded-2xl p-4 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#E6F4EC] text-[#16865F] flex items-center justify-center mx-auto">
                  <ScanLine className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-[#0F3D3E]">1. AI Vision Scan</h3>
                <p className="text-[11px] text-[#5B6B66] leading-snug">
                  Identifies recyclable plastic resin and scrap grade before pickup.
                </p>
              </div>

              <div className="bg-[#F4FAF7] border border-[#D5E6DD] rounded-2xl p-4 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#E6F4EC] text-[#16865F] flex items-center justify-center mx-auto">
                  <Scale className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-[#0F3D3E]">2. Verified Weight</h3>
                <p className="text-[11px] text-[#5B6B66] leading-snug">
                  Calibrated hanging sensor scale records immutable doorstep weight.
                </p>
              </div>

              <div className="bg-[#F4FAF7] border border-[#D5E6DD] rounded-2xl p-4 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#E6F4EC] text-[#16865F] flex items-center justify-center mx-auto">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-[#0F3D3E]">3. Fair Settlement</h3>
                <p className="text-[11px] text-[#5B6B66] leading-snug">
                  Scrap benchmark pricing ensures instant transparent payout to wallets.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#D5E6DD]">
              <span className="text-xs text-[#5B6B66]">
                SafaiPay Verified Platform • 100% Traceable Chain-of-Custody
              </span>
              <button
                type="button"
                onClick={() => setShowDesktopTour(false)}
                className="px-5 py-2.5 rounded-xl bg-[#16865F] hover:bg-[#126E4E] text-white text-xs font-extrabold shadow-sm transition"
              >
                Close Tour
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
