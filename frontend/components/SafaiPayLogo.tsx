'use client';

import React from 'react';

interface SafaiPayLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  className?: string;
  isDark?: boolean;
}

export const SafaiPayLogoIcon: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg
    viewBox="-50 -50 100 100"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} shrink-0`}
    aria-label="SafaiPay Logo"
  >
    <rect x="-45" y="-45" width="90" height="90" rx="20" fill="#1B7F5C" />
    <path
      d="M-22.55 -8.2 A24 24 0 0 1 22.55 -8.2"
      fill="none"
      stroke="#fff"
      strokeWidth="5"
      strokeLinecap="round"
    />
    <polygon
      points="24.9,-1.6 27.2,-9.9 17.85,-6.5"
      fill="#fff"
      stroke="#fff"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M22.55 8.2 A24 24 0 0 1 -22.55 8.2"
      fill="none"
      stroke="#fff"
      strokeWidth="5"
      strokeLinecap="round"
    />
    <polygon
      points="-24.9,1.6 -27.2,9.9 -17.85,6.5"
      fill="#fff"
      stroke="#fff"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <circle cx="34" cy="-34" r="8" fill="#F2A900" stroke="#fff" strokeWidth="2.5" />
  </svg>
);

export const SafaiPayLogo: React.FC<SafaiPayLogoProps> = ({
  size = 'md',
  showWordmark = true,
  className = '',
  isDark = false,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div className={`inline-flex items-center space-x-2.5 select-none ${className}`}>
      <SafaiPayLogoIcon className={iconSizes[size]} />
      {showWordmark && (
        <span className={`font-extrabold tracking-tight ${textSizes[size]}`}>
          <span className={isDark ? 'text-white' : 'text-[#0F3D3E]'}>Safai</span>
          <span className="text-[#1B7F5C]">Pay</span>
          <span className="text-[#F2A900] font-black">.</span>
        </span>
      )}
    </div>
  );
};
