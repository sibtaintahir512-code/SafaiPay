'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  Factory,
  Package,
  Scale,
  MapPin,
  Filter,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface MaterialBatch {
  id: string;
  batchCode: string;
  materialName: string;
  materialCategory: string;
  totalWeightTons: number;
  qualityGrade: 'Tier A' | 'Tier B';
  purityPercent: number;
  ratePerTonPkr: number;
  hubLocation: string;
  availableSince: string;
  moisturePercent: number;
  certifiedEco: boolean;
}

const MARKETPLACE_BATCHES: MaterialBatch[] = [
  {
    id: 'b-901',
    batchCode: 'BATCH-PET-2026-041',
    materialName: 'Clean Washed Hot-Water PET Flakes',
    materialCategory: 'PET_PLASTIC',
    totalWeightTons: 12.5,
    qualityGrade: 'Tier A',
    purityPercent: 99.1,
    ratePerTonPkr: 92000,
    hubLocation: 'Korangi Industrial Area Hub, Karachi',
    availableSince: 'Yesterday',
    moisturePercent: 0.8,
    certifiedEco: true
  },
  {
    id: 'b-902',
    batchCode: 'BATCH-OCC-2026-088',
    materialName: 'Double-Walled Corrugated Cardboard Bales',
    materialCategory: 'CARDBOARD_OCC',
    totalWeightTons: 24.0,
    qualityGrade: 'Tier A',
    purityPercent: 98.4,
    ratePerTonPkr: 42000,
    hubLocation: 'SITE Area Central Hub, Karachi',
    availableSince: '2 days ago',
    moisturePercent: 4.2,
    certifiedEco: true
  },
  {
    id: 'b-903',
    batchCode: 'BATCH-HDPE-2026-019',
    materialName: 'HDPE Natural Bottle Grade Granules',
    materialCategory: 'HDPE_PLASTIC',
    totalWeightTons: 8.2,
    qualityGrade: 'Tier A',
    purityPercent: 99.4,
    ratePerTonPkr: 115000,
    hubLocation: 'Port Qasim Logistics Hub, Karachi',
    availableSince: 'Today',
    moisturePercent: 0.4,
    certifiedEco: true
  },
  {
    id: 'b-904',
    batchCode: 'BATCH-MET-2026-012',
    materialName: 'Baled Aluminum UBC Beverage Cans',
    materialCategory: 'MIXED_METAL',
    totalWeightTons: 6.0,
    qualityGrade: 'Tier A',
    purityPercent: 97.8,
    ratePerTonPkr: 165000,
    hubLocation: 'North Karachi Industrial Hub, Karachi',
    availableSince: '3 days ago',
    moisturePercent: 0.2,
    certifiedEco: true
  }
];

