'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  FileText,
  Download,
  Printer,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  CreditCard,
  Calendar,
  Scale,
  ArrowRight
} from 'lucide-react';

interface ReceiptItem {
  id: string;
  receiptNumber: string;
  date: string;
  material: string;
  verifiedWeightKg: number;
  ratePerKg: number;
  totalPayoutPkr: number;
  paymentMethod: string;
  transactionRef: string;
  collectorName: string;
  status: 'paid' | 'processing';
}

const SAMPLE_RECEIPTS: ReceiptItem[] = [
  {
    id: 'rc-101',
    receiptNumber: 'SP-RCP-2026-0089',
    date: '2026-10-18',
    material: 'PET Plastic Grade A',
    verifiedWeightKg: 18.5,
    ratePerKg: 80,
    totalPayoutPkr: 1480,
    paymentMethod: 'EasyPaisa Wallet',
    transactionRef: 'EP-9028192831',
    collectorName: 'Rashid Khan (ID #COL-44)',
    status: 'paid'
  },
  {
    id: 'rc-102',
    receiptNumber: 'SP-RCP-2026-0074',
    date: '2026-10-12',
    material: 'OCC Corrugated Cardboard',
    verifiedWeightKg: 42.0,
    ratePerKg: 35,
    totalPayoutPkr: 1470,
    paymentMethod: 'JazzCash Instant',
    transactionRef: 'JC-8819200192',
    collectorName: 'Imran Ali (ID #COL-12)',
    status: 'paid'
  },
  {
    id: 'rc-103',
    receiptNumber: 'SP-RCP-2026-0045',
    date: '2026-10-04',
    material: 'Aluminium Cans & Scrap',
    verifiedWeightKg: 12.0,
    ratePerKg: 120,
    totalPayoutPkr: 1440,
    paymentMethod: 'Direct Bank Transfer (HBL)',
    transactionRef: 'HBL-PK992019',
    collectorName: 'Rashid Khan (ID #COL-44)',
    status: 'paid'
  }
];

