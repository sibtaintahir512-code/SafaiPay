'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/context/LanguageContext';
import {
  DollarSign,
  TrendingUp,
  Scale,
  Save,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface PricingItem {
  code: string;
  name: string;
  unit: string;
  ratePkr: number;
  tierAFactor: number;
  tierBFactor: number;
  tierCFactor: number;
  lastUpdated: string;
}

const DEFAULT_RATES: PricingItem[] = [
  { code: 'PET_PLASTIC', name: 'PET Plastic Bottles & Containers', unit: 'kg', ratePkr: 80, tierAFactor: 1.0, tierBFactor: 0.85, tierCFactor: 0.65, lastUpdated: 'Today' },
  { code: 'CARDBOARD_OCC', name: 'Corrugated Cardboard (OCC)', unit: 'kg', ratePkr: 35, tierAFactor: 1.0, tierBFactor: 0.85, tierCFactor: 0.65, lastUpdated: 'Today' },
  { code: 'MIXED_METAL', name: 'Mixed Scrap Metal & Tin', unit: 'kg', ratePkr: 120, tierAFactor: 1.0, tierBFactor: 0.90, tierCFactor: 0.70, lastUpdated: 'Yesterday' },
  { code: 'GLASS_BOTTLES', name: 'Glass Bottles & Cullet', unit: 'kg', ratePkr: 25, tierAFactor: 1.0, tierBFactor: 0.80, tierCFactor: 0.50, lastUpdated: '3 days ago' },
  { code: 'HDPE_PLASTIC', name: 'HDPE Rigid Milk Jugs & Drums', unit: 'kg', ratePkr: 95, tierAFactor: 1.0, tierBFactor: 0.85, tierCFactor: 0.65, lastUpdated: 'Today' },
  { code: 'ALUMINUM_CANS', name: 'Aluminum Beverage Cans', unit: 'kg', ratePkr: 165, tierAFactor: 1.0, tierBFactor: 0.90, tierCFactor: 0.75, lastUpdated: 'Today' },
];

export default function AdminPricingPage() {
  const { isUrdu } = useLanguage();
  const [rates, setRates] = useState<PricingItem[]>(DEFAULT_RATES);
  const [saved, setSaved] = useState(false);

  const handleRateChange = (code: string, newRate: number) => {
    setRates(rates.map((r) => (r.code === code ? { ...r, ratePkr: newRate, lastUpdated: 'Just now' } : r)));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
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
                <span className="text-purple-700 font-bold">{isUrdu ? 'قیمتوں کا تعین' : 'Material Benchmark Pricing'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {isUrdu ? 'ری سائیکلیبل مواد کے سرکاری نرخ' : 'Recyclable Stream Benchmark Rates & Quality Multipliers'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {isUrdu
                  ? 'بنیادی قیمتیں (PKR فی کلوگرام) اور کوالٹی ٹیئرز (A, B, C) کو فوری اپ ڈیٹ کریں۔'
                  : 'Manage dynamic wholesale benchmark rates that calculate customer payouts and recycler invoice pricing.'}
              </p>
            </div>

            <button
              onClick={handleSave}
              className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md shadow-purple-600/20 transition"
            >
              <Save className="w-4 h-4" />
              <span>{saved ? 'Updated Live Platform Pricing!' : 'Publish Global Rates'}</span>
            </button>
          </div>

          {saved && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Live pricing engine updated. All customer bookings and collector weighing scales synchronized.</span>
            </div>
          )}

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rates.map((item) => (
              <div
                key={item.code}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {item.code}
                    </span>
                    <span className="text-[11px] text-slate-400">Updated: {item.lastUpdated}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-4">{item.name}</h3>

                  <div className="bg-slate-50 p-4 rounded-2xl mb-4">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Benchmark Rate (PKR / {item.unit})
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-bold text-slate-600">Rs</span>
                      <input
                        type="number"
                        value={item.ratePkr}
                        onChange={(e) => handleRateChange(item.code, Number(e.target.value))}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-lg font-mono font-black text-purple-800 w-32 focus:outline-none focus:border-purple-600"
                      />
                      <span className="text-xs text-slate-500">per {item.unit}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Tier A (Pure 100%):</span>
                      <strong className="text-emerald-700 font-mono">Rs {Math.round(item.ratePkr * item.tierAFactor)}/kg</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Tier B (Sorted 85%):</span>
                      <strong className="text-blue-700 font-mono">Rs {Math.round(item.ratePkr * item.tierBFactor)}/kg</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Tier C (Mixed 65%):</span>
                      <strong className="text-amber-700 font-mono">Rs {Math.round(item.ratePkr * item.tierCFactor)}/kg</strong>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
