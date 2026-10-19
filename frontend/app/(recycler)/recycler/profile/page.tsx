'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  Factory,
  Building,
  Mail,
  Phone,
  ShieldCheck,
  FileText,
  Save,
  CheckCircle2,
  Award
} from 'lucide-react';

export default function RecyclerProfilePage() {
  const { user } = useAuth();
  const { isUrdu } = useLanguage();

  const [companyName, setCompanyName] = useState('Pak Eco-Polymers & Packaging Ltd');
  const [ntnNumber, setNtnNumber] = useState('7849102-4');
  const [capacityTons, setCapacityTons] = useState(500);
  const [plantAddress, setPlantAddress] = useState('Plot D-44, Sector 7-A, Korangi Industrial Area, Karachi');
  const [focalPerson, setFocalPerson] = useState('Engr. Kamran Siddiqui');
  const [contactEmail, setContactEmail] = useState('procurement@pakpolymers.com.pk');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <ProtectedRoute allowedRole={['recycler', 'admin']}>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        <Navbar />

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
              <Link href="/recycler/dashboard" className="hover:text-purple-600 transition">
                {isUrdu ? 'ڈیش بورڈ' : 'Dashboard'}
              </Link>
              <span>/</span>
              <span className="text-purple-700 font-bold">{isUrdu ? 'پروفائل' : 'Corporate Profile'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {isUrdu ? 'صنعتی ری سائیکلر کارپوریٹ پروفائل' : 'Recycling Enterprise Corporate Profile'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {isUrdu
                ? 'فیکٹری کی پروسیسنگ گنجائش، انوائرنمنٹل پروٹیکشن ایجنسی این او سی اور ٹیکس رجسٹریشن۔'
                : 'Manage industrial processing capacity, Sindh EPA license compliance, and billing details.'}
            </p>
          </div>

          <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <Factory className="w-4 h-4 text-purple-600" />
                <span>Enterprise & Facility Information</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Corporate Entity Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">FBR NTN Number</label>
                  <input
                    type="text"
                    value={ntnNumber}
                    onChange={(e) => setNtnNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Monthly Pelletization Capacity (Tons)</label>
                <input
                  type="number"
                  value={capacityTons}
                  onChange={(e) => setCapacityTons(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Lead Procurement Officer</label>
                <input
                  type="text"
                  value={focalPerson}
                  onChange={(e) => setFocalPerson(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Factory Plant Address</label>
              <input
                type="text"
                value={plantAddress}
                onChange={(e) => setPlantAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
              />
            </div>

            {/* EPA License Badge */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-emerald-950">Sindh Environmental Protection Agency (SEPA) NOC</h4>
                  <p className="text-[11px] text-emerald-800">License #SEPA-REC-2024-884 | Valid through Dec 2027</p>
                </div>
              </div>
              <span className="bg-emerald-600 text-white font-bold px-3 py-1 rounded-lg text-[10px] uppercase">
                Active & Certified
              </span>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              {saved ? (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Enterprise profile updated!</span>
                </span>
              ) : <span />}

              <button
                type="submit"
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-md shadow-purple-600/20"
              >
                <Save className="w-4 h-4" />
                <span>Save Enterprise Profile</span>
              </button>
            </div>
          </form>
        </main>
      </div>
    </ProtectedRoute>
  );
}
