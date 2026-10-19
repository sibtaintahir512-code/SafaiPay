'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { getAvailablePickups, assignPickupToCollector } from '@/lib/api';
import { PickupRequest } from '@/lib/types';
import {
  Truck,
  MapPin,
  Scale,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  Navigation,
  Shield,
  Zap,
  Radio
} from 'lucide-react';

export default function CollectorJobsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isUrdu } = useLanguage();

  const [jobs, setJobs] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadJobs() {
      try {
        setLoading(true);
        const data = await getAvailablePickups();
        setJobs(data);
      } catch (err) {
        console.error('Failed to load available pickup jobs', err);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, []);

  const handleAcceptJob = async (pickupId: string) => {
    try {
      setAcceptingId(pickupId);
      await assignPickupToCollector(pickupId, user?.id || 'col-demo-1');
      router.push(`/collector/active-job?id=${pickupId}`);
    } catch (err: any) {
      alert(`Accept Error: ${err.message}`);
      setAcceptingId(null);
    }
  };

  const filteredJobs = jobs.filter((j) => {
    if (selectedMaterial === 'all') return true;
    return j.material_code.toLowerCase().includes(selectedMaterial.toLowerCase());
  });

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
                <span className="text-purple-700 font-bold">{isUrdu ? 'دستیاب کام' : 'Available Jobs'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {isUrdu ? 'قریبی پک اپ نوکریاں' : 'Nearby Pickup Dispatch Pool'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {isUrdu
                  ? 'اپنے روٹ کے مطابق آرڈرز قبول کریں اور تصدیق شدہ وزنی اسکیل کے ذریعے کمائیں۔'
                  : 'Claim verified doorstep recyclable pickups in your designated geo-fenced sector.'}
              </p>
            </div>

            {/* Online / Offline switch */}
            <div className="flex items-center space-x-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs">
              <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              <span className="text-xs font-bold text-slate-800">
                {isOnline ? (isUrdu ? 'ڈیوٹی آن ہے' : 'On-Duty Live') : (isUrdu ? 'آف لائن' : 'Offline')}
              </span>
              <button
                onClick={() => setIsOnline(!isOnline)}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold transition ${
                  isOnline ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {isOnline ? 'Go Offline' : 'Go Online'}
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 mb-6 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-4 h-4 text-slate-400 mr-1" />
              {[
                { id: 'all', label: isUrdu ? 'تمام مواد' : 'All Materials' },
                { id: 'plastic', label: isUrdu ? 'پلاسٹک' : 'PET Plastic' },
                { id: 'cardboard', label: isUrdu ? 'گتا' : 'Cardboard' },
                { id: 'metal', label: isUrdu ? 'دھات' : 'Metals' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setSelectedMaterial(btn.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    selectedMaterial === btn.id
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {filteredJobs.length} {isUrdu ? 'دستیاب آرڈرز' : 'jobs available'}
            </div>
          </div>

          {/* Jobs List */}
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold">{isUrdu ? 'نوکریاں تلاش کی جا رہی ہیں...' : 'Scanning dispatch zone...'}</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-xs">
              <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                {isUrdu ? 'کوئی نیا آرڈر دستیاب نہیں' : 'No Open Pickups in Your Zone'}
              </h3>
              <p className="text-xs text-slate-500">
                {isUrdu
                  ? 'جیسے ہی کوئی نیا گاہک ری سائیکلنگ کی درخواست کرے گا، وہ فوراً یہاں ظاہر ہو جائے گی۔'
                  : 'Keep your status active. New household & commercial pickup requests will ping automatically.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-purple-300 transition shadow-xs hover:shadow-md p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {job.tracking_number}
                      </span>
                      <span className="bg-emerald-50 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 border border-emerald-200">
                        <Zap className="w-3 h-3 text-emerald-600" />
                        {isUrdu ? 'فوری قبولیت' : 'Ready'}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 mb-1">
                      {job.material_code.replace('_', ' ')}
                    </h4>

                    <div className="space-y-2 my-4 text-xs text-slate-600">
                      <div className="flex items-center space-x-2">
                        <Scale className="w-4 h-4 text-purple-600 shrink-0" />
                        <span>
                          {isUrdu ? 'تخمینی وزن' : 'Est. Load'}:{' '}
                          <strong className="text-slate-900 font-mono">{job.estimated_quantity_kg} kg</strong>
                        </span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{job.street_address}, {job.city}</span>
                      </div>
                      {job.preferred_time && (
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                          <span>{job.preferred_time}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Collector Payout</span>
                      <span className="text-sm font-extrabold text-emerald-700">
                        Rs {Math.round(job.estimated_quantity_kg * 40)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAcceptJob(job.id)}
                      disabled={acceptingId === job.id}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-sm shadow-purple-600/20 disabled:opacity-50"
                    >
                      <span>{acceptingId === job.id ? 'Claiming...' : (isUrdu ? 'کام قبول کریں' : 'Accept Job')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
