import Link from 'next/link';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl border border-purple-100 p-8 shadow-xl text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center mx-auto">
          <HelpCircle className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">404 - Page Not Found</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          The requested SafaiPay portal page does not exist or may have been relocated.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-3 px-6 rounded-xl text-xs transition shadow-md shadow-purple-600/25 w-full"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Login</span>
        </Link>
      </div>
    </div>
  );
}
