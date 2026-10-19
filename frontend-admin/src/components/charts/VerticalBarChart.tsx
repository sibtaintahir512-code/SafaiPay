'use client';

import React from 'react';

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
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 10);

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

        {totalValue && (
          <div className="bg-[#E6F4EC] border border-[#D5E6DD] rounded-xl px-3 py-1.5 text-left sm:text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#146B4D] block">
              {totalLabel || 'Cumulative Volume'}
            </span>
            <span className="text-sm font-extrabold text-[#0F3D3E] font-mono">
              {totalValue}
            </span>
          </div>
        )}
      </div>

      {/* Bar Chart Canvas */}
      <div className="pt-6 pb-2">
        <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 px-2 sm:px-4 border-b border-[#D5E6DD]">
          {data.map((item, idx) => {
            const heightPercent = Math.max((item.value / maxValue) * 100, 8);
            const isHighest = item.value === maxValue;

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center justify-end h-full group relative"
              >
                {/* Value on top of bar */}
                <div className="text-[11px] font-bold font-mono text-[#0F3D3E] mb-1.5 transition-transform group-hover:-translate-y-1">
                  {prefix}{item.value}{unit ? ` ${unit}` : ''}
                </div>

                {/* The Bar */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full max-w-[48px] rounded-t-xl transition-all duration-300 relative ${
                    isHighest
                      ? 'bg-gradient-to-t from-[#146B4D] to-[#1B7F5C] shadow-md shadow-[#1B7F5C]/20'
                      : 'bg-[#E6F4EC] hover:bg-[#D5E6DD]'
                  }`}
                >
                  {isHighest && (
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-[#2FA37A] text-white text-[9px] font-bold uppercase tracking-wider whitespace-nowrap shadow-xs">
                      Peak
                    </span>
                  )}
                </div>

                {/* X-axis label */}
                <span className="text-xs font-semibold text-[#3F5A52] mt-2.5 truncate max-w-full">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[#D5E6DD]/60 text-[11px] text-[#5B6B66] mt-2">
        <span className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded bg-[#1B7F5C] inline-block" />
          <span>Post-consumer collection streams</span>
        </span>
        <span className="font-mono text-[#146B4D] font-semibold">
          Average: {prefix}{Math.round(data.reduce((a, b) => a + b.value, 0) / data.length)}{unit ? ` ${unit}` : ''}
        </span>
      </div>
    </div>
  );
};
