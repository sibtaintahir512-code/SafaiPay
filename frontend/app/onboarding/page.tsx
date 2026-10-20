'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { getDashboardPath } from '@/lib/api';
import { SafaiPayLogo } from '@/components/SafaiPayLogo';
import { CircularRecyclingOrbit } from '@/components/CircularRecyclingOrbit';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { LogOut, ShieldCheck, RefreshCw } from 'lucide-react';

export default function OnboardingPage() {
  const { user, role, logout, isLoading } = useAuth();
  const { resolvedTheme } = useTheme();
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
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-theme-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-200">
      
      <div className="w-full max-w-lg bg-theme-surface border border-theme-border rounded-3xl p-6 sm:p-8 shadow-theme-card text-center space-y-6">
        
        <div className="flex items-center justify-between pb-3 border-b border-theme-border/60">
          <SafaiPayLogo size="md" isDark={resolvedTheme === 'dark'} />
          <ThemeSwitcher variant="compact" />
        </div>

        {/* Orbit Graphic */}
        <div className="py-2">
          <CircularRecyclingOrbit showJourneyCard={false} />
        </div>

        <div className="space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-theme-soft-mint border border-theme-border text-theme-primary flex items-center justify-center mx-auto shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <h1 className="text-xl font-bold text-theme-text">
            Account Verification in Progress
          </h1>
          <p className="text-xs text-theme-secondary leading-relaxed max-w-sm mx-auto">
            {user?.full_name ? `Welcome ${user.full_name}. ` : ''}Your account has been registered. Role privileges are assigned only by verified platform administrators.
          </p>
        </div>

        <div className="p-4 bg-theme-bg border border-theme-border rounded-2xl text-left text-xs text-theme-secondary space-y-1.5">
          <p className="font-semibold text-theme-text">Need expedited activation?</p>
          <p>Please reach out to SafaiPay operations:</p>
          <p className="font-mono text-theme-primary font-bold">+92 (021) 3512-7000</p>
          <p className="text-[11px] text-theme-secondary">operations@safaipay.org</p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-theme-surface hover:bg-theme-soft-mint text-theme-error border border-red-200 dark:border-red-900/40 font-semibold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center space-x-1.5 min-h-[44px]"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
