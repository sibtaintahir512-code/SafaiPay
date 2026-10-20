'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';

export interface LineDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

interface LineTrendChartProps {
  title: string;
  subtitle?: string;
  data: LineDataPoint[];
  unit?: string;
  prefix?: string;
  highlightLabel?: string;
  highlightValue?: string;
}

export const LineTrendChart: React.FC<LineTrendChartProps> = ({
  title,
  subtitle,
  data,
  unit = '',
  prefix = '',
  highlightLabel,
  highlightValue,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  if (!data || data.length === 0) return null;

  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values, 10);
  const minValue = 0;
  const range = maxValue - minValue || 1;

  // Chart dimensions
  const width = 640;
  const height = 240;
  const paddingX = 48;
  const paddingTop = 32;
  const paddingBottom = 40;

  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingTop - paddingBottom;

  // Calculate coordinates
  const points = data.map((d, index) => {
    const x = paddingX + (index / (data.length - 1)) * usableWidth;
    const y = paddingTop + usableHeight - ((d.value - minValue) / range) * usableHeight;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cpX1 = prev.x + (p.x - prev.x) / 2;
    const cpY1 = prev.y;
    const cpX2 = prev.x + (p.x - prev.x) / 2;
    const cpY2 = p.y;
    return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

  const primaryStroke = isDark ? '#35B889' : '#16865F';
  const gridStroke = isDark ? '#24514D' : '#E1F4EB';
  const labelColor = isDark ? '#A9C2B9' : '#6B817C';
  const pointTextColor = isDark ? '#F4FAF7' : '#0B3D3B';

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

        {highlightValue && (
          <div className="text-left sm:text-right rtl:sm:text-left bg-theme-soft-mint border border-theme-border rounded-xl px-3 py-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-primary block">
              {highlightLabel || 'Current Peak'}
            </span>
            <span className="text-sm font-extrabold text-theme-text font-mono">
              {highlightValue}
            </span>
          </div>
        )}
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[340px] max-h-[260px] overflow-visible"
        >
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primaryStroke} stopOpacity={isDark ? 0.35 : 0.22} />
              <stop offset="100%" stopColor={primaryStroke} stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = paddingTop + usableHeight * (1 - pct);
            const val = Math.round(minValue + range * pct);
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke={gridStroke}
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill={labelColor}
                  className="text-[10px] font-mono font-medium"
                >
                  {prefix}{val}{unit ? ` ${unit}` : ''}
                </text>
              </g>
            );
          })}

          {/* Filled Area */}
          <path d={areaD} fill="url(--trendGradient, url(#trendGradient))" />

          {/* Trend Line */}
          <path
            d={pathD}
            fill="none"
            stroke={primaryStroke}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points and Value Tags */}
          {points.map((p, i) => (
            <g key={i} className="group cursor-pointer">
              {/* Outer halo */}
              <circle
                cx={p.x}
                cy={p.y}
                r="6"
                fill={isDark ? '#0D3030' : '#FFFFFF'}
                stroke={primaryStroke}
                strokeWidth="2.5"
                className="transition-transform group-hover:scale-125"
              />
              {/* Center dot */}
              <circle cx={p.x} cy={p.y} r="2.5" fill={primaryStroke} />

              {/* Value label on top of point */}
              <text
                x={p.x}
                y={p.y - 12}
                textAnchor="middle"
                fill={pointTextColor}
                className="text-[11px] font-bold font-mono"
              >
                {prefix}{p.value}{unit ? ` ${unit}` : ''}
              </text>

              {/* Month / Day label at bottom axis */}
              <text
                x={p.x}
                y={height - paddingBottom + 20}
                textAnchor="middle"
                fill={labelColor}
                className="text-[11px] font-medium"
              >
                {p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-theme-border/60 text-[11px] text-theme-secondary">
        <span className="flex items-center space-x-1.5 rtl:space-x-reverse">
          <span className="w-2.5 h-1 rounded-full bg-theme-primary inline-block" />
          <span>Verified Weight Logs</span>
        </span>
        <span className="font-mono text-theme-primary font-semibold">
          High: {prefix}{maxValue}{unit ? ` ${unit}` : ''}
        </span>
      </div>
    </div>
  );
};
