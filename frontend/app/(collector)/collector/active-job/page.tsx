'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  Scale,
  Camera,
  CheckCircle2,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Truck,
  RefreshCw
} from 'lucide-react';

function CollectorActiveJobContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pickupId = searchParams.get('id') || 'SP-JOB-401';
  const { isUrdu } = useLanguage();

  const [verifiedWeight, setVerifiedWeight] = useState<number>(18.5);
  const [qualityGrade, setQualityGrade] = useState<'A' | 'B' | 'C'>('A');
  const [photosUploaded, setPhotosUploaded] = useState<boolean>(false);
  const [customerOtp, setCustomerOtp] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const benchmarkRate = 80; // Rs/kg for PET
  const qualityFactor = qualityGrade === 'A' ? 1.0 : qualityGrade === 'B' ? 0.85 : 0.65;
  const totalCustomerPayout = Math.round(verifiedWeight * benchmarkRate * qualityFactor);
  const collectorCommission = Math.round(verifiedWeight * 30);

  const handleCompleteJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerOtp || customerOtp.length < 4) {
      setFormError('Please enter customer 4-digit verification code.');
      return;
    }
    setFormError(null);
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setCompleted(true);
      setTimeout(() => {
        router.push('/collector/earnings');
      }, 2000);
    }, 1200);
  };

  return (
    <ProtectedRoute allowedRole={['collector', 'admin']}>
      <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col font-sans transition-colors duration-200">
        <Navbar />

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
                <Link href="/collector/jobs" className="hover:text-purple-600 transition">
                  {isUrdu ? 'دستیاب کام' : 'Jobs'}
                </Link>
                <span>/</span>
                <span className="text-purple-700 font-bold">{isUrdu ? 'فعال کام' : 'Active Collection'}</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">
                {isUrdu ? 'ڈیجیٹل تصدیق اور وزن کا اندراج' : 'Active Pickup Verification Workflow'}
              </h1>
            </div>

            <span className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 border border-purple-200">
              <Truck className="w-3.5 h-3.5" />
              <span>In Progress</span>
            </span>
          </div>

          {completed ? (
            <div className="bg-white rounded-3xl border border-emerald-200 p-8 sm:p-12 text-center shadow-sm space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-emerald-950">
                {isUrdu ? 'پک اپ کامیابی سے مکمل ہو گیا!' : 'Pickup Completed & Verified!'}
              </h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Customer payout of <strong>Rs {totalCustomerPayout}</strong> dispatched. Your collector commission of{' '}
                <strong>Rs {collectorCommission}</strong> has been credited to your verified wallet.
              </p>
              <p className="text-xs text-purple-600 font-bold animate-pulse">
                Redirecting to earnings history...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Customer & Location Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      ID: {pickupId}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      PET Plastic Recyclables
                    </h3>
                    <div className="space-y-1 mt-2 text-xs text-slate-600">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>Falcon Complex, PECHS Block 6, Karachi</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>Customer Contact: <strong>+92 300 1110001</strong></span>
                      </div>
                    </div>
                  </div>

                  <a
                    href="tel:+923001110001"
                    className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Customer</span>
                  </a>
                </div>
              </div>

              {/* On-Site Verification Form */}
              <form onSubmit={handleCompleteJob} className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 shadow-xs space-y-6">
                {formError && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{formError}</span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    1. Certified Digital Scale Weight (kg)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={verifiedWeight}
                      onChange={(e) => setVerifiedWeight(Number(e.target.value))}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-mono font-black text-purple-800 w-36 focus:outline-none focus:border-purple-600"
                    />
                    <div className="text-xs text-slate-500">
                      <p className="font-semibold text-slate-800">Tare Deducted: 0.00 kg</p>
                      <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        IoT Smart-Scale Calibrated
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quality Grade */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    2. Waste Purity & Quality Grade
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { grade: 'A', name: 'Grade A (Pure)', factor: '100% Rate' },
                      { grade: 'B', name: 'Grade B (Sorted)', factor: '85% Rate' },
                      { grade: 'C', name: 'Grade C (Mixed)', factor: '65% Rate' },
                    ].map((g) => (
                      <button
                        type="button"
                        key={g.grade}
                        onClick={() => setQualityGrade(g.grade as any)}
                        className={`p-3 rounded-2xl border text-center transition ${
                          qualityGrade === g.grade
                            ? 'bg-purple-50 border-purple-600 ring-2 ring-purple-600/20'
                            : 'bg-white border-slate-200 hover:border-purple-300'
                        }`}
                      >
                        <p className="text-xs font-extrabold text-slate-900">{g.name}</p>
                        <p className="text-[11px] font-mono text-purple-700 mt-1">{g.factor}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photo Verification */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    3. On-Site Scale Photo Proof
                  </label>
                  <div
                    onClick={() => setPhotosUploaded(!photosUploaded)}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition ${
                      photosUploaded ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-300 bg-slate-50'
                    }`}
                  >
                    {photosUploaded ? (
                      <div className="flex items-center justify-center space-x-2 text-xs font-bold text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Scale Reading Photo Captured (Geo-tagged PECHS Karachi)</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Camera className="w-6 h-6 text-purple-600 mx-auto" />
                        <p className="text-xs font-bold text-slate-800">Tap to photograph scale reading</p>
                        <p className="text-[11px] text-slate-400">Required for automated fraud prevention</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Payout Breakdown */}
                <div className="bg-purple-50/80 border border-purple-100 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-purple-900">
                    <span>Customer Payout ({verifiedWeight} kg × Rs {benchmarkRate * qualityFactor}/kg):</span>
                    <strong className="font-mono text-sm">Rs {totalCustomerPayout}</strong>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-bold border-t border-purple-200 pt-2">
                    <span>Your Collector Commission:</span>
                    <strong className="font-mono text-sm">Rs {collectorCommission}</strong>
                  </div>
                </div>

                {/* Customer Mutual Confirmation OTP */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    4. Customer Confirmation OTP (Ask Customer)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 5124"
                    value={customerOtp}
                    onChange={(e) => setCustomerOtp(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center text-xl font-mono font-black tracking-widest text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Demo code: enter any 4 numbers (e.g. 1234)</p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-3.5 rounded-xl text-xs transition shadow-md shadow-purple-600/25 flex items-center justify-center space-x-2"
                >
                  <span>{submitting ? 'Verifying & Disbursing Settlement...' : 'Finalize Collection & Trigger Payout'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default function CollectorActiveJobPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-theme-bg flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-theme-primary animate-spin" />
        </div>
      }
    >
      <CollectorActiveJobContent />
    </Suspense>
  );
}

