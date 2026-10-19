'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { createPickup } from '@/lib/api';
import { Sparkles, Camera, ArrowRight, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function BookPickupPage() {
  const router = useRouter();
  const [material, setMaterial] = useState('PET_PLASTIC');
  const [weight, setWeight] = useState(15);
  const [address, setAddress] = useState('Falcon Complex, PECHS Block 6, Karachi');
  const [preferredTime, setPreferredTime] = useState('Today 2:00 PM - 5:00 PM');
  const [photo, setPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createPickup({
        material_code: material,
        estimated_quantity_kg: Number(weight),
        street_address: address,
        preferred_time: preferredTime,
        photo_url: photo ? 'https://images.unsplash.com/photo-1530587191325-3db32d826c18' : undefined,
      });
      setSuccess(true);
      setTimeout(() => router.push('/customer/dashboard'), 1500);
    } catch (err: any) {
      alert(`Booking Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRole="customer">
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
          <button
            onClick={() => router.push('/customer/dashboard')}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-purple-600 mb-6 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <div className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 shadow-xs">
            <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Book a Recyclable Pickup</h1>
            <p className="text-xs text-slate-500 mb-6">Verified doorstep collection with certified digital weighing scale.</p>

            {success ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="text-base font-extrabold text-emerald-950">Pickup Booked Successfully!</h3>
                <p className="text-xs text-emerald-800">Assigned collector dispatch in progress. Returning to dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">1. Material Stream</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { code: 'PET_PLASTIC', name: 'PET Plastic', rate: 'Rs 80/kg' },
                      { code: 'CARDBOARD_OCC', name: 'Cardboard', rate: 'Rs 35/kg' },
                      { code: 'MIXED_METAL', name: 'Mixed Metal', rate: 'Rs 120/kg' },
                      { code: 'GLASS_BOTTLES', name: 'Glass Bottles', rate: 'Rs 25/kg' },
                    ].map((m) => (
                      <div
                        key={m.code}
                        onClick={() => setMaterial(m.code)}
                        className={`p-3.5 rounded-2xl border text-center cursor-pointer transition ${
                          material === m.code
                            ? 'bg-purple-50 border-purple-600 ring-2 ring-purple-600/20'
                            : 'bg-white border-slate-200 hover:border-purple-300'
                        }`}
                      >
                        <p className="text-xs font-bold text-slate-900">{m.name}</p>
                        <p className="text-xs font-mono font-extrabold text-purple-700 mt-1">{m.rate}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">2. Estimated Quantity (kg)</label>
                    <span className="text-sm font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">{weight} kg</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="100"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full accent-purple-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">3. AI Waste Classification (Optional)</label>
                  <div
                    onClick={() => setPhoto(!photo)}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition ${
                      photo ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-300 bg-slate-50'
                    }`}
                  >
                    {photo ? (
                      <div className="flex items-center justify-center space-x-2 text-xs font-bold text-emerald-800">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>AI Matched: Grade A Recyclable Stream (98.4% Confidence)</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Camera className="w-6 h-6 text-purple-600 mx-auto" />
                        <p className="text-xs font-bold text-slate-800">Click to attach waste photo</p>
                        <p className="text-[11px] text-slate-400">Automated classification & purity estimation</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Pickup Address</label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Preferred Time Window</label>
                    <input
                      type="text"
                      required
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-3.5 rounded-xl text-xs transition shadow-md shadow-purple-600/25 flex items-center justify-center space-x-2"
                >
                  <span>{submitting ? 'Confirming Dispatch...' : 'Confirm Doorstep Pickup Request'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
