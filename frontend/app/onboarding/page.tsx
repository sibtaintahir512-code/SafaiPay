'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getDashboardPath } from '@/lib/api';
import { SafaiPayLogo } from '@/components/SafaiPayLogo';
import { LogOut, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';

export default function OnboardingPage() {
  const { user, role, logout, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      } else if (role && role !== 'unknown') {
        router.replace(getDashboardPath(role));
      }
    }
  }, [user, role, isLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  if (isLoading || (user && role && role !== 'unknown')) {
    return (
      <div className="min-h-screen bg-[#F4FAF7] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-[#1B7F5C]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4FAF7] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-md bg-white border border-[#D5E6DD] rounded-3xl p-8 sm:p-10 shadow-xl text-center space-y-5">
        <SafaiPayLogo size="lg" className="justify-center" />

        <div className="w-12 h-12 rounded-2xl bg-[#E6F4EC] border border-[#D5E6DD] text-[#146B4D] flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>

        <h1 className="text-xl font-bold text-[#0F3D3E]">
          Account Verification in Progress
        </h1>
        <p className="text-xs text-[#5B6B66] leading-relaxed">
          {user?.full_name ? `Welcome ${user.full_name}. ` : ''}Your account has been registered. Role privileges are assigned only by verified platform administrators.
        </p>

        <div className="p-4 bg-[#F4FAF7] border border-[#D5E6DD] rounded-2xl text-left text-xs text-[#3F5A52] space-y-1.5">
          <p className="font-semibold text-[#0F3D3E]">Need expedited activation?</p>
          <p>Please reach out to SafaiPay operations:</p>
          <p className="font-mono text-[#1B7F5C]">+92 (021) 3512-7000</p>
          <p className="text-[11px] text-[#5B6B66]">operations@safaipay.org</p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-white hover:bg-slate-50 text-[#C0392B] border border-red-200 font-semibold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center space-x-1.5"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
