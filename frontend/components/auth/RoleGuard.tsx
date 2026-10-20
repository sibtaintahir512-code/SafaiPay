'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/types';
import { getDashboardPath } from '@/lib/api';
import { ShieldAlert, RefreshCw, ArrowRight, LogOut } from 'lucide-react';
import { SafaiPayLogo } from '@/components/SafaiPayLogo';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user, role, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  // Loading state (prevents page flicker or unauthorized view flash)
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F4FAF7]">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-[#1B7F5C]" />
          <p className="text-xs font-semibold text-[#5B6B66] tracking-wide">
            Verifying secure session...
          </p>
        </div>
      </div>
    );
  }

  // Unauthenticated: redirecting
  if (!user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F4FAF7]">
        <RefreshCw className="w-8 h-8 animate-spin text-[#1B7F5C]" />
      </div>
    );
  }

  // Role validation: check if user's verified role is in allowedRoles
  const isAuthorized = role && allowedRoles.includes(role as UserRole);

  if (!isAuthorized) {
    const authorizedPath = getDashboardPath(role);

    return (
      <div className="min-h-screen w-full bg-theme-bg text-theme-text flex items-center justify-center p-4 sm:p-6 font-sans transition-colors duration-200">
        <div className="max-w-md w-full bg-theme-surface rounded-3xl border border-theme-border p-7 sm:p-9 shadow-2xl text-center space-y-5">
          <SafaiPayLogo size="lg" className="justify-center" />

          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-theme-warning flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-extrabold text-theme-text">
              Access Denied: 403 Forbidden
            </h2>
            <p className="text-xs text-theme-secondary leading-relaxed">
              This portal is restricted to verified{' '}
              <strong className="text-theme-text capitalize">{allowedRoles.join(' / ')}</strong> participants.
              Your account is verified as{' '}
              <strong className="text-theme-primary capitalize">{role || 'Unassigned'}</strong>.
            </p>
          </div>

          <div className="p-3.5 bg-theme-bg border border-theme-border rounded-2xl text-left rtl:text-right text-xs space-y-1">
            <p className="font-semibold text-theme-text">Security Policy Notice</p>
            <p className="text-theme-secondary">
              Direct URL access to non-assigned dashboards is strictly restricted by platform RBAC.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => router.replace(authorizedPath)}
              className="w-full bg-theme-primary hover:opacity-95 text-white font-bold py-3.5 px-4 rounded-xl text-xs transition shadow-md shadow-theme-primary/20 flex items-center justify-center space-x-1.5 min-h-[44px]"
            >
              <span>Go to your authorized {role} dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={async () => {
                await logout();
                router.replace('/login');
              }}
              className="w-full bg-theme-surface hover:bg-theme-bg text-theme-error border border-red-200 dark:border-red-900/50 font-semibold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center space-x-1.5 min-h-[44px]"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out & Switch Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
