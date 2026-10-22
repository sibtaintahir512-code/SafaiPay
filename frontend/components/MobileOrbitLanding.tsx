'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { SafaiPayLogoIcon } from '@/components/SafaiPayLogo';
import { Sparkles, Scale, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';

interface MobileOrbitLandingProps {
  onStart?: () => void;
  onTour?: () => void;
  onSignIn?: () => void;
  isLoading?: boolean;
}

export const MobileOrbitLanding: React.FC<MobileOrbitLandingProps> = ({
  onStart,
  onTour,
  onSignIn,
  isLoading = false,
}) => {
  const { language, setLanguage, isUrdu } = useLanguage();

  const handleTourClick = () => {
    if (onTour) onTour();
    else if (onStart) onStart();
  };

  const handleSignInClick = () => {
    if (onSignIn) onSignIn();
    else if (onStart) onStart();
  };

  return (
    <div 
      className="relative h-[100dvh] w-full max-h-[100dvh] bg-[#073D3B] text-white flex flex-col justify-between overflow-hidden select-none font-sans"
      style={{
        paddingTop: 'max(0.6rem, env(safe-area-inset-top))',
        paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom))',
      }}
      dir={isUrdu ? 'rtl' : 'ltr'}
    >
      {/* Background Decorative Ambient Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[380px] h-[380px] bg-gradient-to-b from-[#0B524E] via-[#073D3B] to-transparent rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[340px] h-[340px] bg-[#16865F]/20 rounded-full blur-3xl pointer-events-none" />

      {/* ================= 1. TOP HEADER ================= */}
      <header className="relative z-20 w-full px-5 pt-2 pb-1 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
          <div className="w-9 h-9 rounded-xl bg-white p-1.5 shadow-md flex items-center justify-center">
            <SafaiPayLogoIcon className="w-full h-full text-[#16865F]" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">
            SafaiPay
          </span>
        </div>

        {/* Accessible Language Switcher (Min 44px Touch Target) */}
        <div 
          className="flex items-center bg-[#0B4A47] border border-[#16605C] rounded-full p-1"
          role="group"
          aria-label="Language selection"
        >
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`min-w-[44px] h-[36px] px-3 text-xs font-bold rounded-full transition-all flex items-center justify-center ${
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
            className={`min-w-[44px] h-[36px] px-3 text-xs font-bold rounded-full transition-all flex items-center justify-center ${
              language === 'ur'
                ? 'bg-[#16865F] text-white shadow-xs'
                : 'text-[#9EE3C4] hover:text-white'
            }`}
            aria-pressed={language === 'ur'}
          >
            اردو
          </button>
        </div>
      </header>

      {/* ================= 2. CIRCULAR RECYCLING ORBIT & HEADLINE ================= */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-2 sm:py-4">
        
        {/* Central Circular Orbit Visual */}
        <div className="relative w-[clamp(210px,28vh,270px)] h-[clamp(210px,28vh,270px)] flex items-center justify-center my-auto">
          
          {/* Yellow Radial Glow behind Center */}
          <div className="absolute w-44 h-44 rounded-full bg-[#F4B400]/25 blur-2xl pointer-events-none animate-pulse" />

          {/* SVG Vector Orbit Rings */}
          <svg
            viewBox="-160 -160 320 320"
            className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="orbitStrokeGradient" x1="-1" y1="-1" x2="1" y2="1">
                <stop offset="0%" stopColor="#9EE3C4" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#35B889" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#16865F" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Ring 1: Inner Solid Orbit */}
            <circle
              cx="0"
              cy="0"
              r="68"
              fill="none"
              stroke="#195450"
              strokeWidth="1.5"
            />

            {/* Ring 2: Middle Dashed Orbit (Smooth SVG Dash Animation) */}
            <circle
              cx="0"
              cy="0"
              r="108"
              fill="none"
              stroke="url(#orbitStrokeGradient)"
              strokeWidth="2"
              strokeDasharray="6 8"
              className="animate-dash-move"
            />

            {/* Ring 3: Outer Subtle Orbit */}
            <circle
              cx="0"
              cy="0"
              r="146"
              fill="none"
              stroke="#0E4643"
              strokeWidth="1.2"
              strokeDasharray="3 6"
            />
          </svg>

          {/* Rotating Layer with Floating Badges */}
          <div className="absolute inset-0 w-full h-full animate-spin-slow pointer-events-none">
            
            {/* BADGE 1: AI Waste Classification (Top-Right) */}
            <div 
              className="absolute top-5 right-5 xs:top-6 xs:right-6 -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
              style={{ animation: 'spinSlowReverse 36s linear infinite' }}
            >
              <div className="px-2.5 py-1 rounded-full bg-[#0D3836]/90 border border-[#35B889] text-[#9EE3C4] shadow-lg flex items-center space-x-1.5 rtl:space-x-reverse animate-orbit-float backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-[#F4B400] shrink-0" />
                <span className="text-[10px] font-extrabold tracking-wider uppercase">
                  {isUrdu ? 'اے آئی معائنہ' : 'AI Verified'}
                </span>
              </div>
            </div>

            {/* BADGE 2: KG Scale Weight Verified (Bottom-Left) */}
            <div 
              className="absolute bottom-6 left-6 xs:bottom-7 xs:left-7 translate-x-1/2 translate-y-1/2 pointer-events-auto"
              style={{ animation: 'spinSlowReverse 36s linear infinite' }}
            >
              <div 
                className="px-2.5 py-1 rounded-full bg-[#0D3836]/90 border border-[#35B889] text-[#F4FAF7] shadow-lg flex items-center space-x-1.5 rtl:space-x-reverse animate-orbit-float backdrop-blur-md"
                style={{ animationDelay: '1.5s' }}
              >
                <Scale className="w-3.5 h-3.5 text-[#35B889] shrink-0" />
                <span className="text-[10px] font-extrabold font-mono tracking-tight">
                  {isUrdu ? 'تصدیق شدہ وزن KG' : 'Scale KG'}
                </span>
              </div>
            </div>

            {/* BADGE 3: Traceable Shield (Bottom-Right) */}
            <div 
              className="absolute bottom-10 right-4 xs:bottom-12 xs:right-5 -translate-x-1/2 pointer-events-auto"
              style={{ animation: 'spinSlowReverse 36s linear infinite' }}
            >
              <div 
                className="px-2 py-0.5 rounded-full bg-[#12423F]/90 border border-[#245D58] text-[#9EE3C4] shadow-md flex items-center space-x-1 rtl:space-x-reverse animate-orbit-float backdrop-blur-md"
                style={{ animationDelay: '2.5s' }}
              >
                <ShieldCheck className="w-3 h-3 text-[#16865F] shrink-0" />
                <span className="text-[9px] font-bold">
                  {isUrdu ? 'شفاف نظام' : '100% Traceable'}
                </span>
              </div>
            </div>

          </div>

          {/* Central Logo Container (Stable / Non-Rotating) */}
          <div className="relative z-10 w-20 h-20 xs:w-22 xs:h-22 rounded-2xl bg-white shadow-[0_12px_36px_rgba(0,0,0,0.35)] border border-[#E1F4EB] flex items-center justify-center p-3.5 transition-transform hover:scale-105 duration-300">
            <SafaiPayLogoIcon className="w-full h-full text-[#16865F]" />
          </div>

        </div>

        {/* Headings Section */}
        <div className="w-full max-w-sm text-center space-y-2 mt-3 sm:mt-4">
          <h1 className="text-3xl xs:text-4xl font-extrabold tracking-tight leading-[1.12]">
            <span className="block text-white">
              {isUrdu ? 'کچرا اندر جاتا ہے۔' : 'Waste goes in.'}
            </span>
            <span className="block text-[#9EE3C4]">
              {isUrdu ? 'قیمت باہر آتی ہے۔' : 'Value comes out.'}
            </span>
          </h1>

          <p className="text-[#E1F4EB] text-xs xs:text-sm font-medium leading-relaxed max-w-xs mx-auto">
            {isUrdu 
              ? 'ری سائیکل، کمانے اور آگے بڑھنے کا ایک بہتر طریقہ۔'
              : 'A smarter way to recycle, earn and grow.'}
          </p>
        </div>

      </main>

      {/* ================= 3. FLOATING BOTTOM JOURNEY CARD ================= */}
      <footer className="relative z-20 w-full px-3.5 sm:px-4 pt-1 pb-1">
        <div className="w-full max-w-sm mx-auto bg-white rounded-[24px] sm:rounded-[28px] p-[clamp(0.75rem,2vh,1.25rem)] shadow-[0_16px_40px_rgba(0,0,0,0.28)] border border-[#D7E8E1] text-[#0B3D3B] space-y-[clamp(0.5rem,1.2vh,0.85rem)]">
          
          {/* Card Title */}
          <div className="flex items-center justify-between border-b border-[#E8F2EC] pb-2">
            <h2 className="text-xs sm:text-sm font-extrabold text-[#0B3D3B] tracking-tight">
              {isUrdu ? 'آپ کا صفائی کا سفر' : 'Your clean journey'}
            </h2>
            <span className="text-[9px] sm:text-[10px] font-bold text-[#16865F] uppercase tracking-wider bg-[#E1F4EB] px-2 py-0.5 rounded-full">
              3 Steps
            </span>
          </div>

          {/* 3 Step Journey */}
          <div className="relative space-y-2 sm:space-y-2.5">
            {/* Subtle Vertical Connecting Line */}
            <div 
              className={`absolute top-2.5 bottom-2.5 w-0.5 bg-[#E1F4EB] ${
                isUrdu ? 'right-3' : 'left-3'
              }`} 
              aria-hidden="true" 
            />

            {/* Step 1 */}
            <div className="relative flex items-center space-x-2.5 rtl:space-x-reverse z-10">
              <div className="w-6 h-6 rounded-full bg-[#E1F4EB] text-[#16865F] font-extrabold text-[11px] flex items-center justify-center shrink-0 border border-[#9EE3C4]/60">
                1
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-[#0B3D3B]">
                {isUrdu ? 'پک اپ بک کریں' : 'Book a pickup'}
              </span>
            </div>

            {/* Step 2 */}
            <div className="relative flex items-center space-x-2.5 rtl:space-x-reverse z-10">
              <div className="w-6 h-6 rounded-full bg-[#E1F4EB] text-[#16865F] font-extrabold text-[11px] flex items-center justify-center shrink-0 border border-[#9EE3C4]/60">
                2
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-[#0B3D3B]">
                {isUrdu ? 'وزن کی تصدیق کریں' : 'Verify the weight'}
              </span>
            </div>

            {/* Step 3 */}
            <div className="relative flex items-center space-x-2.5 rtl:space-x-reverse z-10">
              <div className="w-6 h-6 rounded-full bg-[#E1F4EB] text-[#16865F] font-extrabold text-[11px] flex items-center justify-center shrink-0 border border-[#9EE3C4]/60">
                3
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-[#0B3D3B]">
                {isUrdu ? 'منصفانہ قیمت حاصل کریں' : 'Receive fair value'}
              </span>
            </div>
          </div>

          {/* Action Buttons: 1. Take a Tour (Clear & Visible) & 2. Sign In */}
          <div className="space-y-2 pt-1">
            {/* Option 1: Take a Tour */}
            <button
              type="button"
              onClick={handleTourClick}
              disabled={isLoading}
              className="w-full min-h-[46px] sm:min-h-[48px] bg-[#0B4A47] hover:bg-[#115C58] active:scale-[0.98] text-[#9EE3C4] hover:text-white border border-[#16865F] font-extrabold text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-xs transition-all flex items-center justify-center space-x-2 rtl:space-x-reverse cursor-pointer disabled:opacity-60"
              aria-label={isUrdu ? 'پلیٹ فارم کا ٹور دیکھیں' : 'Take a Tour'}
            >
              <Sparkles className="w-4 h-4 text-[#F4B400] shrink-0" />
              <span>{isUrdu ? 'پلیٹ فارم کا ٹور دیکھیں' : 'Take a Tour'}</span>
            </button>

            {/* Option 2: Sign In */}
            <button
              type="button"
              onClick={handleSignInClick}
              disabled={isLoading}
              className="w-full min-h-[46px] sm:min-h-[48px] bg-[#16865F] hover:bg-[#126E4E] active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-md shadow-[#16865F]/30 transition-all flex items-center justify-center space-x-2 rtl:space-x-reverse cursor-pointer disabled:opacity-60"
              aria-label={isUrdu ? 'سائن ان کریں' : 'Sign In'}
            >
              <span>{isUrdu ? 'سائن ان کریں' : 'Sign In'}</span>
              {isUrdu ? (
                <ArrowLeft className="w-4 h-4 shrink-0" />
              ) : (
                <ArrowRight className="w-4 h-4 shrink-0" />
              )}
            </button>
          </div>

        </div>
      </footer>

    </div>
  );
};
