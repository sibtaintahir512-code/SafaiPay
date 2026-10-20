'use client';

import React from 'react';
import Image from 'next/image';

interface SafaiPayLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  className?: string;
  isDark?: boolean;
}

export const SafaiPayLogoIcon: React.FC<{
  className?: string;
  isDark?: boolean;
  size?: number;
}> = ({ className = 'w-10 h-10', isDark = false, size }) => {
  // If size is provided in px, enforce minimum 14px clear dimension
  const px = size ? Math.max(14, size) : undefined;
  const style = px ? { width: `${px}px`, height: `${px}px` } : undefined;
  const markSrc = isDark ? '/logo/safaipay-mark-small.svg' : '/logo/safaipay-mark-light.svg';

  return (
    <svg
      viewBox="-50 -50 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} shrink-0`}
      style={style}
      aria-label="SafaiPay Logo"
      role="img"
    >
      <rect
        x="-45"
        y="-45"
        width="90"
        height="90"
        rx="20"
        fill={isDark ? '#1F7A55' : '#1B7F5C'}
      />
      <path
        d="M-22.55 -8.2 A24 24 0 0 1 22.55 -8.2"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <polygon
        points="24.9,-1.6 27.2,-9.9 17.85,-6.5"
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M22.55 8.2 A24 24 0 0 1 -22.55 8.2"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <polygon
        points="-24.9,1.6 -27.2,9.9 -17.85,6.5"
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const SafaiPayLogo: React.FC<SafaiPayLogoProps> = ({
  size = 'md',
  showWordmark = true,
  className = '',
  isDark = false,
}) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8 sm:w-9 sm:h-9',
    lg: 'w-10 h-10 sm:w-12 sm:h-12',
    xl: 'w-14 h-14 sm:w-16 sm:h-16',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg sm:text-xl',
    lg: 'text-xl sm:text-2xl',
    xl: 'text-2xl sm:text-3xl',
  };

  return (
    <div className={`inline-flex items-center space-x-2.5 select-none ${className}`}>
      <SafaiPayLogoIcon className={iconSizes[size]} isDark={isDark} />
      {showWordmark && (
        <span
          className={`font-extrabold tracking-[-0.02em] font-sans ${textSizes[size]} leading-none`}
        >
          <span className={isDark ? 'text-[#E8F3EE]' : 'text-[#12302A]'}>Safai</span>
          <span style={{ color: isDark ? '#9FE6C6' : '#1B7F5C' }}>Pay</span>
        </span>
      )}
    </div>
  );
};
