'use client';

import React from 'react';

interface ProgressBarProps {
  title: string;
  subtitle?: string;
  current: number;
  total: number;
  unit?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  title,
  subtitle,
  current,
  total,
  unit = 'jobs',
}) => {
  const percentage = Math.min(Math.round((current / (total || 1)) * 100), 100);

  return (
    <div className="bg-theme-surface rounded-2xl border border-theme-border p-5 shadow-xs transition-colors hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-theme-text tracking-tight flex items-center space-x-2 rtl:space-x-reverse">
            <span className="w-2.5 h-2.5 rounded-full bg-theme-primary" />
            <span>{title}</span>
          </h3>
          {subtitle && <p className="text-xs text-theme-secondary mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <span className="text-xs font-mono font-bold text-theme-text bg-theme-bg px-2.5 py-1 rounded-lg border border-theme-border">
            {current} of {total} {unit}
          </span>
          <span className="text-sm font-mono font-extrabold text-theme-primary bg-theme-soft-mint px-2.5 py-1 rounded-lg border border-theme-border">
            {percentage}%
          </span>
        </div>
      </div>

      <div className="w-full bg-theme-bg rounded-full h-3.5 overflow-hidden p-0.5 border border-theme-border mt-2">
        <div
          style={{ width: `${percentage}%` }}
          className="h-full rounded-full bg-gradient-to-r from-theme-primary to-theme-bright-green transition-all duration-700 shadow-2xs"
        />
      </div>

      <div className="flex items-center justify-between pt-3 mt-3 border-t border-theme-border/60 text-[11px] text-theme-secondary">
        <span>Daily Shift Quota Target</span>
        <span className="font-semibold text-theme-primary">
          {total - current > 0 ? `${total - current} ${unit} remaining today` : 'Target Achieved! 🎉'}
        </span>
      </div>
    </div>
  );
};
