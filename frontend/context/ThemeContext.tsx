'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ThemePreference = 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setThemePreference: (pref: ThemePreference) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'safaipay_theme_preference';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('light');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

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

  // Initialize theme from localStorage on mount (strictly light or dark)
  useEffect(() => {
    let initialPref: ThemePreference = 'light';

    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference;
      if (stored === 'light' || stored === 'dark') {
        initialPref = stored;
      }
    } catch {}

    setThemePreferenceState(initialPref);
    setResolvedTheme(initialPref);
    applyTheme(initialPref);
  }, [applyTheme]);

  // Update theme preference
  const setThemePreference = useCallback((pref: ThemePreference) => {
    const validPref: ThemePreference = pref === 'dark' ? 'dark' : 'light';
    setThemePreferenceState(validPref);
    try {
      localStorage.setItem(STORAGE_KEY, validPref);
    } catch {}

    setResolvedTheme(validPref);
    applyTheme(validPref);
  }, [applyTheme]);

  // Toggle theme utility
  const toggleTheme = useCallback(() => {
    setThemePreference(resolvedTheme === 'light' ? 'dark' : 'light');
  }, [resolvedTheme, setThemePreference]);

  return (
    <ThemeContext.Provider
      value={{
        themePreference,
        resolvedTheme,
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
