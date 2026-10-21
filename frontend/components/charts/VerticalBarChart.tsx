'use client';

import React, { useState, useId } from 'react';
import { useTheme } from '@/context/ThemeContext';
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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const rawId = useId();
  const chartId = `vbar-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Graceful empty state
  if (!data || data.length === 0) {
    return (
      <div className="bg-theme-surface rounded-2xl border border-theme-border p-6 shadow-xs flex flex-col items-center justify-center min-h-[260px] text-center transition-colors">
        <div className="w-12 h-12 rounded-2xl bg-theme-soft-mint text-theme-primary flex items-center justify-center mb-3">
          <BarChart2 className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-theme-text">{title}</h3>
        {subtitle && <p className="text-xs text-theme-secondary mt-1">{subtitle}</p>}
        <p className="text-xs text-theme-secondary/80 mt-2 max-w-xs">
          No volume statistics recorded yet. Historical trends will populate automatically.
        </p>
      </div>
    );
  }

  const rawMax = Math.max(...data.map((d) => d.value));
  // Safe ceiling calculation for clean Y-axis ticks
  const maxValue = rawMax > 0 ? (rawMax > 1000 ? Math.ceil(rawMax / 200) * 200 : Math.ceil(rawMax / 10) * 10) : 100;
  const minValue = 0;
  const range = maxValue - minValue;

  // Exact responsive SVG canvas dimensions with collision-proof vertical clearance
  const width = 640;
  const height = 260;
  const paddingLeft = 60;
  const paddingRight = 24;
  const paddingTop = 48;
  const paddingBottom = 44;

  const usableWidth = width - paddingLeft - paddingRight;
  const usableHeight = height - paddingTop - paddingBottom; // 168px
  const maxBarHeight = usableHeight - 34; // 134px, reserving 34px strictly for labels

  // Primary palette tokens
  const primaryStroke = isDark ? '#35B889' : '#16865F';
  const primaryLight = isDark ? '#65D7AE' : '#2FA37A';
  const barSurfaceBg = isDark ? '#143C38' : '#D6EDE2';
  const barSurfaceHover = isDark ? '#1B4F4A' : '#C1E6D4';
  const gridStroke = isDark ? '#1F4743' : '#E1F4EB';
  const labelColor = isDark ? '#A9C2B9' : '#6B817C';
  const pointTextColor = isDark ? '#F4FAF7' : '#0B3D3B';

  const barCount = data.length;
  const slotWidth = usableWidth / Math.max(barCount, 1);
  const barWidth = Math.min(Math.max(slotWidth * 0.44, 28), 44);

  return (
    <div className="bg-theme-surface rounded-2xl border border-theme-border p-5 shadow-xs transition-colors hover:shadow-md">
      {/* Header with Title and Optional Metric Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-theme-border/60">
        <div>
          <h3 className="text-sm font-bold text-theme-text tracking-tight flex items-center space-x-2 rtl:space-x-reverse">
            <span className="w-2.5 h-2.5 rounded-full bg-theme-primary" />
            <span>{title}</span>
          </h3>
          {subtitle && <p className="text-xs text-theme-secondary mt-0.5">{subtitle}</p>}
        </div>

        {totalValue && (
          <div className="bg-theme-soft-mint border border-theme-border rounded-xl px-3 py-1.5 text-left sm:text-right rtl:sm:text-left transition-colors">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-primary block">
              {totalLabel || 'Cumulative Total'}
            </span>
            <span className="text-sm font-extrabold text-theme-text font-mono">
              {totalValue}
            </span>
          </div>
        )}
      </div>

      {/* SVG Responsive Bar Canvas */}
      <div className="w-full overflow-x-auto relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[340px] max-h-[270px] overflow-visible select-none"
        >
          <defs>
            <linearGradient id={`grad-active-${chartId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primaryLight} stopOpacity="1" />
              <stop offset="100%" stopColor={primaryStroke} stopOpacity="1" />
            </linearGradient>

            <linearGradient id={`grad-default-${chartId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={barSurfaceHover} stopOpacity="1" />
              <stop offset="100%" stopColor={barSurfaceBg} stopOpacity="1" />
            </linearGradient>

            <filter id={`shadow-${chartId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={primaryStroke} floodOpacity={isDark ? 0.4 : 0.25} />
            </filter>
          </defs>

          {/* Horizontal gridlines and Y-axis scale */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = height - paddingBottom - usableHeight * pct;
            const val = Math.round(minValue + range * pct);

            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke={gridStroke}
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill={labelColor}
                  className="text-[10px] font-mono font-medium"
                >
                  {prefix}{val.toLocaleString()}{unit ? ` ${unit}` : ''}
                </text>
              </g>
            );
          })}

          {/* Baseline axis line */}
          <line
            x1={paddingLeft}
            y1={height - paddingBottom}
            x2={width - paddingRight}
            y2={height - paddingBottom}
            stroke={gridStroke}
            strokeWidth="1.5"
          />

          {/* Bar Columns and Overlap-Proof Labels */}
          {data.map((item, idx) => {
            const isHighest = item.value === rawMax && rawMax > 0;
            const isPeak = isHighest || Boolean(item.highlight);
            const isHovered = hoveredIdx === idx;

            const slotCenterX = paddingLeft + slotWidth * (idx + 0.5);
            const barX = slotCenterX - barWidth / 2;

            const calculatedHeight = range > 0 ? (item.value / maxValue) * maxBarHeight : 0;
            const barHeight = Math.max(calculatedHeight, 4);
            const barTopY = height - paddingBottom - barHeight;

            // Collision-proof vertical coordinates:
            // 1. Value label sits at (barTopY - 7)
            // 2. If Peak badge, sits cleanly above value label at (barTopY - 27), never colliding
            const valueLabelY = barTopY - 6;
            const badgeY = barTopY - 26;

            return (
              <g
                key={idx}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => setHoveredIdx(hoveredIdx === idx ? null : idx)}
              >
                {/* Generous touch target area */}
                <rect
                  x={slotCenterX - slotWidth / 2}
                  y={paddingTop}
                  width={slotWidth}
                  height={usableHeight + 30}
                  fill="transparent"
                />

                {/* PEAK Pill Badge: positioned with guaranteed 5px gap above value label */}
                {isPeak && (
                  <g className="transition-transform duration-150">
                    <rect
                      x={slotCenterX - 18}
                      y={badgeY - 1}
                      width={36}
                      height={16}
                      rx={4}
                      fill={primaryStroke}
                      filter={`url(#shadow-${chartId})`}
                    />
                    <text
                      x={slotCenterX}
                      y={badgeY + 11}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      className="text-[9px] font-extrabold uppercase tracking-wider select-none"
                    >
                      PEAK
                    </text>
                  </g>
                )}

                {/* Value label on top of bar */}
                <text
                  x={slotCenterX}
                  y={valueLabelY}
                  textAnchor="middle"
                  fill={isHovered ? primaryLight : pointTextColor}
                  className={`text-[11px] font-mono select-none transition-all duration-150 ${
                    isHovered || isPeak ? 'font-black' : 'font-bold'
                  }`}
                >
                  {prefix}{item.value.toLocaleString()}{unit ? ` ${unit}` : ''}
                </text>

                {/* The Bar */}
                <rect
                  x={barX}
                  y={barTopY}
                  width={barWidth}
                  height={barHeight}
                  rx={6}
                  fill={isPeak ? `url(#grad-active-${chartId})` : isHovered ? barSurfaceHover : `url(#grad-default-${chartId})`}
                  stroke={isHovered ? primaryLight : isPeak ? primaryStroke : 'transparent'}
                  strokeWidth={isHovered ? '2' : isPeak ? '1.5' : '0'}
                  filter={isPeak ? `url(#shadow-${chartId})` : undefined}
                  className="transition-all duration-200"
                />

                {/* X-axis Category Label */}
                <text
                  x={slotCenterX}
                  y={height - paddingBottom + 20}
                  textAnchor="middle"
                  fill={isHovered ? primaryLight : labelColor}
                  className={`text-[11px] transition-colors duration-150 select-none ${
                    isHovered ? 'font-bold' : 'font-medium'
                  }`}
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Footer Info & Benchmark Metric */}
      <div className="flex items-center justify-between pt-3 border-t border-theme-border/60 text-[11px] text-theme-secondary mt-1">
        <span className="flex items-center space-x-1.5 rtl:space-x-reverse">
          <span className="w-2.5 h-1 rounded-full bg-theme-primary inline-block" />
          <span>Post-consumer collection streams</span>
        </span>
        <span className="font-mono text-theme-primary font-semibold">
          Average: {prefix}{Math.round(data.reduce((a, b) => a + b.value, 0) / Math.max(data.length, 1)).toLocaleString()}{unit ? ` ${unit}` : ''}
        </span>
      </div>
    </div>
  );
};
