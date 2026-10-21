'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '@/lib/types';
import { 
  getCurrentUser, 
  loginWithCredentials, 
  loginAsGuest as loginAsGuestApi,
  logoutUser, 
  removeAuthToken, 
  getAuthToken 
} from '@/lib/api';

interface AuthContextType {
  user: User | null;
  role: UserRole | 'unknown' | null;
  isLoading: boolean;
  login: (identifier: string, pass: string) => Promise<User>;
  loginAsGuest: (role: 'customer' | 'collector' | 'recycler') => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  updateUser: (partial: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return null;
    }
    try {
      const u = await getCurrentUser();
      setUser(u);
      return u;
    } catch {
      removeAuthToken();
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (identifier: string, pass: string): Promise<User> => {
    setIsLoading(true);
    try {
      const authResult = await loginWithCredentials(identifier, pass);
      setUser(authResult.user);
      return authResult.user;
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsGuest = async (guestRole: 'customer' | 'collector' | 'recycler'): Promise<User> => {
    setIsLoading(true);
    try {
      const authResult = await loginAsGuestApi(guestRole);
      setUser(authResult.user);
      return authResult.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = useCallback((partial: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : null));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        isLoading,
        login,
        loginAsGuest,
        logout,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