export default function RecyclerMarketplacePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isUrdu } = useLanguage();

  const [batches] = useState<MaterialBatch[]>(MARKETPLACE_BATCHES);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBatch, setSelectedBatch] = useState<MaterialBatch | null>(null);
  const [requested, setRequested] = useState<boolean>(false);

  const filteredBatches = batches.filter((b) => {
    if (selectedCategory === 'all') return true;
    return b.materialCategory.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  const handleRequestProcurement = (e: React.FormEvent) => {
    e.preventDefault();
    setRequested(true);
    setTimeout(() => {
      setRequested(false);
      setSelectedBatch(null);
      router.push('/recycler/batch-requests');
    }, 1500);
  };

  return (
    <ProtectedRoute allowedRole={['recycler', 'admin']}>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
                <Link href="/recycler/dashboard" className="hover:text-purple-600 transition">
                  {isUrdu ? 'ڈیش بورڈ' : 'Dashboard'}
                </Link>
                <span>/</span>
                <span className="text-purple-700 font-bold">{isUrdu ? 'مارکیٹ پلیس' : 'Marketplace'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {isUrdu ? 'تھوک ری سائیکلیبل میٹریل مارکیٹ پلیس' : 'B2B Wholesale Recyclables Marketplace'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {isUrdu
                  ? 'صنعتی کارخانوں کے لیے تصدیق شدہ بیلز، پیور فلییکس اور کلوگرام/ٹن کے بیچز خریدیں۔'
                  : 'Procure pre-sorted, lab-tested industrial feedstock with verified origin traceability.'}
              </p>
            </div>

            <Link
              href="/recycler/batch-requests"
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md shadow-purple-600/20 transition"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>{isUrdu ? 'میری بیچ درخواستیں' : 'My Procurement Orders'}</span>
            </Link>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 mb-6 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-4 h-4 text-slate-400 mr-1" />
              {[
                { id: 'all', label: isUrdu ? 'تمام خام مال' : 'All Materials' },
                { id: 'pet', label: isUrdu ? 'پی ای ٹی فلییکس' : 'PET Flakes' },
                { id: 'cardboard', label: isUrdu ? 'او سی سی گتا' : 'OCC Cardboard' },
                { id: 'hdpe', label: isUrdu ? 'ایچ ڈی پی ای' : 'HDPE Polymer' },
                { id: 'metal', label: isUrdu ? 'ایلومینیم اور میٹل' : 'Metals' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setSelectedCategory(btn.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    selectedCategory === btn.id
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {filteredBatches.length} industrial lots available
            </div>
          </div>

          {/* Batches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredBatches.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-3xl border border-slate-200 hover:border-purple-300 transition shadow-xs hover:shadow-md p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {b.batchCode}
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {b.qualityGrade} ({b.purityPercent}% Pure)
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2">{b.materialName}</h3>

                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl my-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px] uppercase font-bold">Total Net Weight</span>
                      <strong className="text-slate-900 font-mono text-base">{b.totalWeightTons} Metric Tons</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] uppercase font-bold">Rate Per Ton</span>
                      <strong className="text-emerald-700 font-mono text-base">Rs {b.ratePerTonPkr.toLocaleString()}</strong>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{b.hubLocation}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Scale className="w-3.5 h-3.5 text-slate-400" />
                      <span>Moisture: <strong>{b.moisturePercent}%</strong> | Sorted & Baled</span>
                    </div>
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-100 flex items-center justify-between mt-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Lot Value</span>
                    <span className="text-lg font-black text-slate-900 font-mono">
                      Rs {(b.totalWeightTons * b.ratePerTonPkr).toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedBatch(b)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-sm shadow-purple-600/20"
                  >
                    <span>Request Procurement</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Procurement Modal */}
          {selectedBatch && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
                <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {selectedBatch.batchCode}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">
                      Procurement Purchase Order Request
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedBatch(null)}
                    className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
                  >
                    ✕
                  </button>
                </div>

                {requested ? (
                  <div className="py-8 text-center space-y-2">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                    <h4 className="text-base font-bold text-emerald-950">Purchase Order Submitted!</h4>
                    <p className="text-xs text-slate-500">Dispatch logistics and weighbridge gate-pass scheduled.</p>
                  </div>
                ) : (
                  <form onSubmit={handleRequestProcurement} className="space-y-4 text-xs">
                    <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Feedstock Lot:</span>
                        <strong className="text-slate-900">{selectedBatch.materialName}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Batch Quantity:</span>
                        <strong className="font-mono text-slate-900">{selectedBatch.totalWeightTons} Tons</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pickup Hub:</span>
                        <span className="text-slate-800">{selectedBatch.hubLocation}</span>
                      </div>
                    </div>

                    <div className="bg-purple-50/80 border border-purple-100 rounded-xl p-3.5 space-y-1">
                      <div className="flex justify-between text-purple-900 font-bold">
                        <span>Total Invoice Amount:</span>
                        <span className="font-mono text-sm">
                          Rs {(selectedBatch.totalWeightTons * selectedBatch.ratePerTonPkr).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-700">
                        Includes certified chain-of-custody documentation & digital weighbridge receipt.
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setSelectedBatch(null)}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition shadow-md shadow-purple-600/20"
                      >
                        Confirm Purchase Order
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
