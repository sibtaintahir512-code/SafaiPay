'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
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
  Plus
} from 'lucide-react';

export default function CustomerProfilePage() {
  const { user, logout } = useAuth();
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
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        <Navbar />

        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
              <Link href="/customer/dashboard" className="hover:text-purple-600 transition">
                {isUrdu ? 'ڈیش بورڈ' : 'Dashboard'}
              </Link>
              <span>/</span>
              <span className="text-purple-700 font-bold">{isUrdu ? 'پروفائل' : 'Profile & Settings'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {isUrdu ? 'کسٹمر پروفائل اور اکاؤنٹ' : 'Customer Account Profile'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {isUrdu
                ? 'اپنی رابطہ معلومات، محفوظ شدہ پتے، اور فوری ڈیجیٹل ادائیگی کے طریقے منظم کریں۔'
                : 'Manage verified contact details, delivery addresses, and payout wallets.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Profile Card */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs text-center">
                <div className="w-20 h-20 bg-purple-100 border-2 border-purple-200 rounded-full flex items-center justify-center text-purple-700 font-black text-2xl mx-auto mb-4">
                  {fullName.charAt(0)}
                </div>
                <h3 className="text-lg font-bold text-slate-900">{fullName}</h3>
                <p className="text-xs text-slate-500">{phone}</p>

                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verified Citizen Partner</span>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-3 text-left">
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Total Pickups</span>
                    <p className="text-lg font-bold text-slate-900 mt-0.5">14</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Eco Tier</span>
                    <p className="text-lg font-bold text-emerald-700 mt-0.5">Gold</p>
                  </div>
                </div>
              </div>

              {/* Eco Impact Badge */}
              <div className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white p-6 rounded-3xl shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <Award className="w-5 h-5 text-emerald-300" />
                  <h4 className="font-bold text-sm">Carbon Offset Champion</h4>
                </div>
                <p className="text-xs text-emerald-100 leading-relaxed">
                  Your recycled materials have diverted over 230 kg from Karachi landfills, offsetting an estimated 310 kg of CO2 equivalent.
                </p>
              </div>
            </div>

            {/* Right Column: Edit Forms */}
            <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <User className="w-4 h-4 text-purple-600" />
                  <span>{isUrdu ? 'ذاتی معلومات' : 'Personal Information'}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                    <input
                      type="text"
                      disabled
                      value={phone}
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    <span>{isUrdu ? 'فوری ادائیگی اکاؤنٹ' : 'Direct Payout Wallet'}</span>
                  </h3>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { id: 'easypaisa', label: 'EasyPaisa' },
                      { id: 'jazzcash', label: 'JazzCash' },
                      { id: 'bank', label: 'Bank Account' }
                    ].map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => setPayoutMethod(p.id as any)}
                        className={`p-3 rounded-xl border text-xs font-bold transition text-center ${
                          payoutMethod === p.id
                            ? 'bg-purple-50 border-purple-600 text-purple-900 ring-2 ring-purple-600/20'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      {payoutMethod === 'bank' ? 'IBAN / Account Number' : 'Registered Mobile Number'}
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  {saved ? (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Profile updated successfully!</span>
                    </span>
                  ) : <span />}

                  <button
                    type="submit"
                    className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-md shadow-purple-600/20"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isUrdu ? 'محفوظ کریں' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>

              {/* Saved Addresses */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-purple-600" />
                    <span>{isUrdu ? 'محفوظ پتے' : 'Saved Pickup Addresses'}</span>
                  </h3>
                </div>

                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-900">{addr.title}</span>
                          {addr.isDefault && (
                            <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">Default</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{addr.address}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
