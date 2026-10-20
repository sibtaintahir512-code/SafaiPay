'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Award,
  CheckCircle2,
  ShieldCheck,
  Save,
  Trash2,
  Plus,
  Palette
} from 'lucide-react';

export default function CustomerProfilePage() {
  const { user } = useAuth();
  const { isUrdu } = useLanguage();

  const [fullName, setFullName] = useState(user?.full_name || 'SafaiPay Household');
  const [phone, setPhone] = useState(user?.phone_number || '+923001110001');
  const [email, setEmail] = useState(user?.email || 'household@safaipay.org');
  const [payoutMethod, setPayoutMethod] = useState<'easypaisa' | 'jazzcash' | 'bank'>('easypaisa');
  const [accountNumber, setAccountNumber] = useState('03001110001');
  const [saved, setSaved] = useState(false);

  const [addresses, setAddresses] = useState([
    { id: 1, title: 'Primary Residence', address: 'Falcon Complex, PECHS Block 6, Karachi', isDefault: true },
    { id: 2, title: 'Office', address: 'Plot 14-C, Shahrah-e-Faisal, Karachi', isDefault: false }
  ]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <ProtectedRoute allowedRole={['customer', 'admin']}>
      <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col font-sans transition-colors duration-200">
        <Navbar />

        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs text-theme-secondary mb-1">
              <Link href="/customer/dashboard" className="hover:text-theme-primary transition">
                {isUrdu ? 'ڈیش بورڈ' : 'Dashboard'}
              </Link>
              <span>/</span>
              <span className="text-theme-primary font-bold">{isUrdu ? 'پروفائل' : 'Profile & Settings'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-theme-text">
              {isUrdu ? 'کسٹمر پروفائل اور اکاؤنٹ' : 'Customer Account Profile'}
            </h1>
            <p className="text-sm text-theme-secondary mt-1">
              {isUrdu
                ? 'اپنی رابطہ معلومات، ڈسپلے تھیم، محفوظ شدہ پتے، اور فوری ڈیجیٹل ادائیگی کے طریقے منظم کریں۔'
                : 'Manage verified contact details, display appearance theme, delivery addresses, and payout wallets.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Profile Card */}
            <div className="space-y-6">
              <div className="bg-theme-surface p-6 rounded-3xl border border-theme-border shadow-xs text-center transition-colors">
                <div className="w-20 h-20 bg-theme-soft-mint border-2 border-theme-border rounded-full flex items-center justify-center text-theme-primary font-black text-2xl mx-auto mb-4">
                  {fullName.charAt(0)}
                </div>
                <h3 className="text-lg font-bold text-theme-text">{fullName}</h3>
                <p className="text-xs text-theme-secondary font-mono">{phone}</p>

                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-theme-soft-mint text-theme-primary rounded-full text-xs font-bold border border-theme-border">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verified Citizen Partner</span>
                </div>

                <div className="mt-6 pt-6 border-t border-theme-border/60 grid grid-cols-2 gap-3 text-left rtl:text-right">
                  <div className="bg-theme-bg p-3 rounded-xl border border-theme-border">
                    <span className="text-[10px] text-theme-secondary uppercase font-bold">Total Pickups</span>
                    <p className="text-lg font-bold text-theme-text mt-0.5">14</p>
                  </div>
                  <div className="bg-theme-bg p-3 rounded-xl border border-theme-border">
                    <span className="text-[10px] text-theme-secondary uppercase font-bold">Eco Tier</span>
                    <p className="text-lg font-bold text-theme-primary mt-0.5">Gold</p>
                  </div>
                </div>
              </div>

              {/* Eco Impact Badge */}
              <div className="bg-gradient-to-br from-theme-deep-green to-theme-surface text-white p-6 rounded-3xl border border-theme-border shadow-sm">
                <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                  <Award className="w-5 h-5 text-theme-bright-green" />
                  <h4 className="font-bold text-sm text-theme-text">Carbon Offset Champion</h4>
                </div>
                <p className="text-xs text-theme-secondary leading-relaxed">
                  Your recycled materials have diverted over 230 kg from Karachi landfills, offsetting an estimated 310 kg of CO2 equivalent.
                </p>
              </div>
            </div>

            {/* Right Column: Edit Forms & Theme Switcher */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Appearance / Theme Switcher Card */}
              <div className="bg-theme-surface p-6 sm:p-8 rounded-3xl border border-theme-border shadow-xs space-y-4 transition-colors">
                <h3 className="text-base font-bold text-theme-text flex items-center gap-2 border-b border-theme-border/60 pb-3">
                  <Palette className="w-4 h-4 text-theme-primary" />
                  <span>{isUrdu ? 'پلیٹ فارم ڈسپلے تھیم' : 'Theme & Visual Appearance'}</span>
                </h3>
                <p className="text-xs text-theme-secondary">
                  {isUrdu 
                    ? 'صفائی پے پورٹل کو لائٹ، ڈارک، یا اپنے ڈیوائس کے سسٹم ڈیفالٹ میں دیکھیں:' 
                    : 'View SafaiPay in Light Mode, Dark Mode, or match your Operating System default:'}
                </p>
                <ThemeSwitcher variant="full" />
              </div>

              {/* Personal Information Form */}
              <form onSubmit={handleSave} className="bg-theme-surface p-6 sm:p-8 rounded-3xl border border-theme-border shadow-xs space-y-6 transition-colors">
                <h3 className="text-base font-bold text-theme-text flex items-center gap-2 border-b border-theme-border/60 pb-3">
                  <User className="w-4 h-4 text-theme-primary" />
                  <span>{isUrdu ? 'ذاتی معلومات' : 'Personal Information'}</span>
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
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-theme-input border border-theme-border rounded-xl px-3.5 py-2.5 text-xs text-theme-text focus:outline-none focus:border-theme-primary min-h-[44px]"
                    />
                  </div>
                </div>

                {/* Digital Payout Wallet */}
                <div className="pt-4 border-t border-theme-border/60">
                  <h3 className="text-base font-bold text-theme-text flex items-center gap-2 mb-3">
                    <CreditCard className="w-4 h-4 text-theme-primary" />
                    <span>{isUrdu ? 'ڈیجیٹل ادائیگی کا والیٹ' : 'Digital Payout Destination'}</span>
                  </h3>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { id: 'easypaisa', name: 'Easypaisa' },
                      { id: 'jazzcash', name: 'JazzCash' },
                      { id: 'bank', name: 'Raast / Bank' }
                    ].map((m) => (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setPayoutMethod(m.id as any)}
                        className={`min-h-[44px] p-3 rounded-xl border text-xs font-bold transition text-center ${
                          payoutMethod === m.id
                            ? 'bg-theme-soft-mint border-theme-primary text-theme-primary ring-2 ring-theme-primary/20'
                            : 'bg-theme-surface border-theme-border text-theme-secondary hover:border-theme-primary/40'
                        }`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">
                      {payoutMethod === 'bank' ? 'IBAN / Raast ID' : `${payoutMethod.toUpperCase()} Mobile Account`}
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full bg-theme-input border border-theme-border rounded-xl px-3.5 py-2.5 text-xs text-theme-text font-mono focus:outline-none focus:border-theme-primary min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-theme-border/60 flex items-center justify-between">
                  {saved ? (
                    <span className="text-xs font-bold text-theme-primary flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isUrdu ? 'پروفائل کامیابی سے محفوظ ہوگئی!' : 'Profile saved successfully!'}</span>
                    </span>
                  ) : <span />}

                  <button
                    type="submit"
                    className="inline-flex items-center space-x-2 rtl:space-x-reverse px-6 py-3 rounded-xl bg-theme-primary hover:opacity-95 text-white font-bold text-xs transition shadow-md min-h-[44px]"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isUrdu ? 'محفوظ کریں' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
