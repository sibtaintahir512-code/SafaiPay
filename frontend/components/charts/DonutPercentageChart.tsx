'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';

export interface DonutSegment {
  label: string;
  percentage: number;
  value?: string | number;
  color: string;
  textColor?: string;
}

interface DonutPercentageChartProps {
  title: string;
  subtitle?: string;
  segments: DonutSegment[];
  centerLabel?: string;
  centerValue?: string;
}

export const DonutPercentageChart: React.FC<DonutPercentageChartProps> = ({
  title,
  subtitle,
  segments,
  centerLabel = 'Total Share',
  centerValue = '100%',
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  if (!segments || segments.length === 0) return null;

  // SVG parameters
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate segment stroke dashes
  let accumulatedPercent = 0;
  const calculatedSegments = segments.map((seg) => {
    const strokeDasharray = `${(seg.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += seg.percentage;
    return {
      ...seg,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="bg-theme-surface rounded-2xl border border-theme-border p-5 shadow-xs transition-colors hover:shadow-md">
      <div className="mb-4 pb-3 border-b border-theme-border/60">
        <h3 className="text-sm font-bold text-theme-text tracking-tight flex items-center space-x-2 rtl:space-x-reverse">
          <span className="w-2.5 h-2.5 rounded-full bg-theme-primary" />
          <span>{title}</span>
        </h3>
        {subtitle && <p className="text-xs text-theme-secondary mt-0.5">{subtitle}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
        {/* SVG Donut Circle */}
        <div className="sm:col-span-6 flex justify-center py-2">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg
              viewBox={`0 0 ${size} ${size}`}
              className="w-full h-full -rotate-90 transform"
            >
              {/* Background Track */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={isDark ? '#173F3C' : '#E1F4EB'}
                strokeWidth={strokeWidth}
              />

              {/* Segments */}
              {calculatedSegments.map((seg, i) => (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-700 hover:opacity-85 cursor-pointer"
                />
              ))}
            </svg>

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-lg font-extrabold text-theme-text font-mono tracking-tight">
                {centerValue}
              </span>
              <span className="text-[10px] uppercase font-bold text-theme-secondary tracking-wider">
                {centerLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Legend with Numerical Values and Percentages */}
        <div className="sm:col-span-6 space-y-2.5">
          {segments.map((seg, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2 rounded-xl bg-theme-bg border border-theme-border hover:bg-theme-soft-mint transition"
            >
              <div className="flex items-center space-x-2.5 rtl:space-x-reverse min-w-0">
                <span
                  style={{ backgroundColor: seg.color }}
                  className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                />
                <span className="text-xs font-bold text-theme-text truncate">
                  {seg.label}
                </span>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse font-mono text-xs">
                {seg.value && (
                  <span className="text-theme-secondary text-[11px] font-medium">
                    {seg.value}
                  </span>
                )}
                <span
                  style={{ color: seg.textColor || seg.color }}
                  className="font-extrabold bg-theme-surface px-2 py-0.5 rounded-md border border-theme-border shadow-2xs"
                >
                  {seg.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 mt-3 border-t border-theme-border/60 text-[11px] text-theme-secondary">
        <span>Verified Batch Sampling</span>
        <span className="font-semibold text-theme-primary">Audit Grade: ISO-14001</span>
      </div>
    </div>
  );
};
