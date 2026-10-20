'use client';

import React from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/context/LanguageContext';
import {
  FileText,
  Download,
  TrendingUp,
  BarChart2,
  Scale,
  Award,
  Globe,
  DollarSign
} from 'lucide-react';

export default function AdminReportsPage() {
  const { isUrdu } = useLanguage();

  const handleExport = () => {
    if (typeof window !== 'undefined') window.print();
  };

  return (
    <ProtectedRoute allowedRole="admin">
      <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col font-sans transition-colors duration-200">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
                <Link href="/admin/dashboard" className="hover:text-purple-600 transition">
                  {isUrdu ? 'ڈیش بورڈ' : 'Admin Hub'}
                </Link>
                <span>/</span>
                <span className="text-purple-700 font-bold">{isUrdu ? 'رپورٹس اور انٹیلیجنس' : 'Executive Reports'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {isUrdu ? 'پلیٹ فارم تجزیات اور ای ایس جی امپیکٹ رپورٹ' : 'Executive Analytics & Circular ESG Reports'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {isUrdu
                  ? 'شہری ری سائیکلنگ کے اعداد و شمار، کاربن تخفیف اور معاشی بہبود کی جامع رپورٹس۔'
                  : 'Comprehensive monthly tonnage, socio-economic micro-income impact, and Scope-3 emissions reduction audits.'}
              </p>
            </div>

            <button
              onClick={handleExport}
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md shadow-purple-600/20 transition"
            >
              <Download className="w-4 h-4" />
              <span>{isUrdu ? 'رپورٹ ڈاؤن لوڈ کریں' : 'Export Audited Report'}</span>
            </button>
          </div>

          {/* Top 4 Impact Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Total Diverted Mass</span>
              <p className="text-3xl font-black text-slate-900 font-mono mt-1">142.8 Tons</p>
              <p className="text-xs text-emerald-600 font-semibold mt-1">99.1% diverted from landfills</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Gross Payout Disbursed</span>
              <p className="text-3xl font-black text-emerald-700 font-mono mt-1">Rs 8.42M</p>
              <p className="text-xs text-slate-400 mt-1">Direct to informal sector wallets</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">CO₂e Abatement</span>
              <p className="text-3xl font-black text-purple-700 font-mono mt-1">194.2 Tons</p>
              <p className="text-xs text-slate-400 mt-1">Equivalent to 8,400 trees planted</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Registered Citizen Hubs</span>
              <p className="text-3xl font-black text-blue-900 font-mono mt-1">2,840</p>
              <p className="text-xs text-emerald-600 font-bold mt-1">Across 18 Karachi sectors</p>
            </div>
          </div>

          {/* Breakdown sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Stream Distribution */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Scale className="w-5 h-5 text-purple-600" />
                <span>Material Stream Volume Breakdown</span>
              </h3>

              <div className="space-y-4">
                {[
                  { name: 'PET Plastic (Grade A/B)', tons: 58.4, pct: 41, color: 'bg-purple-600' },
                  { name: 'Corrugated Cardboard (OCC)', tons: 45.2, pct: 32, color: 'bg-blue-600' },
                  { name: 'Mixed Scrap Metal', tons: 22.8, pct: 16, color: 'bg-amber-600' },
                  { name: 'Glass Bottles & Cullet', tons: 16.4, pct: 11, color: 'bg-emerald-600' },
                ].map((m) => (
                  <div key={m.name}>
                    <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                      <span>{m.name}</span>
                      <span className="font-mono">{m.tons} Tons ({m.pct}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${m.color}`} style={{ width: `${m.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* District Tonnage */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-purple-600" />
                <span>Geographic Sector Tonnage Distribution</span>
              </h3>

              <div className="space-y-4">
                {[
                  { district: 'Karachi East (PECHS, Bahadurabad, Gulshan)', tonnage: '54.2 Tons', collectors: 12 },
                  { district: 'Karachi South (Clifton & DHA)', tonnage: '48.6 Tons', collectors: 9 },
                  { district: 'Korangi Industrial & Residential', tonnage: '24.8 Tons', collectors: 5 },
                  { district: 'Karachi Central (Nazimabad, FB Area)', tonnage: '15.2 Tons', collectors: 4 },
                ].map((d) => (
                  <div key={d.district} className="p-3.5 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-bold text-slate-900">{d.district}</h4>
                      <p className="text-slate-400 mt-0.5">{d.collectors} certified collector units</p>
                    </div>
                    <span className="font-mono font-black text-purple-700 text-sm">{d.tonnage}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
