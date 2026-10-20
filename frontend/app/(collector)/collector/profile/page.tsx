'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
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
  MapPin,
  Palette
} from 'lucide-react';

export default function CollectorProfilePage() {
  const { user } = useAuth();
  const { isUrdu } = useLanguage();

  const [fullName, setFullName] = useState(user?.full_name || 'Muhammad Rafiq');
  const [phone, setPhone] = useState(user?.phone_number || '+923002220001');
  const [vehicleType, setVehicleType] = useState('Motorized Tricycle');
  const [vehicleNumber, setVehicleNumber] = useState('KHI-LE-9042');
  const [operatingZone, setOperatingZone] = useState('Karachi East (PECHS & Bahadurabad)');
  const [scaleSerial, setScaleSerial] = useState('SCALE-KHI-402');
  const [walletPhone, setWalletPhone] = useState('03002220001');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <ProtectedRoute allowedRole={['collector', 'admin']}>
      <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col font-sans transition-colors duration-200">
        <Navbar />

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs text-theme-secondary mb-1">
              <Link href="/collector/dashboard" className="hover:text-theme-primary transition">
                {isUrdu ? 'ڈیش بورڈ' : 'Dashboard'}
              </Link>
              <span>/</span>
              <span className="text-theme-primary font-bold">{isUrdu ? 'پروفائل' : 'Collector Profile'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-theme-text">
              {isUrdu ? 'کولیکٹر تصدیق شدہ پروفائل' : 'Collector Verified Profile & Equipment'}
            </h1>
            <p className="text-sm text-theme-secondary mt-1">
              {isUrdu
                ? 'ڈسپلے تھیم، گاڑی کی تفصیلات، وزنی ترازو کی کیلیبریشن اور کمیشن والٹ کا انتظام کریں۔'
                : 'Manage display appearance, vehicle registration, smart scale IoT calibration, and payout wallet.'}
            </p>
          </div>

          <div className="space-y-6">
            {/* Visual Appearance / Theme Switcher Card */}
            <div className="bg-theme-surface p-6 sm:p-8 rounded-3xl border border-theme-border shadow-xs space-y-4 transition-colors">
              <h3 className="text-base font-bold text-theme-text flex items-center gap-2 border-b border-theme-border/60 pb-3">
                <Palette className="w-4 h-4 text-theme-primary" />
                <span>{isUrdu ? 'پلیٹ فارم ڈسپلے تھیم' : 'Theme & Visual Appearance'}</span>
              </h3>
              <p className="text-xs text-theme-secondary">
                {isUrdu
                  ? 'دھوپ میں یا رات کے وقت آسانی کے لیے موزوں تھیم منتخب کریں:'
                  : 'Optimize screen contrast for high-glare daytime routes or night hours:'}
              </p>
              <ThemeSwitcher variant="full" />
            </div>

            <form onSubmit={handleSave} className="bg-theme-surface p-6 sm:p-8 rounded-3xl border border-theme-border shadow-xs space-y-6 transition-colors">
              <h3 className="text-base font-bold text-theme-text flex items-center gap-2 border-b border-theme-border/60 pb-3">
                <User className="w-4 h-4 text-theme-primary" />
                <span>Personal & Equipment Credentials</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-theme-input border border-theme-border rounded-xl px-3.5 py-2.5 text-xs text-theme-text focus:outline-none focus:border-theme-primary min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    disabled
                    className="w-full bg-theme-bg border border-theme-border rounded-xl px-3.5 py-2.5 text-xs text-theme-secondary cursor-not-allowed font-mono min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">Vehicle Classification</label>
                  <input
                    type="text"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full bg-theme-input border border-theme-border rounded-xl px-3.5 py-2.5 text-xs text-theme-text focus:outline-none focus:border-theme-primary min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">Digital Scale Serial</label>
                  <input
                    type="text"
                    value={scaleSerial}
                    onChange={(e) => setScaleSerial(e.target.value)}
                    className="w-full bg-theme-input border border-theme-border rounded-xl px-3.5 py-2.5 text-xs text-theme-text font-mono focus:outline-none focus:border-theme-primary min-h-[44px]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-theme-border/60 flex items-center justify-between">
                {saved ? (
                  <span className="text-xs font-bold text-theme-primary flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Profile saved successfully!</span>
                  </span>
                ) : <span />}

                <button
                  type="submit"
                  className="inline-flex items-center space-x-2 rtl:space-x-reverse px-6 py-3 rounded-xl bg-theme-primary hover:opacity-95 text-white font-bold text-xs transition shadow-md min-h-[44px]"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
