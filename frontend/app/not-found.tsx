import Link from 'next/link';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-theme-bg flex items-center justify-center p-6 text-theme-text font-sans transition-colors duration-200">
      <div className="max-w-md w-full bg-theme-surface rounded-3xl border border-theme-border p-8 shadow-xl text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-theme-soft-mint border border-theme-border text-theme-primary flex items-center justify-center mx-auto">
          <HelpCircle className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-extrabold text-theme-text">404 - Page Not Found</h2>
        <p className="text-xs text-theme-secondary leading-relaxed">
          The requested SafaiPay portal page does not exist or may have been relocated.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center space-x-2 bg-theme-primary hover:opacity-95 text-white font-extrabold py-3 px-6 rounded-xl text-xs transition shadow-md shadow-theme-primary/25 w-full min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Login</span>
        </Link>
      </div>
    </div>
  );
}
