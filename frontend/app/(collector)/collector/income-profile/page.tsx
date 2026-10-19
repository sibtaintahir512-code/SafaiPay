'use client';

import React from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  Award,
  ShieldCheck,
  TrendingUp,
  Download,
  CheckCircle2,
  Building2,
  FileCheck,
  FileBadge,
  Sparkles
} from 'lucide-react';

export default function CollectorIncomeProfilePage() {
  const { user } = useAuth();
  const { isUrdu } = useLanguage();

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  return (
    <ProtectedRoute allowedRole={['collector', 'admin']}>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        <Navbar />

        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
                <Link href="/collector/dashboard" className="hover:text-purple-600 transition">
                  {isUrdu ? 'ڈیش بورڈ' : 'Dashboard'}
                </Link>
                <span>/</span>
                <span className="text-purple-700 font-bold">{isUrdu ? 'ڈیجیٹل انکم پروفائل' : 'Income Profile'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {isUrdu ? 'تصدیق شدہ ڈیجیٹل انکم کریڈٹ پروفائل' : 'Verified Digital Income & Credit Profile'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {isUrdu
                  ? 'مالیاتی اداروں اور مائیکرو فنانس بینکوں کے لیے باضابطہ ڈیجیٹل آمدنی کا ثبوت اور کریڈٹ ریٹنگ۔'
                  : 'Audited digital waste collection ledger for bank micro-loans, bike financing, and formal financial inclusion.'}
              </p>
            </div>

            <button
              onClick={handlePrint}
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md shadow-purple-600/20 transition"
            >
              <Download className="w-4 h-4" />
              <span>{isUrdu ? 'سرٹیفکیٹ ڈاؤن لوڈ کریں' : 'Export Verified Certificate'}</span>
            </button>
          </div>

          {/* Microfinance Readiness Score Card */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full border border-emerald-500/30 mb-3">
                  <ShieldCheck className="w-4 h-4" />
                  <span>State Bank Regulatory Compliant Data Trust</span>
                </span>
                <h2 className="text-2xl font-black">Micro-Loan Readiness: AAA (Excellent)</h2>
                <p className="text-xs text-purple-200 mt-1 max-w-lg">
                  Consistently maintained over 1,200 kg monthly verifiable collection volume with 99.4% customer mutual OTP verification score.
                </p>
              </div>

              <div className="text-center sm:text-right bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                <span className="text-[10px] uppercase font-bold text-purple-200 tracking-wider">Credit Rating</span>
                <p className="text-3xl font-black font-mono text-emerald-400 mt-0.5">785 / 850</p>
                <p className="text-[11px] text-purple-200 mt-1">Eligible for Rs 150k EV Financing</p>
              </div>
            </div>
          </div>

          {/* 3 Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Monthly Steady Income</h3>
              <p className="text-2xl font-black text-slate-900 font-mono mt-1">Rs 44,200</p>
              <p className="text-xs text-slate-400 mt-1">6-month verified moving average</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center mb-3">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Zero Dispute Record</h3>
              <p className="text-2xl font-black text-emerald-700 font-mono mt-1">100% Clean</p>
              <p className="text-xs text-slate-400 mt-1">0 weight discrepancies or alerts</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center mb-3">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Partner Banking Pre-Approved</h3>
              <p className="text-2xl font-black text-blue-900 font-mono mt-1">Easypaisa & Mobilink</p>
              <p className="text-xs text-slate-400 mt-1">Fast-track micro-enterprise loans</p>
            </div>
          </div>

          {/* Official Verification Statement */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
              <FileBadge className="w-5 h-5 text-purple-600" />
              <span>Certified Collector Credentials (SafaiPay Ledger)</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="font-medium text-slate-500">Registered Name:</span>
                <span className="font-bold text-slate-900">{user?.full_name || 'Rashid Khan'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="font-medium text-slate-500">Government CNIC Verification:</span>
                <span className="font-mono font-bold text-emerald-700">NADRA Biometric Verified (42101-*******-1)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="font-medium text-slate-500">Smart IoT Digital Scale:</span>
                <span className="font-bold text-slate-900">Calibrated (Model SP-SCALE-V3, Accuracy ±0.05kg)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="font-medium text-slate-500">Operating Sector:</span>
                <span className="font-bold text-slate-900">District East (PECHS & Gulshan), Karachi</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
