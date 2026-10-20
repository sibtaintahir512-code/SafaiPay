'use client';

import React from 'react';
import { useTheme, ThemePreference } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeSwitcherProps {
  variant?: 'compact' | 'full' | 'dropdown' | 'menu' | 'pill';
  className?: string;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { themePreference, setThemePreference, resolvedTheme } = useTheme();
  const { isUrdu } = useLanguage();
  const isDark = resolvedTheme === 'dark';

  const options: {
    value: ThemePreference;
    labelEn: string;
    labelUr: string;
    ariaLabel: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: 'light',
      labelEn: 'Light',
      labelUr: 'لائٹ',
      ariaLabel: 'Light theme',
      icon: <Sun className="w-5 h-5 stroke-[1.8] stroke-linecap-round" />,
    },
    {
      value: 'dark',
      labelEn: 'Dark',
      labelUr: 'ڈارک',
      ariaLabel: 'Dark theme',
      icon: <Moon className="w-5 h-5 stroke-[1.8] stroke-linecap-round" />,
    },
  ];

  // 1. Floating Pill Title Bar Icon-Only Toggle (or compact)
  if (variant === 'compact' || variant === 'pill') {
    return (
      <div
        role="group"
        aria-label={isUrdu ? 'ڈسپلے تھیم' : 'Theme mode toggle'}
        className={`inline-flex items-center p-[4px] rounded-[24px] transition-colors duration-150 ${className}`}
        style={{
          backgroundColor: isDark ? '#07110F' : '#EEF6F2',
        }}
      >
        {options.map((opt) => {
          const isSelected = themePreference === opt.value;

          return (
            <button
              key={opt.value}
              type="button"
              aria-label={opt.ariaLabel}
              aria-pressed={isSelected}
              onClick={() => setThemePreference(opt.value)}
              title={opt.ariaLabel}
              className="w-[40px] h-[40px] rounded-[20px] flex items-center justify-center transition-all duration-150 pill-focus cursor-pointer select-none"
              style={{
                backgroundColor: isSelected ? '#6CCB9D' : 'transparent',
                color: isSelected
                  ? '#07110F'
                  : isDark
                  ? '#9FB8AF'
                  : '#4B6B60',
              }}
            >
              <span className="shrink-0">{opt.icon}</span>
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
            aria-label={opt.ariaLabel}
            onClick={() => setThemePreference(opt.value)}
            className={`w-full min-h-[84px] py-3.5 px-3 rounded-2xl border flex flex-col items-center justify-center transition-all duration-150 cursor-pointer pill-focus ${
              isSelected
                ? 'bg-theme-soft-mint/60 border-theme-primary ring-2 ring-theme-primary/20 shadow-xs'
                : 'bg-theme-bg/60 border-theme-border hover:bg-theme-soft-mint/30 hover:border-theme-primary/40'
            }`}
          >
            {/* Centered Theme Icon */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mb-1.5 transition-colors duration-150 ${
                isSelected
                  ? 'bg-theme-primary text-white shadow-xs'
                  : 'bg-theme-surface border border-theme-border text-theme-secondary'
              }`}
            >
              {opt.icon}
            </div>

            {/* Label below the icon */}
            <span
              className={`text-xs font-bold transition-colors duration-150 ${
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
