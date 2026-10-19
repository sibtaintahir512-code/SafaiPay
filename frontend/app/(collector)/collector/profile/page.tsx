'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  Truck,
  User,
  Phone,
  ShieldCheck,
  CreditCard,
  Scale,
  Save,
  CheckCircle2,
  MapPin
} from 'lucide-react';

export default function CollectorProfilePage() {
  const { user } = useAuth();
  const { isUrdu } = useLanguage();

  const [fullName, setFullName] = useState(user?.full_name || 'Rashid Khan');
  const [phone, setPhone] = useState(user?.phone_number || '+923002220001');
  const [vehicleType, setVehicleType] = useState('Electric Loader Rickshaw');
  const [vehicleNumber, setVehicleNumber] = useState('KHI-LE-9042');
  const [operatingZone, setOperatingZone] = useState('Karachi East (PECHS & Bahadurabad)');
  const [scaleSerial, setScaleSerial] = useState('SP-SCALE-8841');
  const [walletPhone, setWalletPhone] = useState('03002220001');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <ProtectedRoute allowedRole={['collector', 'admin']}>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        <Navbar />

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
              <Link href="/collector/dashboard" className="hover:text-purple-600 transition">
                {isUrdu ? 'ڈیش بورڈ' : 'Dashboard'}
              </Link>
              <span>/</span>
              <span className="text-purple-700 font-bold">{isUrdu ? 'پروفائل' : 'Collector Profile'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {isUrdu ? 'کولیکٹر تصدیق شدہ پروفائل' : 'Collector Verified Profile & Equipment'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {isUrdu
                ? 'گاڑی کی تفصیلات، وزنی ترازو کی کیلیبریشن اور کمیشن والٹ کا انتظام کریں۔'
                : 'Manage vehicle registration, smart scale IoT calibration, and payout wallet.'}
            </p>
          </div>

          <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            {/* Identity section */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <User className="w-4 h-4 text-purple-600" />
                <span>Identity & Verification</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Phone Number (Login ID)</label>
                  <input
                    type="text"
                    disabled
                    value={phone}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Vehicle & Logistics */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Truck className="w-4 h-4 text-purple-600" />
                <span>Logistics & Vehicle Information</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Vehicle Type</label>
                  <input
                    type="text"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Vehicle Registration #</label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Hardware & IoT Smart Scale */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Scale className="w-4 h-4 text-purple-600" />
                <span>Smart IoT Digital Scale Hardware</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Scale Serial Number</label>
                  <input
                    type="text"
                    value={scaleSerial}
                    onChange={(e) => setScaleSerial(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Primary Operating Sector</label>
                  <input
                    type="text"
                    value={operatingZone}
                    onChange={(e) => setOperatingZone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>
            </div>

            {/* Payout Mobile Wallet */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                <CreditCard className="w-4 h-4 text-purple-600" />
                <span>Commission Direct Payout Mobile Wallet</span>
              </h3>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">EasyPaisa / JazzCash Mobile Number</label>
                <input
                  type="text"
                  value={walletPhone}
                  onChange={(e) => setWalletPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600 font-mono"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              {saved ? (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Collector profile updated!</span>
                </span>
              ) : <span />}

              <button
                type="submit"
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-md shadow-purple-600/20"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile</span>
              </button>
            </div>
          </form>
        </main>
      </div>
    </ProtectedRoute>
  );
}
