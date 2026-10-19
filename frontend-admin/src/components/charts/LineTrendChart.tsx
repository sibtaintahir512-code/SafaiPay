'use client';

import React from 'react';

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

        {highlightValue && (
          <div className="text-left sm:text-right bg-[#E6F4EC] border border-[#D5E6DD] rounded-xl px-3 py-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#146B4D] block">
              {highlightLabel || 'Current Peak'}
            </span>
            <span className="text-sm font-extrabold text-[#0F3D3E] font-mono">
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
            <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1B7F5C" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#1B7F5C" stopOpacity="0.0" />
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
                  stroke="#E6F4EC"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-[#5B6B66] font-mono"
                >
                  {prefix}{val}{unit ? ` ${unit}` : ''}
                </text>
              </g>
            );
          })}

          {/* Filled Area */}
          <path d={areaD} fill="url(#emeraldGradient)" />

          {/* Trend Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#1B7F5C"
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
                fill="#ffffff"
                stroke="#1B7F5C"
                strokeWidth="2.5"
                className="transition-transform group-hover:scale-125"
              />
              {/* Center dot */}
              <circle cx={p.x} cy={p.y} r="2.5" fill="#146B4D" />

              {/* Value label on top of point */}
              <text
                x={p.x}
                y={p.y - 12}
                textAnchor="middle"
                className="text-[11px] font-bold fill-[#0F3D3E] font-mono"
              >
                {prefix}{p.value}{unit ? ` ${unit}` : ''}
              </text>

              {/* Month / Day label at bottom axis */}
              <text
                x={p.x}
                y={height - paddingBottom + 20}
                textAnchor="middle"
                className="text-[11px] font-medium fill-[#5B6B66]"
              >
                {p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[#D5E6DD]/60 text-[11px] text-[#5B6B66]">
        <span className="flex items-center space-x-1.5">
          <span className="w-2.5 h-1 rounded-full bg-[#1B7F5C] inline-block" />
          <span>Verified Weight Logs</span>
        </span>
        <span className="font-mono text-[#146B4D] font-semibold">
          High: {prefix}{maxValue}{unit ? ` ${unit}` : ''}
        </span>
      </div>
    </div>
  );
};
