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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl border border-rose-100 p-8 shadow-xl text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Something went wrong</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          {error?.message || 'An unexpected error occurred while loading this SafaiPay screen.'}
        </p>
        <button
          onClick={() => reset()}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-3 px-4 rounded-xl text-xs transition shadow-md shadow-purple-600/25 flex items-center justify-center space-x-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Try again</span>
        </button>
      </div>
    </div>
  );
}
