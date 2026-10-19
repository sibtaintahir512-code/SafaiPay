'use client';

import React, { useState } from 'react';
import { UserRole, User as AuthUser } from '@/lib/types';
import { SafaiPayLogo, SafaiPayLogoIcon } from '@/components/SafaiPayLogo';
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
  Truck, 
  Factory,
  RefreshCw
} from 'lucide-react';

interface LandingLoginPageProps {
  onLogin: (identifier: string, pass: string) => Promise<void>;
  onQuickDemoLogin: (role: UserRole) => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onGoToDashboard?: () => void;
}

export const LandingLoginPage: React.FC<LandingLoginPageProps> = ({
  onLogin,
  onQuickDemoLogin,
  isLoading,
  errorMessage,
  currentUser,
  onLogout,
  onGoToDashboard,
}) => {
  const [identifier, setIdentifier] = useState('+923001110001');
  const [password, setPassword] = useState('SafaiPassword123!');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterAlert, setShowRegisterAlert] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;
    await onLogin(identifier, password);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F4FAF7] text-[#0F3D3E] font-sans selection:bg-[#9FE6C6] selection:text-[#0B2F30]">
      
      {/* ================= LEFT SECTION (HERO & FEATURES) ================= */}
      {/* Background #F4FAF7 with large faint decorative circles in #E6F4EC */}
      <div className="flex-1 relative overflow-hidden bg-[#F4FAF7] px-6 sm:px-10 lg:px-14 py-10 lg:py-16 flex flex-col justify-center">
        
        {/* Large Faint Decorative Circles in --mint-50 (#E6F4EC) */}
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

          {/* Headline & Paragraph */}
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

          {/* ONE HERO DATA CARD: "Today's collection" */}
          {/* Solid deep teal #0F3D3E with light text, soft shadow rgba(15,61,62,0.18), inner stats panel in rgba(7,32,33,0.55). Inside it: verified values in #6EE7B7, prices in gold #F2A900, labels in #9DB8AE */}
          <div className="bg-[#0F3D3E] text-white rounded-3xl p-6 shadow-[0_15px_30px_rgba(15,61,62,0.18)] border border-[#1F4A4B] relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#6EE7B7] animate-ping" />
                <span className="text-xs uppercase font-bold tracking-wider text-[#9FE6C6]">
                  Today’s collection
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#072021]/60 text-[#6EE7B7] border border-[#2FA37A]/40 text-xs font-semibold flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#6EE7B7]" />
                <span>Ready for recycler</span>
              </span>
            </div>

            {/* Inner Stats Panel in rgba(7,32,33,0.55) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#072021]/55 rounded-2xl p-4 border border-[#1F4A4B]/60 mb-4">
              <div>
                <span className="text-[11px] text-[#9DB8AE] block mb-0.5">Material Stream</span>
                <p className="text-base font-bold text-white">PET Plastic</p>
                <span className="text-[10px] text-[#9FE6C6]">Post-consumer bottles</span>
              </div>
              <div>
                <span className="text-[11px] text-[#9DB8AE] block mb-0.5">Scale Certified</span>
                <p className="text-base font-bold text-[#6EE7B7] font-mono">10 kg verified</p>
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

          {/* THREE FEATURE CARDS: "AI scan", "Verified", "Fair price" */}
          {/* White (--surface), 1px --border (#D5E6DD), 5px colored left border (gold, emerald-400, teal-900), icons stroked in --emerald-600, titles --teal-900 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            
            {/* Feature 1: AI scan (5px gold left border) */}
            <div className="bg-white border border-[#D5E6DD] border-l-[5px] border-l-[#F2A900] rounded-2xl p-4 shadow-eco-sm">
              <div className="w-8 h-8 rounded-xl bg-[#E6F4EC] text-[#1B7F5C] flex items-center justify-center mb-2.5">
                <ScanLine className="w-4 h-4 text-[#1B7F5C]" />
              </div>
              <h3 className="text-sm font-bold text-[#0F3D3E] mb-0.5">AI scan</h3>
              <p className="text-xs text-[#5B6B66] leading-snug">
                Computer-vision detects resin grade and contamination in seconds.
              </p>
            </div>

            {/* Feature 2: Verified (5px emerald-400 left border) */}
            <div className="bg-white border border-[#D5E6DD] border-l-[5px] border-l-[#2FA37A] rounded-2xl p-4 shadow-eco-sm">
              <div className="w-8 h-8 rounded-xl bg-[#E6F4EC] text-[#1B7F5C] flex items-center justify-center mb-2.5">
                <Scale className="w-4 h-4 text-[#1B7F5C]" />
              </div>
              <h3 className="text-sm font-bold text-[#0F3D3E] mb-0.5">Verified</h3>
              <p className="text-xs text-[#5B6B66] leading-snug">
                Calibrated hanging scales eliminate weight manipulation at the doorstep.
              </p>
            </div>

            {/* Feature 3: Fair price (5px teal-900 left border) */}
            <div className="bg-white border border-[#D5E6DD] border-l-[5px] border-l-[#0F3D3E] rounded-2xl p-4 shadow-eco-sm">
              <div className="w-8 h-8 rounded-xl bg-[#E6F4EC] text-[#1B7F5C] flex items-center justify-center mb-2.5">
                <TrendingUp className="w-4 h-4 text-[#1B7F5C]" />
              </div>
              <h3 className="text-sm font-bold text-[#0F3D3E] mb-0.5">Fair price</h3>
              <p className="text-xs text-[#5B6B66] leading-snug">
                Real-time scrap benchmark indices ensure guaranteed transparent payouts.
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* ================= RIGHT SECTION (AUTH STRIP & FLOATING WHITE CARD) ================= */}
      {/* Solid deep teal strip (--teal-900: #0F3D3E) with a floating white card (radius 28px, shadow rgba(0,0,0,0.25)) containing login form */}
      <div className="w-full lg:w-[480px] xl:w-[520px] bg-[#0F3D3E] flex items-center justify-center p-4 sm:p-8 lg:p-10 shrink-0">
        
        {/* Floating White Card (Radius 28px, shadow rgba(0,0,0,0.25), mx-3.5 on mobile for 14px side margins) */}
        <div className="w-full max-w-[430px] mx-3.5 sm:mx-0 bg-white rounded-[28px] p-7 sm:p-9 shadow-[0_20px_40px_rgba(0,0,0,0.25)] border border-[#D5E6DD] text-[#0F3D3E]">
          
          {/* Logo Icon & Header */}
          <div className="text-center mb-6">
            <SafaiPayLogoIcon className="w-12 h-12 mx-auto mb-2.5 shadow-md shadow-[#1B7F5C]/20" />
            <h2 className="text-2xl font-extrabold text-[#0F3D3E] tracking-tight">
              Welcome to SafaiPay
            </h2>
            <p className="text-xs text-[#5B6B66] mt-1 font-medium">
              Sign in to manage your pickups and earnings.
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-[#C0392B] rounded-xl text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Register info popover */}
          {showRegisterAlert && (
            <div className="mb-4 p-3.5 bg-[#E6F4EC] border border-[#D5E6DD] text-[#0F3D3E] rounded-xl text-xs space-y-1">
              <p className="font-bold text-[#146B4D]">Pilot User Onboarding</p>
              <p className="text-[#3F5A52]">
                SafaiPay pilot accounts are pre-verified. Use any of the 1-click demo buttons below to explore as Customer, Collector, Recycler, or Admin!
              </p>
            </div>
          )}

          {/* Active Session Notice (if user is already authenticated) */}
          {currentUser && (
            <div className="mb-5 p-3.5 bg-[#E6F4EC] border border-[#D5E6DD] rounded-2xl text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[#1B7F5C] animate-pulse" />
                  <span className="font-bold text-[#0F3D3E]">Active Session</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#1B7F5C] text-white">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-[#3F5A52] text-[11px] truncate">
                Signed in as <strong className="text-[#0F3D3E]">{currentUser.full_name || currentUser.phone_number}</strong>
              </p>
              <div className="flex space-x-2 pt-0.5">
                <button
                  type="button"
                  onClick={onGoToDashboard}
                  className="flex-1 bg-[#1B7F5C] hover:bg-[#146B4D] text-white font-bold py-1.5 px-3 rounded-xl text-xs transition shadow-sm text-center flex items-center justify-center space-x-1"
                >
                  <span>Open Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="bg-white hover:bg-slate-50 text-[#C0392B] border border-red-200 font-semibold py-1.5 px-3 rounded-xl text-xs transition"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {/* Sign-in Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0F3D3E] mb-1.5">
                Phone or email
              </label>
              <div className="relative">
                {/* Inputs: background --bg (#F4FAF7), 1px --border (#D5E6DD), radius 14px */}
                <input
                  type="text"
                  required
                  placeholder="+923001110001 or user@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-[#F4FAF7] border border-[#D5E6DD] rounded-[14px] px-4 py-3 text-xs text-[#0F3D3E] placeholder-[#5B6B66] focus:outline-none focus:border-[#1B7F5C] focus:bg-white transition"
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#5B6B66]">
                  <UserIcon className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-[#0F3D3E]">
                  Password
                </label>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Password reset OTP simulation: Demo password is "SafaiPassword123!" or "AdminPassword123!"');
                  }}
                  className="text-[11px] text-[#1B7F5C] hover:text-[#146B4D] font-semibold transition"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#F4FAF7] border border-[#D5E6DD] rounded-[14px] px-4 py-3 text-xs text-[#0F3D3E] placeholder-[#5B6B66] focus:outline-none focus:border-[#1B7F5C] focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#5B6B66] hover:text-[#1B7F5C] transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Primary button: emerald-600 background (#1B7F5C), white text, radius 14px */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1B7F5C] hover:bg-[#146B4D] text-white font-bold py-3.5 rounded-[14px] text-sm transition shadow-md shadow-[#1B7F5C]/25 flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Demo Accounts */}
          {/* Selected role/demo buttons: --mint-50 background, --emerald-600 border, #146B4D text */}
          <div className="mt-6 pt-5 border-t border-[#D5E6DD]">
            <span className="text-[10px] font-bold text-[#5B6B66] uppercase tracking-wider block text-center mb-2.5">
              Quick 1-Click Demo Access
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onQuickDemoLogin('customer')}
                disabled={isLoading}
                className="px-3 py-2 rounded-xl bg-[#E6F4EC] hover:bg-[#D5E6DD] text-[#146B4D] border border-[#D5E6DD] hover:border-[#1B7F5C] text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-eco-sm"
              >
                <UserIcon className="w-3.5 h-3.5 text-[#1B7F5C]" />
                <span>Customer</span>
              </button>

              <button
                type="button"
                onClick={() => onQuickDemoLogin('collector')}
                disabled={isLoading}
                className="px-3 py-2 rounded-xl bg-[#E6F4EC] hover:bg-[#D5E6DD] text-[#146B4D] border border-[#D5E6DD] hover:border-[#1B7F5C] text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-eco-sm"
              >
                <Truck className="w-3.5 h-3.5 text-[#1B7F5C]" />
                <span>Collector</span>
              </button>

              <button
                type="button"
                onClick={() => onQuickDemoLogin('admin')}
                disabled={isLoading}
                className="px-3 py-2 rounded-xl bg-[#E6F4EC] hover:bg-[#D5E6DD] text-[#146B4D] border border-[#D5E6DD] hover:border-[#1B7F5C] text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-eco-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#1B7F5C]" />
                <span>Admin</span>
              </button>

              <button
                type="button"
                onClick={() => onQuickDemoLogin('recycler')}
                disabled={isLoading}
                className="px-3 py-2 rounded-xl bg-[#E6F4EC] hover:bg-[#D5E6DD] text-[#146B4D] border border-[#D5E6DD] hover:border-[#1B7F5C] text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-eco-sm"
              >
                <Factory className="w-3.5 h-3.5 text-[#1B7F5C]" />
                <span>Recycler</span>
              </button>
            </div>
          </div>

          {/* Bottom Register Callout */}
          <div className="mt-5 text-center">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setShowRegisterAlert(!showRegisterAlert);
              }}
              className="text-xs text-[#1B7F5C] hover:text-[#146B4D] font-semibold transition"
            >
              New collector or customer? Create a SafaiPay account
            </a>
          </div>

        </div>

      </div>

    </div>
  );
};
