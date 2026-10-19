'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/types';
import { getDashboardPath } from '@/lib/api';
import { SafaiPayLogoIcon } from '@/components/SafaiPayLogo';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: UserRole | UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (allowedRole) {
      const isAllowed = Array.isArray(allowedRole)
        ? allowedRole.includes(role as UserRole)
        : role === allowedRole;

      if (!isAllowed) {
        if (role === 'unknown') {
          router.replace('/onboarding');
        } else {
          router.replace(getDashboardPath(role));
        }
      }
    }
  }, [user, role, isLoading, allowedRole, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-6 text-[#0F3D3E]">
        <div className="w-14 h-14 rounded-2xl bg-[#E6F4EC] border border-[#D5E6DD] flex items-center justify-center mb-4 shadow-eco-sm">
          <SafaiPayLogoIcon className="w-8 h-8 animate-pulse" />
        </div>
        <p className="text-sm font-bold text-[#0F3D3E]">Verifying SafaiPay Session...</p>
        <p className="text-xs text-[#5B6B66] mt-1">Checking authenticated role permissions</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (allowedRole) {
    const isAllowed = Array.isArray(allowedRole)
      ? allowedRole.includes(role as UserRole)
      : role === allowedRole;
    if (!isAllowed) return null;
  }

  return <>{children}</>;
};
