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
    <div className="bg-white rounded-2xl border border-[#D5E6DD] p-5 shadow-eco-sm transition hover:shadow-eco-md">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-[#0F3D3E] tracking-tight flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1B7F5C]" />
            <span>{title}</span>
          </h3>
          {subtitle && <p className="text-xs text-[#5B6B66] mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono font-bold text-[#0F3D3E] bg-[#F4FAF7] px-2.5 py-1 rounded-lg border border-[#D5E6DD]">
            {current} of {total} {unit}
          </span>
          <span className="text-sm font-mono font-extrabold text-[#146B4D] bg-[#E6F4EC] px-2.5 py-1 rounded-lg border border-[#D5E6DD]">
            {percentage}%
          </span>
        </div>
      </div>

      <div className="w-full bg-[#F4FAF7] rounded-full h-3.5 overflow-hidden p-0.5 border border-[#D5E6DD] mt-2">
        <div
          style={{ width: `${percentage}%` }}
          className="h-full rounded-full bg-gradient-to-r from-[#1B7F5C] to-[#2FA37A] transition-all duration-700 shadow-2xs"
        />
      </div>

      <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#D5E6DD]/60 text-[11px] text-[#5B6B66]">
        <span>Daily Shift Quota Target</span>
        <span className="font-semibold text-[#146B4D]">
          {total - current > 0 ? `${total - current} ${unit} remaining today` : 'Target Achieved! 🎉'}
        </span>
      </div>
    </div>
  );
};
