'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  CreditCard,
  Scale,
  CheckCircle2,
  ArrowUpRight,
  Download,
  Award
} from 'lucide-react';

const EARNINGS_LEDGER = [
  { id: 'tx-501', date: 'Today, 11:30 AM', pickupId: 'SP-JOB-401', material: 'PET Plastic', weightKg: 18.5, commissionPkr: 555, status: 'Credited' },
  { id: 'tx-502', date: 'Today, 09:15 AM', pickupId: 'SP-JOB-398', material: 'Cardboard OCC', weightKg: 34.0, commissionPkr: 1020, status: 'Credited' },
  { id: 'tx-503', date: 'Yesterday, 04:20 PM', pickupId: 'SP-JOB-390', material: 'Mixed Metals', weightKg: 12.0, commissionPkr: 600, status: 'Credited' },
  { id: 'tx-504', date: '18 Oct 2026', pickupId: 'SP-JOB-382', material: 'Glass Bottles', weightKg: 50.0, commissionPkr: 1250, status: 'Credited' },
  { id: 'tx-505', date: '17 Oct 2026', pickupId: 'SP-JOB-375', material: 'PET Plastic', weightKg: 28.0, commissionPkr: 840, status: 'Credited' },
];

export default function CollectorEarningsPage() {
  const { user } = useAuth();
  const { isUrdu } = useLanguage();
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawn, setWithdrawn] = useState(false);

  const todayEarnings = 1575;
  const weeklyEarnings = 9480;
  const monthlyEarnings = 38400;
  const [availableBalance] = useState<number>(4265);

  const handleWithdraw = () => {
    setWithdrawing(true);
    setTimeout(() => {
      setWithdrawing(false);
      setWithdrawn(true);
      setTimeout(() => setWithdrawn(false), 3000);
    }, 1200);
  };

  return (
    <ProtectedRoute allowedRole={['collector', 'admin']}>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
                <Link href="/collector/dashboard" className="hover:text-purple-600 transition">
                  {isUrdu ? 'ڈیش بورڈ' : 'Dashboard'}
                </Link>
                <span>/</span>
                <span className="text-purple-700 font-bold">{isUrdu ? 'آمدنی' : 'Earnings'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {isUrdu ? 'کولیکٹر کمیشن اور آمدنی لیجر' : 'Collector Commission & Payout History'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {isUrdu
                  ? 'ہر مکمل شدہ آرڈر کی تصدیق شدہ وزنی کمیشن اور فوری بینک/ایزی پیسہ کیش آؤٹ۔'
                  : 'Transparent per-kg commission ledger with instant mobile wallet disbursement.'}
              </p>
            </div>

            <button
              onClick={handleWithdraw}
              disabled={withdrawing || availableBalance === 0}
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" />
              <span>{withdrawing ? 'Processing Cashout...' : (isUrdu ? 'رقم نکلوانا (کیش آؤٹ)' : 'Withdraw to EasyPaisa')}</span>
            </button>
          </div>

          {withdrawn && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Cashout request of Rs {availableBalance.toLocaleString()} sent to registered EasyPaisa wallet (+923002220001)!</span>
            </div>
          )}

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase">{isUrdu ? 'دستیاب بیلنس' : 'Withdrawable Balance'}</span>
              <p className="text-2xl font-black text-purple-700 font-mono mt-2">Rs {availableBalance.toLocaleString()}</p>
              <p className="text-[11px] text-slate-400 mt-1">Instant withdrawal available</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase">{isUrdu ? 'آج کی کمائی' : "Today's Earnings"}</span>
              <p className="text-2xl font-black text-emerald-700 font-mono mt-2">Rs {todayEarnings.toLocaleString()}</p>
              <p className="text-[11px] text-slate-400 mt-1">From 2 completed pickups</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase">{isUrdu ? 'اس ہفتے کی کمائی' : 'This Week'}</span>
              <p className="text-2xl font-black text-slate-900 font-mono mt-2">Rs {weeklyEarnings.toLocaleString()}</p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">▲ 14% higher than last week</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase">{isUrdu ? 'اس ماہ کی کمائی' : 'This Month'}</span>
              <p className="text-2xl font-black text-slate-900 font-mono mt-2">Rs {monthlyEarnings.toLocaleString()}</p>
              <p className="text-[11px] text-purple-600 font-bold mt-1">Tier-1 Certified Collector</p>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-purple-600" />
                <span>{isUrdu ? 'حالیہ ٹرانزیکشنز' : 'Recent Verified Payout Transactions'}</span>
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-5">Tx ID</th>
                    <th className="py-3.5 px-4">Date / Time</th>
                    <th className="py-3.5 px-4">Pickup ID</th>
                    <th className="py-3.5 px-4">Material</th>
                    <th className="py-3.5 px-4">Verified Weight</th>
                    <th className="py-3.5 px-4">Your Commission</th>
                    <th className="py-3.5 px-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {EARNINGS_LEDGER.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-5 font-mono font-bold text-purple-700">{tx.id}</td>
                      <td className="py-3.5 px-4 text-slate-500">{tx.date}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-900">{tx.pickupId}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{tx.material}</td>
                      <td className="py-3.5 px-4 font-mono font-bold">{tx.weightKg} kg</td>
                      <td className="py-3.5 px-4 font-mono font-black text-emerald-700">Rs {tx.commissionPkr}</td>
                      <td className="py-3.5 px-5 text-right">
                        <span className="bg-emerald-100 text-emerald-800 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