export default function CustomerReceiptsPage() {
  const { user } = useAuth();
  const { isUrdu } = useLanguage();
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptItem | null>(null);

  const totalEarned = SAMPLE_RECEIPTS.reduce((sum, r) => sum + r.totalPayoutPkr, 0);
  const totalWeight = SAMPLE_RECEIPTS.reduce((sum, r) => sum + r.verifiedWeightKg, 0);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <ProtectedRoute allowedRole={['customer', 'admin']}>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
              <Link href="/customer/dashboard" className="hover:text-purple-600 transition">
                {isUrdu ? 'ڈیش بورڈ' : 'Dashboard'}
              </Link>
              <span>/</span>
              <span className="text-purple-700 font-bold">{isUrdu ? 'ادائیگی کی رسیدیں' : 'Payment Receipts'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {isUrdu ? 'تصدیق شدہ فضلہ ادائیگی کی رسیدیں' : 'Verified Waste Payout Receipts'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {isUrdu
                ? 'اپنے ہر تصدیق شدہ پک اپ کے ڈیجیٹل پیمنٹ واؤچرز اور ٹیکس انوائسز دیکھیں یا ڈاؤن لوڈ کریں۔'
                : 'Download certified payout invoices with digital scale weight audit trails.'}
            </p>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase">{isUrdu ? 'کل موصول رقم' : 'Lifetime Earnings'}</span>
                <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-700 font-mono">Rs {totalEarned.toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-1">Instant digital disbursement</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase">{isUrdu ? 'کل تصدیق شدہ وزن' : 'Total Diverted'}</span>
                <div className="p-2 bg-purple-100 rounded-xl text-purple-700">
                  <Scale className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-purple-900 font-mono">{totalWeight} kg</p>
              <p className="text-xs text-slate-400 mt-1">Certified zero-landfill diversion</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase">{isUrdu ? 'جاری شدہ رسیدیں' : 'Issued Receipts'}</span>
                <div className="p-2 bg-blue-100 rounded-xl text-blue-700">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono">{SAMPLE_RECEIPTS.length}</p>
              <p className="text-xs text-slate-400 mt-1">100% verified settlement rate</p>
            </div>
          </div>

          {/* Receipts Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                <span>{isUrdu ? 'رسیدوں کی فہرست' : 'Electronic Invoices'}</span>
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-5">{isUrdu ? 'رسید نمبر' : 'Receipt ID'}</th>
                    <th className="py-3.5 px-4">{isUrdu ? 'تاریخ' : 'Date'}</th>
                    <th className="py-3.5 px-4">{isUrdu ? 'مواد' : 'Material'}</th>
                    <th className="py-3.5 px-4">{isUrdu ? 'وزن' : 'Verified Weight'}</th>
                    <th className="py-3.5 px-4">{isUrdu ? 'ادائیگی طریقہ' : 'Payment Method'}</th>
                    <th className="py-3.5 px-4">{isUrdu ? 'رقم' : 'Amount (PKR)'}</th>
                    <th className="py-3.5 px-5 text-right">{isUrdu ? 'ایکشن' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {SAMPLE_RECEIPTS.map((rc) => (
                    <tr key={rc.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-5 font-mono font-bold text-purple-700">
                        {rc.receiptNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {rc.date}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {rc.material}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {rc.verifiedWeightKg} kg
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-md text-[11px] font-medium text-slate-700">
                          <CreditCard className="w-3 h-3 text-slate-500" />
                          {rc.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black text-emerald-700">
                        Rs {rc.totalPayoutPkr.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => setSelectedReceipt(rc)}
                          className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 font-bold hover:bg-purple-100 transition"
                        >
                          {isUrdu ? 'دیکھیں' : 'View'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Receipt View Modal */}
          {selectedReceipt && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
                <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      Official SafaiPay Settlement
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-1">{selectedReceipt.receiptNumber}</h3>
                    <p className="text-xs text-slate-400">Issued: {selectedReceipt.date}</p>
                  </div>
                  <button
                    onClick={() => setSelectedReceipt(null)}
                    className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 text-xs text-slate-700">
                  <div className="bg-slate-50 p-3.5 rounded-xl space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">{isUrdu ? 'گاہک' : 'Customer'}:</span>
                      <span className="font-bold text-slate-900">{user?.full_name || 'SafaiPay Household Partner'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{isUrdu ? 'کولیکٹر' : 'Collector'}:</span>
                      <span className="font-bold text-slate-900">{selectedReceipt.collectorName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{isUrdu ? 'ٹرانزیکشن ریفرنس' : 'Txn Ref'}:</span>
                      <span className="font-mono text-purple-700 font-bold">{selectedReceipt.transactionRef}</span>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-3.5">
                    <div className="flex justify-between font-bold text-slate-900 mb-2 pb-2 border-b border-slate-100">
                      <span>{selectedReceipt.material}</span>
                      <span>Rs {selectedReceipt.totalPayoutPkr}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Verified Net Weight:</span>
                      <span className="font-mono font-bold text-slate-800">{selectedReceipt.verifiedWeightKg} kg</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Benchmark Rate:</span>
                      <span className="font-mono text-slate-800">Rs {selectedReceipt.ratePerKg}/kg</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-emerald-50 p-3.5 rounded-xl text-emerald-950 font-bold">
                    <span>{isUrdu ? 'کل ادا شدہ رقم' : 'Net Total Paid'}:</span>
                    <span className="text-lg font-black font-mono text-emerald-700">Rs {selectedReceipt.totalPayoutPkr.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{isUrdu ? 'پرنٹ کریں' : 'Print'}</span>
                  </button>

                  <button
                    onClick={() => setSelectedReceipt(null)}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition"
                  >
                    {isUrdu ? 'بند کریں' : 'Close'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
