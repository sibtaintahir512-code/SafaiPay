'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('SafaiPay App Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-theme-bg flex items-center justify-center p-6 text-theme-text font-sans transition-colors duration-200">
      <div className="max-w-md w-full bg-theme-surface rounded-3xl border border-theme-border p-8 shadow-xl text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-theme-error flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-extrabold text-theme-text">Something went wrong</h2>
        <p className="text-xs text-theme-secondary leading-relaxed">
          {error?.message || 'An unexpected error occurred while loading this SafaiPay screen.'}
        </p>
        <button
          onClick={() => reset()}
          className="w-full bg-theme-primary hover:opacity-95 text-white font-extrabold py-3.5 px-4 rounded-xl text-xs transition shadow-md shadow-theme-primary/25 flex items-center justify-center space-x-2 min-h-[44px]"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Try again</span>
        </button>
      </div>
    </div>
  );
}
