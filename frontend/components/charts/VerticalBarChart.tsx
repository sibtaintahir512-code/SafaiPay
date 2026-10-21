'use client';

import React from 'react';
import { BarChart2 } from 'lucide-react';

export interface BarDataPoint {
  label: string;
  value: number;
  highlight?: boolean;
}

interface VerticalBarChartProps {
  title: string;
  subtitle?: string;
  data: BarDataPoint[];
  unit?: string;
  prefix?: string;
  totalLabel?: string;
  totalValue?: string;
}

export const VerticalBarChart: React.FC<VerticalBarChartProps> = ({
  title,
  subtitle,
  data,
  unit = '',
  prefix = '',
  totalLabel,
  totalValue,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-theme-surface rounded-2xl border border-theme-border p-6 shadow-xs flex flex-col items-center justify-center min-h-[220px] text-center transition-colors">
        <div className="w-12 h-12 rounded-2xl bg-theme-soft-mint text-theme-primary flex items-center justify-center mb-3">
          <BarChart2 className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-theme-text">{title}</h3>
        {subtitle && <p className="text-xs text-theme-secondary mt-1">{subtitle}</p>}
        <p className="text-xs text-theme-secondary/80 mt-2 max-w-xs">
          No volume statistics recorded yet.
        </p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 10);

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

        {totalValue && (
          <div className="bg-theme-soft-mint border border-theme-border rounded-xl px-3 py-1.5 text-left sm:text-right rtl:sm:text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-primary block">
              {totalLabel || 'Cumulative Volume'}
            </span>
            <span className="text-sm font-extrabold text-theme-text font-mono">
              {totalValue}
            </span>
          </div>
        )}
      </div>

      {/* Bar Chart Canvas */}
      <div className="pt-6 pb-2">
        <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 px-2 sm:px-4 border-b border-theme-border">
          {data.map((item, idx) => {
            const heightPercent = Math.max((item.value / maxValue) * 100, 8);
            const isHighest = item.value === maxValue;

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center justify-end h-full group relative"
              >
                {/* Value on top of bar */}
                <div className="text-[11px] font-bold font-mono text-theme-text mb-1.5 transition-transform group-hover:-translate-y-1">
                  {prefix}{item.value}{unit ? ` ${unit}` : ''}
                </div>

                {/* The Bar */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full max-w-[48px] rounded-t-xl transition-all duration-300 relative ${
                    isHighest
                      ? 'bg-gradient-to-t from-theme-primary to-theme-bright-green shadow-md shadow-theme-primary/20'
                      : 'bg-theme-soft-mint hover:bg-theme-border'
                  }`}
                >
                  {isHighest && (
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-theme-primary text-white text-[9px] font-bold uppercase tracking-wider whitespace-nowrap shadow-xs">
                      Peak
                    </span>
                  )}
                </div>

                {/* X-axis label */}
                <span className="text-xs font-semibold text-theme-secondary mt-2.5 truncate max-w-full">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-theme-border/60 text-[11px] text-theme-secondary mt-2">
        <span className="flex items-center space-x-2 rtl:space-x-reverse">
          <span className="w-2.5 h-2.5 rounded bg-theme-primary inline-block" />
          <span>Post-consumer collection streams</span>
        </span>
        <span className="font-mono text-theme-primary font-semibold">
          Average: {prefix}{Math.round(data.reduce((a, b) => a + b.value, 0) / data.length)}{unit ? ` ${unit}` : ''}
        </span>
      </div>
    </div>
  );
};
