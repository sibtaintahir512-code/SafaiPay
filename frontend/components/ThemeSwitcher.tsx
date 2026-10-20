'use client';

import React from 'react';
import { useTheme, ThemePreference } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sun, Moon, Laptop, Check } from 'lucide-react';

interface ThemeSwitcherProps {
  variant?: 'compact' | 'full' | 'dropdown' | 'menu';
  className?: string;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { themePreference, setThemePreference, resolvedTheme } = useTheme();
  const { isUrdu } = useLanguage();

  const options: {
    value: ThemePreference;
    labelEn: string;
    labelUr: string;
    descEn: string;
    descUr: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: 'light',
      labelEn: 'Light',
      labelUr: 'لائٹ موڈ',
      descEn: 'Clean high-contrast daytime theme',
      descUr: 'دن کے وقت کے لیے روشن اور واضح تھیم',
      icon: <Sun className="w-4 h-4" />,
    },
    {
      value: 'dark',
      labelEn: 'Dark',
      labelUr: 'ڈارک موڈ',
      descEn: 'Reduced eye strain dark environment',
      descUr: 'کم روشنی میں آنکھوں پر بوجھ کم کرنے والا تھیم',
      icon: <Moon className="w-4 h-4" />,
    },
    {
      value: 'system',
      labelEn: 'System',
      labelUr: 'سسٹم ڈیفالٹ',
      descEn: 'Automatically sync with your device OS settings',
      descUr: 'خودکار طور پر آپ کے ڈیوائس کی ترتیبات سے مطابقت رکھتا ہے',
      icon: <Laptop className="w-4 h-4" />,
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
              title={`${label} (${isUrdu ? opt.descUr : opt.descEn})`}
              className={`min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary ${
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

  // 2. Menu / Dropdown specific variant (Stacked vertical cards that never overlap or clip descriptions)
  if (variant === 'menu' || variant === 'dropdown') {
    return (
      <div
        role="radiogroup"
        aria-label={isUrdu ? 'ڈسپلے تھیم ترجیح' : 'Display theme preference'}
        className={`space-y-2 ${className}`}
      >
        {options.map((opt) => {
          const isSelected = themePreference === opt.value;
          const label = isUrdu ? opt.labelUr : opt.labelEn;
          const desc = isUrdu ? opt.descUr : opt.descEn;

          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setThemePreference(opt.value)}
              className={`w-full min-h-[48px] p-2.5 rounded-xl border text-left rtl:text-right flex items-center justify-between transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary ${
                isSelected
                  ? 'bg-theme-soft-mint/60 border-theme-primary ring-1 ring-theme-primary/30'
                  : 'bg-theme-bg/60 border-theme-border hover:bg-theme-soft-mint/30 hover:border-theme-primary/40'
              }`}
            >
              <div className="flex items-center space-x-2.5 rtl:space-x-reverse min-w-0 pr-2 rtl:pl-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-theme-primary text-white'
                      : 'bg-theme-surface border border-theme-border text-theme-secondary'
                  }`}
                >
                  {opt.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-theme-text flex items-center gap-1.5">
                    <span>{label}</span>
                    {opt.value === 'system' && (
                      <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-theme-surface border border-theme-border text-theme-secondary">
                        {resolvedTheme}
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-theme-secondary leading-snug break-words">
                    {desc}
                  </p>
                </div>
              </div>

              <div className="shrink-0 pl-1 rtl:pr-1">
                {isSelected ? (
                  <span className="w-5 h-5 rounded-full bg-theme-primary text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                ) : (
                  <span className="w-5 h-5 rounded-full border border-theme-border bg-theme-surface flex items-center justify-center" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // 3. Full Expanded Cards (For Settings Page / Large Dashboards)
  return (
    <div
      role="radiogroup"
      aria-label={isUrdu ? 'پلیٹ فارم ڈسپلے تھیم' : 'Platform display theme'}
      className={`grid grid-cols-1 md:grid-cols-3 gap-3 ${className}`}
    >
      {options.map((opt) => {
        const isSelected = themePreference === opt.value;
        const label = isUrdu ? opt.labelUr : opt.labelEn;
        const desc = isUrdu ? opt.descUr : opt.descEn;

        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => setThemePreference(opt.value)}
            className={`min-h-[64px] p-4 rounded-2xl border text-left rtl:text-right flex items-start justify-between transition-all relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary ${
              isSelected
                ? 'bg-theme-soft-mint/60 border-theme-primary ring-2 ring-theme-primary/20 shadow-xs'
                : 'bg-theme-surface border-theme-border hover:border-theme-primary/40'
            }`}
          >
            <div className="flex items-start space-x-3 rtl:space-x-reverse min-w-0 pr-2 rtl:pl-2">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-theme-primary text-white'
                    : 'bg-theme-surface border border-theme-border text-theme-secondary'
                }`}
              >
                {opt.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-theme-text flex items-center gap-1.5">
                  <span>{label}</span>
                  {opt.value === 'system' && (
                    <span className="text-[10px] font-mono font-normal px-1.5 py-0.2 rounded bg-theme-surface border border-theme-border text-theme-secondary">
                      {resolvedTheme}
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-theme-secondary mt-0.5 leading-snug break-words">
                  {desc}
                </p>
              </div>
            </div>

            {isSelected && (
              <span className="w-5 h-5 rounded-full bg-theme-primary text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
