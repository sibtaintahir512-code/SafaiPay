'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '@/lib/types';
import { 
  getCurrentUser, 
  loginWithCredentials, 
  removeAuthToken, 
  getAuthToken, 
  getDashboardPath,
  setAuthToken
} from '@/lib/api';
import { DEMO_USERS_MAP } from '@/lib/mockData';

interface AuthContextType {
  user: User | null;
  role: UserRole | 'unknown' | null;
  isLoading: boolean;
  login: (identifier: string, pass: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
  switchRole: (newRole: UserRole) => User;
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
      // If valid demo role stored, do not clear session on network glitch
      if (typeof window !== 'undefined') {
        const storedRole = localStorage.getItem('safaipay_active_role') as UserRole;
        if (storedRole && DEMO_USERS_MAP[storedRole]) {
          const fallback = DEMO_USERS_MAP[storedRole];
          setUser(fallback);
          return fallback;
        }
      }
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
      await loginWithCredentials(identifier, pass);
      const u = await getCurrentUser();
      setUser(u);
      return u;
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = (newRole: UserRole): User => {
    const demo = DEMO_USERS_MAP[newRole];
    setAuthToken(`demo_jwt_token_${newRole}_${Date.now()}`);
    if (typeof window !== 'undefined') {
      localStorage.setItem('safaipay_active_role', newRole);
    }
    setUser(demo);
    return demo;
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        isLoading,
        login,
        logout,
        refreshUser,
        switchRole,
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
