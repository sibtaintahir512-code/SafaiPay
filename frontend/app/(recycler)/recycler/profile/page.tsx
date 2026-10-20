'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
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
  Award,
  Palette
} from 'lucide-react';

export default function RecyclerProfilePage() {
  const { user } = useAuth();
  const { isUrdu } = useLanguage();

  const [companyName, setCompanyName] = useState('Indus Plastic Polymers Ltd');
  const [ntnNumber, setNtnNumber] = useState('NTN-8942109-7');
  const [capacityTons, setCapacityTons] = useState(500);
  const [plantAddress, setPlantAddress] = useState('Plot 48, Sector 15, Korangi Industrial Area, Karachi');
  const [focalPerson, setFocalPerson] = useState('Engr. Kamran Siddiqui');
  const [contactEmail, setContactEmail] = useState('procurement@indusplastic.pk');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <ProtectedRoute allowedRole={['recycler', 'admin']}>
      <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col font-sans transition-colors duration-200">
        <Navbar />

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs text-theme-secondary mb-1">
              <Link href="/recycler/dashboard" className="hover:text-theme-primary transition">
                {isUrdu ? 'ڈیش بورڈ' : 'Dashboard'}
              </Link>
              <span>/</span>
              <span className="text-theme-primary font-bold">{isUrdu ? 'پروفائل' : 'Corporate Profile'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-theme-text">
              {isUrdu ? 'صنعتی ری سائیکلر کارپوریٹ پروفائل' : 'Recycling Enterprise Corporate Profile'}
            </h1>
            <p className="text-sm text-theme-secondary mt-1">
              {isUrdu
                ? 'ڈسپلے تھیم، فیکٹری کی پروسیسنگ گنجائش، انوائرنمنٹل پروٹیکشن ایجنسی این او سی اور ٹیکس رجسٹریشن۔'
                : 'Manage display appearance, industrial processing capacity, Sindh EPA license compliance, and billing details.'}
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
                  ? 'صنعتی کنٹرول روم یا موبائل کے لیے موزوں ڈسپلے موڈ منتخب کریں:'
                  : 'Optimize screen display for industrial plant control rooms or mobile oversight:'}
              </p>
              <ThemeSwitcher variant="full" />
            </div>

            <form onSubmit={handleSave} className="bg-theme-surface p-6 sm:p-8 rounded-3xl border border-theme-border shadow-xs space-y-6 transition-colors">
              <h3 className="text-base font-bold text-theme-text flex items-center gap-2 border-b border-theme-border/60 pb-3">
                <Factory className="w-4 h-4 text-theme-primary" />
                <span>Industrial Plant & Legal Information</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">Company Registered Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-theme-input border border-theme-border rounded-xl px-3.5 py-2.5 text-xs text-theme-text focus:outline-none focus:border-theme-primary min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">National Tax Number (NTN)</label>
                  <input
                    type="text"
                    value={ntnNumber}
                    onChange={(e) => setNtnNumber(e.target.value)}
                    className="w-full bg-theme-input border border-theme-border rounded-xl px-3.5 py-2.5 text-xs text-theme-text font-mono focus:outline-none focus:border-theme-primary min-h-[44px]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">Processing Facility Address</label>
                  <input
                    type="text"
                    value={plantAddress}
                    onChange={(e) => setPlantAddress(e.target.value)}
                    className="w-full bg-theme-input border border-theme-border rounded-xl px-3.5 py-2.5 text-xs text-theme-text focus:outline-none focus:border-theme-primary min-h-[44px]"
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
                  <span>Save Corporate Details</span>
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
