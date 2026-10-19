'use client';

import React from 'react';

export interface HorizontalBarItem {
  label: string;
  value: number;
  secondaryText?: string;
  color?: string;
}

interface HorizontalBarChartProps {
  title: string;
  subtitle?: string;
  items: HorizontalBarItem[];
  unit?: string;
  totalLabel?: string;
  totalValue?: string;
}

export const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({
  title,
  subtitle,
  items,
  unit = '',
  totalLabel,
  totalValue,
}) => {
  if (!items || items.length === 0) return null;

  const maxValue = Math.max(...items.map((i) => i.value), 1);
  const total = items.reduce((acc, curr) => acc + curr.value, 0);

  // Chart order per rule: emerald-600, gold-500, teal-900, mint-300, info blue
  const defaultColors = [
    'from-[#1B7F5C] to-[#2FA37A]',
    'from-[#F2A900] to-[#D99500]',
    'from-[#0F3D3E] to-[#146B4D]',
    'from-[#2FA37A] to-[#9FE6C6]',
    'from-[#2E6F9E] to-[#3B82F6]',
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#D5E6DD] p-5 shadow-eco-sm transition hover:shadow-eco-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#D5E6DD]/60">
        <div>
          <h3 className="text-sm font-bold text-[#0F3D3E] tracking-tight flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1B7F5C]" />
            <span>{title}</span>
          </h3>
          {subtitle && <p className="text-xs text-[#5B6B66] mt-0.5">{subtitle}</p>}
        </div>

        {totalValue ? (
          <div className="bg-[#E6F4EC] border border-[#D5E6DD] rounded-xl px-3 py-1.5 text-left sm:text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#146B4D] block">
              {totalLabel || 'Total Distributed'}
            </span>
            <span className="text-sm font-extrabold text-[#0F3D3E] font-mono">
              {totalValue}
            </span>
          </div>
        ) : (
          <span className="text-xs font-mono font-bold text-[#146B4D] bg-[#E6F4EC] px-2.5 py-1 rounded-lg border border-[#D5E6DD]">
            {total} {unit}
          </span>
        )}
      </div>

      <div className="space-y-4 pt-1">
        {items.map((item, index) => {
          const percentage = Math.round((item.value / maxValue) * 100);
          const shareOfTotal = Math.round((item.value / (total || 1)) * 100);
          const gradient = item.color || defaultColors[index % defaultColors.length];

          return (
            <div key={index} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#0F3D3E] flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#5B6B66]" />
                  <span>{item.label}</span>
                  {item.secondaryText && (
                    <span className="text-[11px] text-[#5B6B66] font-normal">
                      ({item.secondaryText})
                    </span>
                  )}
                </span>
                <div className="flex items-center space-x-2 font-mono">
                  <span className="font-extrabold text-[#0F3D3E]">
                    {item.value.toLocaleString()} {unit}
                  </span>
                  <span className="text-[11px] text-[#146B4D] bg-[#E6F4EC] px-1.5 py-0.5 rounded font-semibold border border-[#D5E6DD]">
                    {shareOfTotal}%
                  </span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="w-full bg-[#F4FAF7] rounded-full h-3 overflow-hidden p-0.5 border border-[#D5E6DD]">
                <div
                  style={{ width: `${percentage}%` }}
                  className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-500 shadow-2xs`}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#D5E6DD]/60 text-[11px] text-[#5B6B66]">
        <span>Verified Inventory Allocation</span>
        <span className="font-semibold text-[#146B4D]">100% Traceable</span>
      </div>
    </div>
  );
};
