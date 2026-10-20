'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { SafaiPayLogoIcon } from '@/components/SafaiPayLogo';
import { Sparkles, Scale, ShieldCheck, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';

interface CircularRecyclingOrbitProps {
  className?: string;
  showJourneyCard?: boolean;
}

export const CircularRecyclingOrbit: React.FC<CircularRecyclingOrbitProps> = ({
  className = '',
  showJourneyCard = true,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className={`relative w-full flex flex-col items-center justify-center select-none overflow-hidden ${className}`}>
      
      {/* ================= BACKGROUND GLOW EFFECT ================= */}
      <div 
        className={`absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-3xl pointer-events-none transition-all duration-500 ${
          isDark
            ? 'bg-[#F4B400]/10 mix-blend-screen'
            : 'bg-[#F4B400]/20'
        }`}
      />

      {/* ================= ORBIT SYSTEM CONTAINER ================= */}
      <div className="relative w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] flex items-center justify-center">
        
        {/* SVG ORBIT RINGS & DASHED PATHS */}
        <svg
          viewBox="-200 -200 400 400"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <defs>
            {/* Center Yellow Radial Glow */}
            <radialGradient id="centerGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F4B400" stopOpacity={isDark ? '0.35' : '0.45'} />
              <stop offset="60%" stopColor={isDark ? '#35B889' : '#16865F'} stopOpacity="0.12" />
              <stop offset="100%" stopColor={isDark ? '#071F1F' : '#F4F8F5'} stopOpacity="0" />
            </radialGradient>

            {/* Orbit Mint Gradient */}
            <linearGradient id="orbitMintGradient" x1="-1" y1="-1" x2="1" y2="1">
              <stop offset="0%" stopColor="#9EE3C4" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#35B889" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#16865F" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Central Glow Field */}
          <circle cx="0" cy="0" r="140" fill="url(#centerGlow)" />

          {/* Ring 1 (Inner Solid Orbit Ring) */}
          <circle
            cx="0"
            cy="0"
            r="82"
            fill="none"
            stroke={isDark ? '#24514D' : '#D7E8E1'}
            strokeWidth="1.5"
            strokeOpacity={isDark ? '0.8' : '0.9'}
          />

          {/* Ring 2 (Middle Orbit with Animated Dashes) */}
          <circle
            cx="0"
            cy="0"
            r="128"
            fill="none"
            stroke="url(#orbitMintGradient)"
            strokeWidth="2"
            strokeDasharray="6 8"
            className="animate-dash-move"
          />

          {/* Ring 3 (Outer Boundary Subtle Ring) */}
          <circle
            cx="0"
            cy="0"
            r="174"
            fill="none"
            stroke={isDark ? '#173F3C' : '#E1F4EB'}
            strokeWidth="1.2"
            strokeDasharray="2 6"
          />
        </svg>

        {/* ================= ROTATING ORBIT CONTAINER FOR BADGES ================= */}
        <div className="absolute inset-0 w-full h-full animate-spin-slow">
          
          {/* BADGE 1: AI Computer Vision Badge (Position: Top-Right ~45 deg) */}
          <div 
            className="absolute top-7 right-7 sm:top-9 sm:right-9 -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
            style={{ animation: 'spinSlowReverse 36s linear infinite' }}
          >
            <div className={`px-3 py-1.5 rounded-full border shadow-lg flex items-center space-x-1.5 animate-orbit-float backdrop-blur-md transition-colors ${
              isDark
                ? 'bg-[#0D3030]/90 border-[#35B889] text-[#9EE3C4]'
                : 'bg-white/95 border-[#9EE3C4] text-[#073D3B]'
            }`}>
              <Sparkles className="w-3.5 h-3.5 text-[#F4B400] shrink-0" />
              <span className="text-[11px] font-extrabold tracking-wide uppercase">AI Classified</span>
            </div>
          </div>

          {/* BADGE 2: KG Scale Weight Verified Badge (Position: Bottom-Left ~225 deg) */}
          <div 
            className="absolute bottom-7 left-7 sm:bottom-9 sm:left-9 translate-x-1/2 translate-y-1/2 pointer-events-auto"
            style={{ animation: 'spinSlowReverse 36s linear infinite' }}
          >
            <div className={`px-3 py-1.5 rounded-full border shadow-lg flex items-center space-x-1.5 animate-orbit-float backdrop-blur-md transition-colors ${
              isDark
                ? 'bg-[#0D3030]/90 border-[#35B889] text-[#F4FAF7]'
                : 'bg-white/95 border-[#D7E8E1] text-[#073D3B]'
            }`} style={{ animationDelay: '1.5s' }}>
              <Scale className="w-3.5 h-3.5 text-[#35B889] shrink-0" />
              <span className="text-[11px] font-extrabold font-mono tracking-tight">Scale Verified KG</span>
            </div>
          </div>

          {/* BADGE 3: Verified Digital Identity Shield Badge (Position: Bottom-Right ~315 deg) */}
          <div 
            className="absolute bottom-12 right-6 sm:bottom-14 sm:right-8 -translate-x-1/2 pointer-events-auto"
            style={{ animation: 'spinSlowReverse 36s linear infinite' }}
          >
            <div className={`px-2.5 py-1 rounded-full border shadow-md flex items-center space-x-1 animate-orbit-float backdrop-blur-md transition-colors ${
              isDark
                ? 'bg-[#123D3B]/90 border-[#24514D] text-[#65D7AE]'
                : 'bg-white/95 border-[#E1F4EB] text-[#16865F]'
            }`} style={{ animationDelay: '2.5s' }}>
              <ShieldCheck className="w-3.5 h-3.5 text-[#16865F] shrink-0" />
              <span className="text-[10px] font-bold">100% Traceable</span>
            </div>
          </div>
        </div>

        {/* ================= CENTRAL LOGO (STABLE / NON-ROTATING) ================= */}
        <div className="relative z-10">
          <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-3.5 shadow-2xl border flex items-center justify-center transition-all transform hover:scale-105 duration-300 ${
            isDark
              ? 'bg-[#0D3030] border-[#35B889]/60 shadow-[0_12px_40px_rgba(53,184,137,0.25)]'
              : 'bg-white border-[#D7E8E1] shadow-[0_12px_40px_rgba(7,61,59,0.14)]'
          }`}>
            <SafaiPayLogoIcon className="w-16 h-16 sm:w-20 sm:h-20" />
          </div>
        </div>
      </div>

      {/* ================= JOURNEY CARD (ADAPTS TO LIGHT & DARK) ================= */}
      {showJourneyCard && (
        <div className={`mt-6 w-full max-w-sm rounded-2xl p-4 border transition-all shadow-md backdrop-blur-md ${
          isDark
            ? 'bg-[#123D3B]/90 border-[#24514D] text-[#F4FAF7]'
            : 'bg-white/95 border-[#D7E8E1] text-[#073D3B]'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#35B889] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#35B889] animate-pulse" />
              Circular Waste Economy
            </span>
            <span className="text-[11px] font-mono font-bold text-[#F4B400]">
              P = W × R × Q
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className={`p-2 rounded-xl border ${isDark ? 'bg-[#0D3030] border-[#24514D]' : 'bg-[#F4F8F5] border-[#D7E8E1]'}`}>
              <p className="text-[10px] text-[#A9C2B9]">Pickup</p>
              <p className="font-extrabold text-[#35B889] text-xs">Doorstep</p>
            </div>
            <div className={`p-2 rounded-xl border ${isDark ? 'bg-[#0D3030] border-[#24514D]' : 'bg-[#F4F8F5] border-[#D7E8E1]'}`}>
              <p className="text-[10px] text-[#A9C2B9]">Weight</p>
              <p className="font-extrabold text-[#F4B400] text-xs">Certified</p>
            </div>
            <div className={`p-2 rounded-xl border ${isDark ? 'bg-[#0D3030] border-[#24514D]' : 'bg-[#F4F8F5] border-[#D7E8E1]'}`}>
              <p className="text-[10px] text-[#A9C2B9]">Payout</p>
              <p className="font-extrabold text-[#35B889] text-xs">Instant Rail</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
