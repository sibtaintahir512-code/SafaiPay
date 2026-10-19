'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LandingLoginPage } from '@/components/LandingLoginPage';
import { getDashboardPath } from '@/lib/api';
import { RefreshCw } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { user, role, login, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Silently redirect if already authenticated with a verified role
  useEffect(() => {
    if (!authLoading && user && role && role !== 'unknown') {
      const destination = getDashboardPath(role);
      router.replace(destination);
    }
  }, [authLoading, user, role, router]);

  const handleLogin = async (identifier: string, pass: string) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const authenticatedUser = await login(identifier, pass);
      const destination = getDashboardPath(authenticatedUser.role);
      router.replace(destination);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid credentials. Please check your phone/email and password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prevent login page flickering while checking existing session
  if (authLoading || (user && role && role !== 'unknown')) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F4FAF7]">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-[#1B7F5C]" />
          <p className="text-xs font-semibold text-[#5B6B66] tracking-wide">
            Checking session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <LandingLoginPage
      onLogin={handleLogin}
      isLoading={isSubmitting}
      errorMessage={errorMessage}
    />
  );
};
