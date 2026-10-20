'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useLanguage } from '@/context/LanguageContext';
import {
  Settings,
  Sliders,
  Shield,
  Bell,
  Cpu,
  Save,
  CheckCircle2,
  Lock,
  Globe,
  Palette
} from 'lucide-react';

export default function AdminSettingsPage() {
  const { isUrdu } = useLanguage();

  const [aiConfidenceThreshold, setAiConfidenceThreshold] = useState(85);
  const [maxPickupWeightKg, setMaxPickupWeightKg] = useState(250);
  const [dispatchRadiusKm, setDispatchRadiusKm] = useState(8);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [smsGateway, setSmsGateway] = useState('Jazz Enterprise OTP');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <ProtectedRoute allowedRole="admin">
      <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col font-sans transition-colors duration-200">
        <Navbar />

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs text-theme-secondary mb-1">
              <Link href="/admin/dashboard" className="hover:text-theme-primary transition">
                {isUrdu ? 'ڈیش بورڈ' : 'Admin Hub'}
              </Link>
              <span>/</span>
              <span className="text-theme-primary font-bold">{isUrdu ? 'ترتیبات' : 'System Settings'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-theme-text">
              {isUrdu ? 'پلیٹ فارم اور سروس کنفیگریشن' : 'Platform Operations & Display Configuration'}
            </h1>
            <p className="text-sm text-theme-secondary mt-1">
              {isUrdu
                ? 'ڈسپلے تھیم، اے آئی کی درجہ بندی کی درستگی، ڈسپیچ کا دائرہ، اور سیکیورٹی کی ترتیبات تبدیل کریں۔'
                : 'Fine-tune display appearance (Light, Dark, System Default), computer vision thresholds, and geofencing radius.'}
            </p>
          </div>

          <form onSubmit={handleSave} className="bg-theme-surface rounded-3xl border border-theme-border p-6 sm:p-8 shadow-xs space-y-6 transition-colors">
            
            {/* Display & Visual Appearance Theme Switcher */}
            <div>
              <h3 className="text-sm font-bold text-theme-text flex items-center gap-2 border-b border-theme-border/60 pb-3 mb-4">
                <Palette className="w-4 h-4 text-theme-primary" />
                <span>{isUrdu ? 'پلیٹ فارم ڈسپلے تھیم' : 'Platform Theme & Appearance'}</span>
              </h3>

              <div className="space-y-2">
                <p className="text-xs text-theme-secondary mb-3">
                  {isUrdu 
                    ? 'اپنی پسند کا تھیم منتخب کریں یا سسٹم ڈیفالٹ کے ساتھ خودکار مطابقت رکھیں:'
                    : 'Choose your preferred visual mode or sync automatically with your operating system:'}
                </p>
                <ThemeSwitcher variant="full" />
              </div>
            </div>

            {/* AI Classification Settings */}
            <div className="pt-4 border-t border-theme-border/60">
              <h3 className="text-sm font-bold text-theme-text flex items-center gap-2 border-b border-theme-border/60 pb-3 mb-4">
                <Cpu className="w-4 h-4 text-theme-primary" />
                <span>AI Computer Vision Engine</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1 text-xs font-bold text-theme-text">
                    <span>Minimum Classification Confidence Threshold</span>
                    <span className="font-mono text-theme-primary font-bold">{aiConfidenceThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="99"
                    value={aiConfidenceThreshold}
                    onChange={(e) => setAiConfidenceThreshold(Number(e.target.value))}
                    className="w-full accent-theme-primary h-2 bg-theme-bg rounded-lg cursor-pointer"
                  />
                  <p className="text-[11px] text-theme-secondary mt-1">
                    Uploaded waste photos scoring below this threshold are routed to human inspection.
                  </p>
                </div>
              </div>
            </div>

            {/* Logistics & Dispatch Radius */}
            <div className="pt-4 border-t border-theme-border/60">
              <h3 className="text-sm font-bold text-theme-text flex items-center gap-2 mb-4">
                <Sliders className="w-4 h-4 text-theme-primary" />
                <span>Dispatch & Geofencing Parameters</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-theme-secondary mb-1">
                    Max Collector Radial Search (km)
                  </label>
                  <input
                    type="number"
                    value={dispatchRadiusKm}
                    onChange={(e) => setDispatchRadiusKm(Number(e.target.value))}
                    className="w-full bg-theme-input border border-theme-border rounded-xl px-3.5 py-2.5 text-xs text-theme-text focus:outline-none focus:border-theme-primary font-mono min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-theme-secondary mb-1">
                    Max Household Batch Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={maxPickupWeightKg}
                    onChange={(e) => setMaxPickupWeightKg(Number(e.target.value))}
                    className="w-full bg-theme-input border border-theme-border rounded-xl px-3.5 py-2.5 text-xs text-theme-text focus:outline-none focus:border-theme-primary font-mono min-h-[44px]"
                  />
                </div>
              </div>
            </div>

            {/* Telecom & SMS OTP Gateway */}
            <div className="pt-4 border-t border-theme-border/60">
              <h3 className="text-sm font-bold text-theme-text flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-theme-primary" />
                <span>SMS OTP Gateway Provider</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {['Jazz Enterprise OTP', 'Telenor Connect Gateway', 'Twilio International'].map((gw) => (
                  <button
                    type="button"
                    key={gw}
                    onClick={() => setSmsGateway(gw)}
                    className={`min-h-[48px] p-3 rounded-xl border text-xs font-bold transition text-center ${
                      smsGateway === gw
                        ? 'bg-theme-soft-mint border-theme-primary text-theme-primary ring-2 ring-theme-primary/20'
                        : 'bg-theme-surface border-theme-border text-theme-secondary hover:border-theme-primary/40'
                    }`}
                  >
                    {gw}
                  </button>
                ))}
              </div>
            </div>

            {/* Maintenance Mode */}
            <div className="pt-4 border-t border-theme-border/60 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-theme-text">Maintenance Mode</h4>
                <p className="text-[11px] text-theme-secondary">Temporarily pause new customer booking intakes for system upgrade.</p>
              </div>
              <button
                type="button"
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`w-14 h-8 flex items-center rounded-full p-1 transition duration-300 min-h-[44px] min-w-[44px] ${
                  maintenanceMode ? 'bg-theme-primary justify-end' : 'bg-theme-border justify-start'
                }`}
                aria-label="Toggle maintenance mode"
              >
                <div className="bg-white w-6 h-6 rounded-full shadow-md" />
              </button>
            </div>

            <div className="pt-4 border-t border-theme-border/60 flex items-center justify-between">
              {saved ? (
                <span className="text-xs font-bold text-theme-primary flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Platform configuration updated!</span>
                </span>
              ) : <span />}

              <button
                type="submit"
                className="inline-flex items-center space-x-2 rtl:space-x-reverse px-6 py-3 rounded-xl bg-theme-primary hover:opacity-95 text-white font-bold text-xs transition shadow-md min-h-[44px]"
              >
                <Save className="w-4 h-4" />
                <span>Save Configuration</span>
              </button>
            </div>
          </form>
        </main>
      </div>
    </ProtectedRoute>
  );
}
