'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  isSystem: boolean;
  setThemePreference: (pref: ThemePreference) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'safaipay_theme_preference';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [mounted, setMounted] = useState<boolean>(false);

  // Helper to determine system theme
  const getSystemTheme = useCallback((): ResolvedTheme => {
    if (typeof window === 'undefined' || !window.matchMedia) return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  // Apply theme classes and attributes to DOM
  const applyTheme = useCallback((target: ResolvedTheme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    if (target === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }

    // Set meta theme-color for browser address bar
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', target === 'dark' ? '#071F1F' : '#16865F');
    }
  }, []);

  // Initialize theme from localStorage or system on mount
  useEffect(() => {
    setMounted(true);
    let initialPref: ThemePreference = 'system';

    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference;
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        initialPref = stored;
      }
    } catch {}

    setThemePreferenceState(initialPref);

    const initialResolved = initialPref === 'system' ? getSystemTheme() : initialPref;
    setResolvedTheme(initialResolved);
    applyTheme(initialResolved);
  }, [getSystemTheme, applyTheme]);

  // Listen for OS system theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (themePreference === 'system') {
        const nextResolved: ResolvedTheme = e.matches ? 'dark' : 'light';
        setResolvedTheme(nextResolved);
        applyTheme(nextResolved);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
      return () => mediaQuery.removeEventListener('change', handleSystemChange);
    } else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(handleSystemChange);
      return () => (mediaQuery as any).removeListener(handleSystemChange);
    }
  }, [themePreference, applyTheme]);

  // Update theme preference
  const setThemePreference = useCallback((pref: ThemePreference) => {
    setThemePreferenceState(pref);
    try {
      localStorage.setItem(STORAGE_KEY, pref);
    } catch {}

    const nextResolved = pref === 'system' ? getSystemTheme() : pref;
    setResolvedTheme(nextResolved);
    applyTheme(nextResolved);
  }, [getSystemTheme, applyTheme]);

  // Toggle theme utility
  const toggleTheme = useCallback(() => {
    if (resolvedTheme === 'light') {
      setThemePreference('dark');
    } else {
      setThemePreference('light');
    }
  }, [resolvedTheme, setThemePreference]);

  return (
    <ThemeContext.Provider
      value={{
        themePreference,
        resolvedTheme,
        isSystem: themePreference === 'system',
        setThemePreference,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
