'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  Scale,
  ShieldCheck,
  FileText,
  User,
  Phone,
  RefreshCw
} from 'lucide-react';

function RecyclerDispatchContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order') || 'PO-REC-2026-081';
  const { isUrdu } = useLanguage();
  const [received, setReceived] = useState(false);

  return (
    <ProtectedRoute allowedRole={['recycler', 'admin']}>
      <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col font-sans transition-colors duration-200">
        <Navbar />

        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
              <Link href="/recycler/dashboard" className="hover:text-purple-600 transition">
                {isUrdu ? 'ڈیش بورڈ' : 'Dashboard'}
              </Link>
              <span>/</span>
              <span className="text-purple-700 font-bold">{isUrdu ? 'ترسیل اور لاجسٹکس' : 'Logistics Dispatch'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {isUrdu ? 'ٹرک لاجسٹکس اور گیٹ پاس ٹریکنگ' : 'Industrial Freight Dispatch & Weighbridge Tracking'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {isUrdu
                ? 'بیچ کے راستے، وزنی کانٹے کے اوزان، اور گیٹ ان کا ڈیجیٹل اندراج۔'
                : 'Monitor live freight carrier transit, calibrated hub weighbridge stamps, and delivery sign-off.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Active Dispatch Status */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                  <div>
                    <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      Tracking: {orderId}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">12.5 Metric Tons PET Flakes</h3>
                  </div>
                  <span className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 border border-purple-200">
                    <Truck className="w-3.5 h-3.5" />
                    <span>In Transit (ETA: 45 mins)</span>
                  </span>
                </div>

                {/* Progress Stepper */}
                <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-purple-200">
                  <div className="relative">
                    <div className="absolute -left-6 top-0 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-emerald-100 flex items-center justify-center text-white text-[10px]">✓</div>
                    <h4 className="text-xs font-bold text-slate-900">Hub Weighbridge Outbound</h4>
                    <p className="text-[11px] text-slate-500">Gross: 24,800 kg | Tare: 12,300 kg | Net: 12,500 kg (Stamping Certified)</p>
                    <span className="text-[10px] text-slate-400">10:15 AM - Korangi Industrial Hub</span>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-6 top-0 w-4 h-4 rounded-full bg-purple-600 ring-4 ring-purple-100 animate-pulse" />
                    <h4 className="text-xs font-bold text-purple-900">En Route via Express Highway</h4>
                    <p className="text-[11px] text-slate-500">Carrier speeding within safe limit (42 km/h)</p>
                    <span className="text-[10px] text-purple-600 font-bold">Live GPS Active</span>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-6 top-0 w-4 h-4 rounded-full bg-slate-300 ring-4 ring-slate-100" />
                    <h4 className="text-xs font-bold text-slate-400">Factory Gate-In Weighing</h4>
                    <p className="text-[11px] text-slate-400">Pending arrival at Recycler Factory Bay 3</p>
                  </div>
                </div>

                {/* Confirm Gate-In Button */}
                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                  {received ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Gate-In Confirmed! Traceability record minted.</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReceived(true)}
                      className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-md shadow-purple-600/20"
                    >
                      Acknowledge Factory Delivery & Weigh-In
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Driver & Carrier Specs */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-600" />
                  <span>Freight Carrier Details</span>
                </h4>

                <div className="space-y-3 text-xs text-slate-600">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Driver:</span>
                    <strong className="text-slate-900">Tariq Mehmood</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Truck Plate:</span>
                    <strong className="font-mono text-purple-700">TL-8902 (10-Wheeler)</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Carrier Company:</span>
                    <span className="text-slate-900 font-medium">Indus Eco-Logistics</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Gate Pass:</span>
                    <strong className="font-mono text-emerald-700">GP-2026-9912</strong>
                  </div>
                </div>

                <a
                  href="tel:+923004440001"
                  className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-600" />
                  <span>Contact Carrier Dispatch</span>
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default function RecyclerDispatchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-theme-bg flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-theme-primary animate-spin" />
        </div>
      }
    >
      <RecyclerDispatchContent />
    </Suspense>
  );
}

