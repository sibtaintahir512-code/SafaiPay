'use client';

import React from 'react';
import { useTheme, ThemePreference } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeSwitcherProps {
  variant?: 'compact' | 'full' | 'dropdown' | 'menu';
  className?: string;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { themePreference, setThemePreference } = useTheme();
  const { isUrdu } = useLanguage();

  const options: {
    value: ThemePreference;
    labelEn: string;
    labelUr: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: 'light',
      labelEn: 'Light',
      labelUr: 'لائٹ',
      icon: <Sun className="w-5 h-5" />,
    },
    {
      value: 'dark',
      labelEn: 'Dark',
      labelUr: 'ڈارک',
      icon: <Moon className="w-5 h-5" />,
    },
  ];

  // 1. Compact Segmented Control (Pill-style for Header / Top Nav)
  if (variant === 'compact') {
    return (
      <div
        role="radiogroup"
        aria-label={isUrdu ? 'تھیم منتخب کریں' : 'Theme mode selector'}
        className={`inline-flex items-center p-1 rounded-2xl bg-theme-surface border border-theme-border shadow-xs transition-colors ${className}`}
      >
        {options.map((opt) => {
          const isSelected = themePreference === opt.value;
          const label = isUrdu ? opt.labelUr : opt.labelEn;

          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setThemePreference(opt.value)}
              title={label}
              className={`min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary ${
                isSelected
                  ? 'bg-theme-primary text-white shadow-xs'
                  : 'text-theme-secondary hover:text-theme-text hover:bg-theme-soft-mint'
              }`}
            >
              <span className="shrink-0">{opt.icon}</span>
              <span className="hidden sm:inline-block text-[11px] font-semibold">{label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // 2. Theme Cards (For Profile Dropdown Menu, Settings, and Profile screens)
  // Two cards of equal width and height, icons properly centered, labels below the icon, no descriptions
  return (
    <div
      role="radiogroup"
      aria-label={isUrdu ? 'ڈسپلے تھیم' : 'Theme preference'}
      className={`grid grid-cols-2 gap-3 w-full ${className}`}
    >
      {options.map((opt) => {
        const isSelected = themePreference === opt.value;
        const label = isUrdu ? opt.labelUr : opt.labelEn;

        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => setThemePreference(opt.value)}
            className={`w-full min-h-[84px] py-3.5 px-3 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary ${
              isSelected
                ? 'bg-theme-soft-mint/60 border-theme-primary ring-2 ring-theme-primary/20 shadow-xs'
                : 'bg-theme-bg/60 border-theme-border hover:bg-theme-soft-mint/30 hover:border-theme-primary/40'
            }`}
          >
            {/* Centered Theme Icon */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mb-1.5 transition-colors ${
                isSelected
                  ? 'bg-theme-primary text-white shadow-xs'
                  : 'bg-theme-surface border border-theme-border text-theme-secondary'
              }`}
            >
              {opt.icon}
            </div>

            {/* Label below the icon */}
            <span
              className={`text-xs font-bold transition-colors ${
                isSelected ? 'text-theme-primary' : 'text-theme-text'
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
