'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { getMyPickups } from '@/lib/api';
import { PickupRequest } from '@/lib/types';
import {
  Package,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  Truck,
  PlusCircle,
  Scale
} from 'lucide-react';

export default function CustomerPickupsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isUrdu } = useLanguage();

  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPickup, setSelectedPickup] = useState<PickupRequest | null>(null);

  useEffect(() => {
    async function loadPickups() {
      try {
        setLoading(true);
        const data = await getMyPickups();
        setPickups(data);
      } catch (err) {
        console.error('Failed to load pickups', err);
      } finally {
        setLoading(false);
      }
    }
    loadPickups();
  }, []);

  const filteredPickups = pickups.filter((p) => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['pending', 'collector_assigned', 'in_progress'].includes(p.status.toLowerCase());
    if (filter === 'completed') return p.status.toLowerCase() === 'completed';
    return p.status.toLowerCase() === filter;
  });

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case 'completed':
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {isUrdu ? 'مکمل' : 'Completed'}</span>;
      case 'in_progress':
      case 'collector_assigned':
        return <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> {isUrdu ? 'راستے میں' : 'In Progress'}</span>;
      case 'pending':
        return <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {isUrdu ? 'زیر التواء' : 'Pending'}</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-xs px-2.5 py-1 rounded-full font-bold">{status}</span>;
    }
  };

  return (
    <ProtectedRoute allowedRole={['customer', 'admin']}>
      <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col font-sans transition-colors duration-200">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs text-theme-secondary mb-1">
                <Link href="/customer/dashboard" className="hover:text-theme-primary transition">
                  {isUrdu ? 'ڈیش بورڈ' : 'Dashboard'}
                </Link>
                <span>/</span>
                <span className="text-theme-primary font-bold">{isUrdu ? 'میرے پک اپس' : 'My Pickups'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-theme-text">
                {isUrdu ? 'ری سائیکلنگ پک اپ درخواستیں' : 'Recycling Pickup Requests'}
              </h1>
              <p className="text-sm text-theme-secondary mt-1">
                {isUrdu
                  ? 'اپنی تمام گزشتہ اور موجودہ کچرے کی پک اپ درخواستوں کی تصدیق اور ٹریکنگ کریں۔'
                  : 'Track real-time collection status, digital scale weights, and payouts.'}
              </p>
            </div>

            <Link
              href="/customer/book-pickup"
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-theme-primary hover:opacity-95 text-white font-bold text-sm shadow-md transition min-h-[44px]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isUrdu ? 'نیا پک اپ بک کریں' : 'Book New Pickup'}</span>
            </Link>
          </div>

          {/* Filter Bar */}
          <div className="bg-theme-surface p-4 rounded-2xl border border-theme-border mb-6 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-4 h-4 text-slate-400 mr-1" />
              {[
                { id: 'all', label: isUrdu ? 'سب' : 'All' },
                { id: 'active', label: isUrdu ? 'فعال' : 'Active' },
                { id: 'completed', label: isUrdu ? 'مکمل شدہ' : 'Completed' },
                { id: 'pending', label: isUrdu ? 'زیر التواء' : 'Pending' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setFilter(btn.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    filter === btn.id
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {filteredPickups.length} {isUrdu ? 'درخواستیں' : 'requests found'}
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="p-12 text-center text-theme-secondary">
              <div className="w-8 h-8 border-3 border-theme-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold">{isUrdu ? 'لوڈ ہو رہا ہے...' : 'Loading pickups...'}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredPickups.length === 0 && (
            <div className="bg-theme-surface rounded-3xl border border-theme-border p-12 text-center max-w-lg mx-auto shadow-xs">
              <Package className="w-12 h-12 text-theme-secondary opacity-50 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-theme-text mb-1">
                {isUrdu ? 'کوئی درخواست نہیں ملی' : 'No Pickups Found'}
              </h3>
              <p className="text-xs text-theme-secondary mb-6">
                {isUrdu
                  ? 'آپ نے ابھی تک اس زمرے میں کوئی پک اپ شیڈول نہیں کیا۔'
                  : 'You have not scheduled any doorstep recyclables collection matching this filter.'}
              </p>
              <Link
                href="/customer/book-pickup"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-theme-primary hover:opacity-95 text-white text-xs font-bold transition min-h-[44px]"
              >
                <span>{isUrdu ? 'پہلا پک اپ بک کریں' : 'Schedule First Pickup'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Pickups Grid */}
          {!loading && filteredPickups.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPickups.map((p) => (
                <div
                  key={p.id}
                  className="bg-theme-surface rounded-2xl border border-theme-border hover:border-theme-primary transition shadow-xs hover:shadow-md p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-bold text-theme-primary bg-theme-soft-mint px-2 py-0.5 rounded border border-theme-border">
                        {p.tracking_number}
                      </span>
                      {getStatusBadge(p.status)}
                    </div>

                    <h4 className="text-base font-bold text-theme-text mb-1">
                      {p.material_code.replace('_', ' ')}
                    </h4>

                    <div className="space-y-2 my-4 text-xs text-theme-secondary">
                      <div className="flex items-center space-x-2">
                        <Scale className="w-4 h-4 text-theme-secondary shrink-0" />
                        <span>
                          {isUrdu ? 'اندازہ وزن' : 'Est. Weight'}:{' '}
                          <strong className="text-theme-text">{p.estimated_quantity_kg} kg</strong>
                        </span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-theme-secondary shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{p.street_address}, {p.city}</span>
                      </div>
                      {p.preferred_time && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-theme-secondary shrink-0" />
                          <span>{p.preferred_time}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-theme-border/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-theme-secondary block">
                        {isUrdu ? 'تخمینی معاوضہ' : 'Estimated Payout'}
                      </span>
                      <span className="text-sm font-extrabold text-emerald-700">
                        Rs {p.pricing_calculations?.[0]?.total_price ?? Math.round(p.estimated_quantity_kg * 65)}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedPickup(p)}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-purple-100 text-purple-700 font-bold text-xs transition"
                    >
                      {isUrdu ? 'تفصیلات' : 'View Details'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pickup Details Modal */}
          {selectedPickup && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {selectedPickup.tracking_number}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">
                      {selectedPickup.material_code.replace('_', ' ')} Collection
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedPickup(null)}
                    className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 text-xs text-slate-700">
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl">
                    <div>
                      <span className="text-[11px] text-slate-500 block">{isUrdu ? 'حالت' : 'Status'}</span>
                      <span className="font-bold uppercase text-slate-900">{selectedPickup.status}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">{isUrdu ? 'تخمینی وزن' : 'Est. Weight'}</span>
                      <span className="font-bold text-slate-900">{selectedPickup.estimated_quantity_kg} kg</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 block mb-0.5">{isUrdu ? 'پتہ' : 'Pickup Address'}</span>
                    <p className="font-medium text-slate-900">{selectedPickup.street_address}, {selectedPickup.city}</p>
                  </div>

                  <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-3.5">
                    <span className="text-[11px] font-bold text-purple-900 block mb-1">
                      {isUrdu ? 'ڈیجیٹل وزن کی تصدیق اور ادائیگی' : 'Weight Verification & Payment'}
                    </span>
                    <p className="text-[11px] text-purple-700">
                      {isUrdu
                        ? 'جب کسٹوڈین پہنچے گا، وہ تصدیق شدہ اسکیل سے وزن ناپ کر فوری کیش یا ای والٹ ٹرانسفر کرے گا۔'
                        : 'On arrival, the certified collector logs the IoT scale reading. Instant payment is released upon mutual verification.'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => setSelectedPickup(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
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
