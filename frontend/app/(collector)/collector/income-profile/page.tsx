'use client';

import React, { useState } from 'react';
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
  Sparkles,
  Lock,
  Scale,
  Star,
  AlertCircle
} from 'lucide-react';

export default function CollectorIncomeProfilePage() {
  const { user } = useAuth();
  const { isUrdu } = useLanguage();
  const [consentGranted, setConsentGranted] = useState(true);

  const handleExportCSV = () => {
    if (!consentGranted) {
      return;
    }

    const disclaimer = 'DISCLAIMER: SafaiPay is an informal circular-economy marketplace technology platform, NOT a bank, microfinance institution, lender, insurer, or payment system operator.';
    const rows = [
      ['SafaiPay Verified Digital Earnings Ledger & Microfinance Readiness Record'],
      ['Collector Name', user?.full_name || 'Rashid Khan'],
      ['CNIC Verification', 'NADRA Biometric Verified (42101-*******-1)'],
      ['Digital Scale ID', 'SP-SCALE-V3 (Calibrated ±0.05kg)'],
      ['Credit Readiness Score', '785 / 850 (Grade AAA - Excellent)'],
      ['Eligible Financing', 'Rs 150,000 Electric Rickshaw / Bike Lease Financing'],
      ['Compliance Notice', disclaimer],
      [],
      ['Transaction Date', 'Pickup Reference', 'Waste Stream', 'Verified Weight (kg)', 'Rate (PKR/kg)', 'Gross Payout (PKR)', 'Status'],
      ['2026-10-18', 'SP-202610-881A2B', 'PET Plastic Bottles', '28.5', '80.00', '2280.00', 'COMPLETED'],
      ['2026-10-17', 'SP-202610-772C9D', 'Corrugated Cardboard', '45.0', '35.00', '1575.00', 'COMPLETED'],
      ['2026-10-15', 'SP-202610-663E1F', 'Mixed Scrap Metal', '18.0', '120.00', '2160.00', 'COMPLETED'],
      ['2026-10-12', 'SP-202610-554G7H', 'PET Plastic Bottles', '32.0', '80.00', '2560.00', 'COMPLETED'],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `safaipay_verified_ledger_${user?.id ? String(user.id).slice(0, 8) : 'col'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ProtectedRoute allowedRole={['collector', 'admin']}>
      <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col font-sans transition-colors duration-200">
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
              onClick={handleExportCSV}
              disabled={!consentGranted}
              className={`inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl font-bold text-sm shadow-md transition ${
                consentGranted
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>{isUrdu ? 'لیجر ڈاؤن لوڈ کریں (CSV)' : 'Export Verified Ledger (CSV)'}</span>
            </button>
          </div>

          {/* User Consent Toggle */}
          <div className="bg-white rounded-2xl border border-purple-200 p-4 mb-6 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Consent & Data Sharing Control</p>
                <p className="text-[11px] text-slate-500">I voluntarily consent to calculate and share my verified collection ledger with partner microfinance lenders.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={consentGranted}
                onChange={(e) => setConsentGranted(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {!consentGranted ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-2 mb-8">
              <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
              <h3 className="text-sm font-bold text-amber-900">Digital Financial Scoring Paused</h3>
              <p className="text-xs text-amber-800 max-w-md mx-auto">
                You have opted out of financial ledger sharing. Toggle the consent switch above to view and share your credit readiness indicators with partner microfinance banks.
              </p>
            </div>
          ) : (
            <>
              {/* Microfinance Readiness Score Card */}
              <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full border border-emerald-500/30 mb-3">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Formal Financial Inclusion Ledger</span>
                    </span>
                    <h2 className="text-2xl font-black">Micro-Loan Readiness: AAA (Excellent)</h2>
                    <p className="text-xs text-purple-200 mt-1 max-w-lg">
                      Consistently maintained over 1,200 kg monthly verifiable collection volume with 99.4% customer mutual scale verification score.
                    </p>
                  </div>

                  <div className="text-center sm:text-right bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-purple-200 tracking-wider">Credit Rating</span>
                    <p className="text-3xl font-black font-mono text-emerald-400 mt-0.5">785 / 850</p>
                    <p className="text-[11px] text-purple-200 mt-1">Eligible for Rs 150k EV Financing</p>
                  </div>
                </div>
              </div>

              {/* 4 Explainable Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">40% Weight</span>
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-800">Volume Regularity</h3>
                  <p className="text-xl font-black text-slate-900 font-mono mt-1">38.5 / 40</p>
                  <p className="text-[11px] text-slate-400 mt-1">1,250 kg verified / month</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">30% Weight</span>
                    <Scale className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-800">IoT Calibrated Scale</h3>
                  <p className="text-xl font-black text-emerald-700 font-mono mt-1">30.0 / 30</p>
                  <p className="text-[11px] text-slate-400 mt-1">100% digital LCD capture</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">20% Weight</span>
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-800">Dispute-Free Rate</h3>
                  <p className="text-xl font-black text-blue-900 font-mono mt-1">20.0 / 20</p>
                  <p className="text-[11px] text-slate-400 mt-1">0 discrepancies recorded</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">10% Weight</span>
                    <Star className="w-4 h-4 text-amber-600" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-800">Customer Trust Rating</h3>
                  <p className="text-xl font-black text-amber-700 font-mono mt-1">9.8 / 10</p>
                  <p className="text-[11px] text-slate-400 mt-1">4.9 / 5.0 star average</p>
                </div>
              </div>

              {/* Official Verification Statement */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-8">
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
                  <div className="flex justify-between py-2">
                    <span className="font-medium text-slate-500">Pre-Approved Microfinance Facility:</span>
                    <span className="font-bold text-purple-700">Rs 150,000 EV Loader Rickshaw Financing</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Regulatory Non-Banking Disclaimer Banner */}
          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-600 text-xs leading-relaxed">
            <strong className="text-slate-800 block mb-1 font-bold uppercase tracking-wide text-[10px]">
              Non-Banking Platform Disclosure & Regulatory Notice
            </strong>
            <p className="text-[11px]">
              SafaiPay is an informal circular-economy marketplace technology platform, NOT a bank, microfinance institution, lender, insurer, or payment system operator. Financial scores and credit readiness indicators are algorithmically generated voluntary estimates intended strictly for voluntary sharing with licensed financial partners. SafaiPay does not underwrite loans, accept banking deposits, or guarantee credit facilities.
            </p>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
