'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LandingLoginPage } from '@/components/LandingLoginPage';
import { UserRole } from '@/lib/types';
import { getDashboardPath } from '@/lib/api';

const DEMO_CREDENTIALS: Record<UserRole, { username: string; pass: string }> = {
  admin: { username: 'admin@safaipay.org', pass: 'AdminPassword123!' },
  customer: { username: '+923001110001', pass: 'SafaiPassword123!' },
  collector: { username: '+923002220001', pass: 'SafaiPassword123!' },
  recycler: { username: '+923003330001', pass: 'SafaiPassword123!' },
};

export const LoginView: React.FC = () => {
  const { user, login, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (identifier: string, pass: string) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const authenticatedUser = await login(identifier, pass);
      const destination = getDashboardPath(authenticatedUser.role);
      router.push(destination);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async (targetRole: UserRole) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const cred = DEMO_CREDENTIALS[targetRole];
      const authenticatedUser = await login(cred.username, cred.pass);
      const destination = getDashboardPath(authenticatedUser.role);
      router.push(destination);
    } catch (err: any) {
      setErrorMessage(err.message || 'Demo login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToDashboard = () => {
    if (user) {
      router.push(getDashboardPath(user.role));
    }
  };

  return (
    <LandingLoginPage
      onLogin={handleLogin}
      onQuickDemoLogin={handleQuickDemoLogin}
      isLoading={isSubmitting}
      errorMessage={errorMessage}
      currentUser={user}
      onLogout={logout}
      onGoToDashboard={handleGoToDashboard}
    />
  );
};
