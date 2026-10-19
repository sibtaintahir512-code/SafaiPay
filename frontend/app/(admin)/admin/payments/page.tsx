'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/context/LanguageContext';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

interface PaymentTx {
  id: string;
  recipient: string;
  type: 'Customer Payout' | 'Collector Commission' | 'Recycler Settlement';
  channel: 'EasyPaisa' | 'JazzCash' | 'Raast (1Link)';
  amountPkr: number;
  status: 'completed' | 'queued' | 'failed';
  time: string;
  ref: string;
}

const PAYMENT_QUEUE: PaymentTx[] = [
  { id: 'PAY-8801', recipient: 'PECHS Citizen Partner', type: 'Customer Payout', channel: 'EasyPaisa', amountPkr: 1480, status: 'completed', time: '10 mins ago', ref: 'EP-9028192831' },
  { id: 'PAY-8802', recipient: 'Rashid Khan (Collector #4)', type: 'Collector Commission', channel: 'EasyPaisa', amountPkr: 555, status: 'completed', time: '12 mins ago', ref: 'EP-9028192832' },
  { id: 'PAY-8803', recipient: 'Imran Ali (Collector #12)', type: 'Collector Commission', channel: 'JazzCash', amountPkr: 1020, status: 'completed', time: '25 mins ago', ref: 'JC-8819200192' },
  { id: 'PAY-8804', recipient: 'Defence Citizen Partner', type: 'Customer Payout', channel: 'Raast (1Link)', amountPkr: 2200, status: 'queued', time: 'Just now', ref: 'RST-PENDING-01' },
  { id: 'PAY-8805', recipient: 'Gulshan Citizen Partner', type: 'Customer Payout', channel: 'JazzCash', amountPkr: 890, status: 'failed', time: '1 hour ago', ref: 'JC-FAIL-TIMEOUT' },
];

export default function AdminPaymentsPage() {
  const { isUrdu } = useLanguage();
  const [payments, setPayments] = useState<PaymentTx[]>(PAYMENT_QUEUE);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const handleRetry = (id: string) => {
    setRetryingId(id);
    setTimeout(() => {
      setPayments(payments.map((p) => (p.id === id ? { ...p, status: 'completed', ref: 'JC-RETRY-SUCCESS-99' } : p)));
      setRetryingId(null);
    }, 1200);
  };

  return (
    <ProtectedRoute allowedRole="admin">
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
                <Link href="/admin/dashboard" className="hover:text-purple-600 transition">
                  {isUrdu ? 'ڈیش بورڈ' : 'Admin Hub'}
                </Link>
                <span>/</span>
                <span className="text-purple-700 font-bold">{isUrdu ? 'ادائیگیاں' : 'Payment Settlements'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {isUrdu ? 'ڈیجیٹل ادائیگیاں، گیٹ وے اور تصفیہ' : 'Disbursements & Payment Gateway Settlement'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {isUrdu
                  ? 'ایزی پیسہ، جاز کیش اور راست نیٹ ورک کے ذریعے خودکار فنڈز کی منتقلی کا جائزہ لیں۔'
                  : 'Monitor automated mobile wallet disbursements, retry failed transfers, and audit liquidity.'}
              </p>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Settled Today (PKR)</span>
              <p className="text-2xl font-black text-emerald-700 font-mono mt-1">Rs 284,500</p>
              <p className="text-[11px] text-slate-400 mt-1">100% automated straight-through processing</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Queued In Pipeline</span>
              <p className="text-2xl font-black text-purple-700 font-mono mt-1">Rs 2,200</p>
              <p className="text-[11px] text-slate-400 mt-1">Awaiting bank batch window</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Float Reserve Balance</span>
              <p className="text-2xl font-black text-slate-900 font-mono mt-1">Rs 1,500,000</p>
              <p className="text-[11px] text-emerald-600 font-bold mt-1">Healthy liquidity coverage</p>
            </div>
          </div>

          {/* Queue Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-600" />
                <span>Live Disbursement Transaction Queue</span>
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-5">Payment ID</th>
                    <th className="py-3.5 px-4">Recipient</th>
                    <th className="py-3.5 px-4">Payout Type</th>
                    <th className="py-3.5 px-4">Gateway Channel</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Tx Reference</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-5 font-mono font-bold text-purple-700">{p.id}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{p.recipient}</td>
                      <td className="py-3.5 px-4 text-slate-600">{p.type}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">{p.channel}</td>
                      <td className="py-3.5 px-4 font-mono font-black text-slate-900">Rs {p.amountPkr.toLocaleString()}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          p.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'queued'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{p.ref}</td>
                      <td className="py-3.5 px-5 text-right">
                        {p.status === 'failed' && (
                          <button
                            onClick={() => handleRetry(p.id)}
                            disabled={retryingId === p.id}
                            className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold transition text-xs"
                          >
                            {retryingId === p.id ? 'Retrying...' : 'Retry Tx'}
                          </button>
                        )}
                        {p.status === 'completed' && (
                          <span className="text-emerald-600 font-bold text-xs">Settled</span>
                        )}
                        {p.status === 'queued' && (
                          <span className="text-blue-600 font-bold text-xs">In Transit</span>
                        )}
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
