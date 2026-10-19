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
      <div className="min-h-screen w-full bg-[#F4FAF7] flex items-center justify-center p-4 sm:p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#D5E6DD] p-7 sm:p-9 shadow-xl text-center space-y-5">
          <SafaiPayLogo size="lg" className="justify-center" />

          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-extrabold text-[#0F3D3E]">
              Access Denied: 403 Forbidden
            </h2>
            <p className="text-xs text-[#5B6B66] leading-relaxed">
              This portal is restricted to verified{' '}
              <strong className="text-[#0F3D3E] capitalize">{allowedRoles.join(' / ')}</strong> participants.
              Your account is verified as{' '}
              <strong className="text-[#1B7F5C] capitalize">{role || 'Unassigned'}</strong>.
            </p>
          </div>

          <div className="p-3.5 bg-[#F4FAF7] border border-[#D5E6DD] rounded-2xl text-left text-xs space-y-1">
            <p className="font-semibold text-[#0F3D3E]">Security Policy Notice</p>
            <p className="text-[#5B6B66]">
              Direct URL access to non-assigned dashboards is strictly restricted by platform RBAC.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => router.replace(authorizedPath)}
              className="w-full bg-[#1B7F5C] hover:bg-[#146B4D] text-white font-bold py-3 px-4 rounded-xl text-xs transition shadow-md shadow-[#1B7F5C]/20 flex items-center justify-center space-x-1.5"
            >
              <span>Go to your authorized {role} dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={async () => {
                await logout();
                router.replace('/login');
              }}
              className="w-full bg-white hover:bg-slate-50 text-[#C0392B] border border-red-200 font-semibold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center space-x-1.5"
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
