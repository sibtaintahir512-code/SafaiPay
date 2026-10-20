'use client';

import React, { useState, useId } from 'react';
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
  const rawId = useId();
  const gradientId = `trendGradient-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values, 10);
  const minValue = 0;
  const range = maxValue - minValue || 1;

  // Chart dimensions with safe vertical padding for value tags
  const width = 640;
  const height = 260;
  const paddingX = 48;
  const paddingTop = 42;
  const paddingBottom = 44;

  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingTop - paddingBottom;

  // Calculate coordinates
  const points = data.map((d, index) => {
    const x = paddingX + (index / (data.length - 1)) * usableWidth;
    const y = paddingTop + usableHeight - ((d.value - minValue) / range) * usableHeight;
    return { x, y, ...d };
  });

  // Smooth bezier curve generator
  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cpX1 = prev.x + (p.x - prev.x) / 2;
    const cpY1 = prev.y;
    const cpX2 = prev.x + (p.x - prev.x) / 2;
    const cpY2 = p.y;
    return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y}`;
  }, '');

  // Complete closed area for subtle gradient fill
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

  const primaryStroke = isDark ? '#35B889' : '#16865F';
  const primaryLight = isDark ? '#65D7AE' : '#2FA37A';
  const gridStroke = isDark ? '#1F4743' : '#E1F4EB';
  const labelColor = isDark ? '#A9C2B9' : '#6B817C';
  const pointTextColor = isDark ? '#F4FAF7' : '#0B3D3B';

  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className="bg-theme-surface rounded-2xl border border-theme-border p-5 shadow-xs transition-colors hover:shadow-md">
      {/* Header with Title and Optional Peak Tag */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-theme-border/60">
        <div>
          <h3 className="text-sm font-bold text-theme-text tracking-tight flex items-center space-x-2 rtl:space-x-reverse">
            <span className="w-2.5 h-2.5 rounded-full bg-theme-primary" />
            <span>{title}</span>
          </h3>
          {subtitle && <p className="text-xs text-theme-secondary mt-0.5">{subtitle}</p>}
        </div>

        {highlightValue && (
          <div className="text-left sm:text-right rtl:sm:text-left bg-theme-soft-mint border border-theme-border rounded-xl px-3 py-1.5 transition-colors">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-primary block">
              {highlightLabel || 'Peak Month'}
            </span>
            <span className="text-sm font-extrabold text-theme-text font-mono">
              {highlightValue}
            </span>
          </div>
        )}
      </div>

      {/* SVG Chart Canvas */}
      <div className="w-full overflow-x-auto relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[340px] max-h-[270px] overflow-visible select-none"
        >
          <defs>
            {/* Valid SVG linear gradient with smooth multi-stop opacity */}
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primaryStroke} stopOpacity={isDark ? 0.38 : 0.25} />
              <stop offset="50%" stopColor={primaryStroke} stopOpacity={isDark ? 0.14 : 0.08} />
              <stop offset="100%" stopColor={primaryStroke} stopOpacity={0.0} />
            </linearGradient>

            <filter id={`glow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={primaryStroke} floodOpacity={isDark ? 0.4 : 0.25} />
            </filter>
          </defs>

          {/* Horizontal grid lines & Y-axis labels */}
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
                  x={paddingX - 12}
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

          {/* Filled Area with Valid Gradient Reference */}
          <path
            d={areaD}
            fill={`url(#${gradientId})`}
            className="transition-all duration-300 pointer-events-none"
          />

          {/* Background Ambient Glow Stroke */}
          <path
            d={pathD}
            fill="none"
            stroke={primaryStroke}
            strokeWidth="5"
            strokeOpacity={isDark ? 0.2 : 0.12}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Crisp Primary Line */}
          <path
            d={pathD}
            fill="none"
            stroke={primaryStroke}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover Guideline if active */}
          {hoveredPoint && (
            <line
              x1={hoveredPoint.x}
              y1={paddingTop}
              x2={hoveredPoint.x}
              y2={height - paddingBottom}
              stroke={primaryLight}
              strokeWidth="1.5"
              strokeDasharray="3 3"
              opacity="0.75"
              className="pointer-events-none"
            />
          )}

          {/* Data Points, Interactive Zones and Value Labels */}
          {points.map((p, i) => {
            const isHovered = hoveredIndex === i;
            const isPeak = p.value === maxValue;

            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setHoveredIndex(hoveredIndex === i ? null : i)}
              >
                {/* Invisible larger hit target for smooth mobile touch and cursor interactions */}
                <circle cx={p.x} cy={p.y} r="22" fill="transparent" />

                {/* Animated Outer Ring when hovered */}
                {isHovered && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="11"
                    fill={primaryStroke}
                    fillOpacity={0.2}
                    className="animate-ping"
                  />
                )}

                {/* Outer halo circle */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 7.5 : 6}
                  fill={isDark ? '#0D3030' : '#FFFFFF'}
                  stroke={isHovered ? primaryLight : primaryStroke}
                  strokeWidth={isHovered ? '3' : '2.5'}
                  filter={isPeak ? `url(#glow-${gradientId})` : undefined}
                  className="transition-all duration-150"
                />

                {/* Center dot */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 3.5 : 2.5}
                  fill={isHovered ? primaryLight : primaryStroke}
                  className="transition-all duration-150"
                />

                {/* Value label on top of point */}
                <text
                  x={p.x}
                  y={p.y - 12}
                  textAnchor="middle"
                  fill={isHovered ? primaryLight : pointTextColor}
                  className={`text-[11px] font-mono transition-all duration-150 ${
                    isHovered || isPeak ? 'font-black' : 'font-bold'
                  }`}
                >
                  {prefix}{p.value}{unit ? ` ${unit}` : ''}
                </text>

                {/* Month / Period label at bottom axis */}
                <text
                  x={p.x}
                  y={height - paddingBottom + 20}
                  textAnchor="middle"
                  fill={isHovered ? primaryLight : labelColor}
                  className={`text-[11px] transition-colors duration-150 ${
                    isHovered ? 'font-bold' : 'font-medium'
                  }`}
                >
                  {p.label}
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
          <span>Verified Weight Logs</span>
        </span>
        <span className="font-mono text-theme-primary font-semibold">
          High: {prefix}{maxValue}{unit ? ` ${unit}` : ''}
        </span>
      </div>
    </div>
  );
};
