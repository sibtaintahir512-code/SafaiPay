'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  FileCheck2,
  Truck,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Filter,
  Scale
} from 'lucide-react';

interface BatchRequest {
  id: string;
  orderNumber: string;
  material: string;
  tons: number;
  totalPkr: number;
  status: 'pending' | 'approved' | 'dispatched' | 'delivered';
  hub: string;
  date: string;
}

const SAMPLE_REQUESTS: BatchRequest[] = [
  {
    id: 'req-1',
    orderNumber: 'PO-REC-2026-081',
    material: 'Clean Washed Hot-Water PET Flakes',
    tons: 12.5,
    totalPkr: 1150000,
    status: 'dispatched',
    hub: 'Korangi Industrial Hub',
    date: '2026-10-19'
  },
  {
    id: 'req-2',
    orderNumber: 'PO-REC-2026-065',
    material: 'Corrugated Cardboard OCC Bales',
    tons: 24.0,
    totalPkr: 1008000,
    status: 'delivered',
    hub: 'SITE Central Hub',
    date: '2026-10-15'
  },
  {
    id: 'req-3',
    orderNumber: 'PO-REC-2026-052',
    material: 'HDPE Regrind Pellets',
    tons: 8.0,
    totalPkr: 920000,
    status: 'approved',
    hub: 'Port Qasim Hub',
    date: '2026-10-18'
  }
];

export default function RecyclerBatchRequestsPage() {
  const { user } = useAuth();
  const { isUrdu } = useLanguage();
  const [filter, setFilter] = useState('all');

  const getStatusBadge = (status: BatchRequest['status']) => {
    switch (status) {
      case 'delivered':
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Delivered</span>;
      case 'dispatched':
        return <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> En Route</span>;
      case 'approved':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Approved</span>;
      default:
        return <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold">Pending Review</span>;
    }
  };

  const filtered = SAMPLE_REQUESTS.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  return (
    <ProtectedRoute allowedRole={['recycler', 'admin']}>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
                <Link href="/recycler/dashboard" className="hover:text-purple-600 transition">
                  {isUrdu ? 'ڈیش بورڈ' : 'Dashboard'}
                </Link>
                <span>/</span>
                <span className="text-purple-700 font-bold">{isUrdu ? 'بیچ کے آرڈرز' : 'Batch Orders'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {isUrdu ? 'صنعتی خام مال کے احکامات اور پی اوز' : 'Industrial Procurement Purchase Orders'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {isUrdu
                  ? 'اپنے تمام تصدیق شدہ بیچ آرڈرز اور گیٹ پاسز کی ٹریکنگ کریں۔'
                  : 'Track bulk recyclable feedstock orders from hub weighbridges to factory delivery.'}
              </p>
            </div>

            <Link
              href="/recycler/marketplace"
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md shadow-purple-600/20 transition"
            >
              <span>{isUrdu ? 'نئے بیچز تلاش کریں' : 'Browse Marketplace'}</span>
            </Link>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-slate-400" />
                {['all', 'dispatched', 'approved', 'delivered'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition capitalize ${
                      filter === f ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-500">{filtered.length} Orders</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-5">Order #</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Feedstock Material</th>
                    <th className="py-3.5 px-4">Quantity</th>
                    <th className="py-3.5 px-4">Origin Hub</th>
                    <th className="py-3.5 px-4">Total Amount</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-5 text-right">Dispatch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filtered.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-5 font-mono font-bold text-purple-700">{req.orderNumber}</td>
                      <td className="py-3.5 px-4 text-slate-500">{req.date}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{req.material}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{req.tons} Tons</td>
                      <td className="py-3.5 px-4 text-slate-600">{req.hub}</td>
                      <td className="py-3.5 px-4 font-mono font-black text-slate-900">Rs {req.totalPkr.toLocaleString()}</td>
                      <td className="py-3.5 px-4">{getStatusBadge(req.status)}</td>
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          href={`/recycler/dispatch?order=${req.orderNumber}`}
                          className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition"
                        >
                          Track Logistics
                        </Link>
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
