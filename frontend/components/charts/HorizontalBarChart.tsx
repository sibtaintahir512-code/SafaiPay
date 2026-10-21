'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';

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
  if (!items || items.length === 0) {
    return (
      <div className="bg-theme-surface rounded-2xl border border-theme-border p-6 shadow-xs flex flex-col items-center justify-center min-h-[200px] text-center transition-colors">
        <div className="w-12 h-12 rounded-2xl bg-theme-soft-mint text-theme-primary flex items-center justify-center mb-3">
          <BarChart3 className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-theme-text">{title}</h3>
        {subtitle && <p className="text-xs text-theme-secondary mt-1">{subtitle}</p>}
        <p className="text-xs text-theme-secondary/80 mt-2 max-w-xs">
          No inventory stream records available.
        </p>
      </div>
    );
  }

  const maxValue = Math.max(...items.map((i) => i.value), 1);
  const total = items.reduce((acc, curr) => acc + curr.value, 0);

  const defaultColors = [
    'from-theme-primary to-theme-bright-green',
    'from-theme-yellow to-[#D99500]',
    'from-theme-deep-green to-theme-primary',
    'from-theme-bright-green to-theme-bright-mint',
    'from-sky-600 to-sky-400',
  ];

  return (
    <div className="bg-theme-surface rounded-2xl border border-theme-border p-5 shadow-xs transition-colors hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-theme-border/60">
        <div>
          <h3 className="text-sm font-bold text-theme-text tracking-tight flex items-center space-x-2 rtl:space-x-reverse">
            <span className="w-2.5 h-2.5 rounded-full bg-theme-primary" />
            <span>{title}</span>
          </h3>
          {subtitle && <p className="text-xs text-theme-secondary mt-0.5">{subtitle}</p>}
        </div>

        {totalValue ? (
          <div className="bg-theme-soft-mint border border-theme-border rounded-xl px-3 py-1.5 text-left sm:text-right rtl:sm:text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-primary block">
              {totalLabel || 'Total Distributed'}
            </span>
            <span className="text-sm font-extrabold text-theme-text font-mono">
              {totalValue}
            </span>
          </div>
        ) : (
          <span className="text-xs font-mono font-bold text-theme-primary bg-theme-soft-mint px-2.5 py-1 rounded-lg border border-theme-border">
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
                <span className="font-bold text-theme-text flex items-center space-x-1.5 rtl:space-x-reverse">
                  <span className="w-2 h-2 rounded-full bg-theme-secondary" />
                  <span>{item.label}</span>
                  {item.secondaryText && (
                    <span className="text-[11px] text-theme-secondary font-normal">
                      ({item.secondaryText})
                    </span>
                  )}
                </span>
                <div className="flex items-center space-x-2 rtl:space-x-reverse font-mono">
                  <span className="font-extrabold text-theme-text">
                    {item.value.toLocaleString()} {unit}
                  </span>
                  <span className="text-[11px] text-theme-primary bg-theme-soft-mint px-1.5 py-0.5 rounded font-semibold border border-theme-border">
                    {shareOfTotal}%
                  </span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="w-full bg-theme-bg rounded-full h-3 overflow-hidden p-0.5 border border-theme-border">
                <div
                  style={{ width: `${percentage}%` }}
                  className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-500 shadow-2xs`}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-4 mt-2 border-t border-theme-border/60 text-[11px] text-theme-secondary">
        <span>Verified Inventory Allocation</span>
        <span className="font-semibold text-theme-primary">100% Traceable</span>
      </div>
    </div>
  );
};
