'use client';

import React from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  FileBadge,
  ShieldCheck,
  CheckCircle2,
  Download,
  Building,
  Scale,
  Sparkles,
  Award
} from 'lucide-react';

const TRACEABILITY_LOGS = [
  {
    step: '1. Household Collection Origin',
    actor: 'Verified Citizens (PECHS & Clifton)',
    timestamp: '16 Oct 2026, 09:30 AM',
    detail: '28 Doorstep collections aggregating 540 kg of Post-Consumer PET Bottles.',
    hash: '0x8f9a...3b12'
  },
  {
    step: '2. Collector IoT Scale Verification',
    actor: 'Certified Collector Fleet',
    timestamp: '16 Oct 2026, 12:45 PM',
    detail: 'Calibrated smart-scale digital tare & photo evidence submitted. 0% deviation.',
    hash: '0x1c4d...e988'
  },
  {
    step: '3. Hub Baling & Purity Lab Testing',
    actor: 'SafaiPay Central Hub #2',
    timestamp: '17 Oct 2026, 03:00 PM',
    detail: 'Automated sorting & optical scanning. Purity certified at 99.1% with 0.8% moisture.',
    hash: '0x7e22...4fa1'
  },
  {
    step: '4. Industrial Recycler Receipt',
    actor: 'Pak Polymers Ltd (Factory Bay 3)',
    timestamp: '19 Oct 2026, 11:20 AM',
    detail: 'Weighbridge gross 24,800 kg verified. Lot melted for food-grade rPET pelletization.',
    hash: '0x99a1...ff03'
  }
];

export default function RecyclerTraceabilityPage() {
  const { user } = useAuth();
  const { isUrdu } = useLanguage();

  const handleExport = () => {
    if (typeof window !== 'undefined') window.print();
  };

  return (
    <ProtectedRoute allowedRole={['recycler', 'admin']}>
      <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col font-sans transition-colors duration-200">
        <Navbar />

        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
                <Link href="/recycler/dashboard" className="hover:text-purple-600 transition">
                  {isUrdu ? 'ڈیش بورڈ' : 'Dashboard'}
                </Link>
                <span>/</span>
                <span className="text-purple-700 font-bold">{isUrdu ? 'شفافیت اور سراغ رساں' : 'Traceability & ESG'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {isUrdu ? 'ڈیجیٹل سراغ رسانی اور ای ایس جی چین آف کسٹڈی' : 'Material Provenance & ESG Audit Ledger'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {isUrdu
                  ? 'گھر کی دہلیز سے صنعتی فیکٹری تک ہر کلوگرام کا مصدقہ ڈیجیٹل آڈٹ ٹریل۔'
                  : 'Immutable digital chain-of-custody verifying circularity compliance for export brands.'}
              </p>
            </div>

            <button
              onClick={handleExport}
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md shadow-purple-600/20 transition"
            >
              <Download className="w-4 h-4" />
              <span>{isUrdu ? 'ای ایس جی رپورٹ برآمد کریں' : 'Export ESG Compliance Report'}</span>
            </button>
          </div>

          {/* ESG Badge */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center space-x-2 text-emerald-300 mb-2">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Certified Zero-Greenwashing Guarantee</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black">100% Post-Consumer Origin Verified</h2>
              <p className="text-xs text-emerald-100 mt-1 max-w-lg">
                Audited against international circular economy standards (ISO 14021 & Ellen MacArthur Foundation plastic pact framework).
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-200">Carbon Abated</span>
              <p className="text-2xl font-black font-mono text-emerald-300 mt-0.5">38.4 Tons CO₂e</p>
              <p className="text-[11px] text-emerald-100 mt-1">Scope 3 Emissions Offset</p>
            </div>
          </div>

          {/* Traceability Timeline */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
              <FileBadge className="w-5 h-5 text-purple-600" />
              <span>Chain of Custody Digital Provenance (Lot #BATCH-PET-2026-041)</span>
            </h3>

            <div className="space-y-8 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-purple-200">
              {TRACEABILITY_LOGS.map((log, idx) => (
                <div key={idx} className="relative pl-8">
                  <div className="absolute left-1.5 top-1 w-5 h-5 rounded-full bg-purple-600 ring-4 ring-purple-100 flex items-center justify-center text-white text-[10px] font-bold">
                    ✓
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                      <h4 className="text-xs font-bold text-slate-900">{log.step}</h4>
                      <span className="text-[11px] font-mono text-slate-400">{log.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{log.detail}</p>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                      <span className="text-slate-500">Verified By: <strong className="text-slate-800">{log.actor}</strong></span>
                      <span className="font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">Audit Hash: {log.hash}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
