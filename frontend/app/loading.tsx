'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-slate-900 font-sans">
      <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center mb-4 shadow-sm">
        <RefreshCw className="w-7 h-7 text-purple-600 animate-spin" />
      </div>
      <h3 className="text-base font-extrabold text-slate-900 tracking-tight">SafaiPay</h3>
      <p className="text-xs text-slate-500 mt-1">Loading secure portal interface...</p>
    </div>
  );
}
