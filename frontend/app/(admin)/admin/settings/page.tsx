'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
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
  Globe
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
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        <Navbar />

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
              <Link href="/admin/dashboard" className="hover:text-purple-600 transition">
                {isUrdu ? 'ڈیش بورڈ' : 'Admin Hub'}
              </Link>
              <span>/</span>
              <span className="text-purple-700 font-bold">{isUrdu ? 'ترتیبات' : 'System Settings'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {isUrdu ? 'پلیٹ فارم اور سروس کنفیگریشن' : 'Platform Operations & AI Configuration'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {isUrdu
                ? 'اے آئی کی درجہ بندی کی درستگی، ڈسپیچ کا دائرہ، اور سیکیورٹی کی ترتیبات تبدیل کریں۔'
                : 'Fine-tune computer vision classification confidence, geo-fencing radius, and SMS gateway.'}
            </p>
          </div>

          <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            {/* AI Classification Settings */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <Cpu className="w-4 h-4 text-purple-600" />
                <span>AI Computer Vision Engine</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1 text-xs font-bold text-slate-700">
                    <span>Minimum Classification Confidence Threshold</span>
                    <span className="font-mono text-purple-700">{aiConfidenceThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="99"
                    value={aiConfidenceThreshold}
                    onChange={(e) => setAiConfidenceThreshold(Number(e.target.value))}
                    className="w-full accent-purple-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Uploaded waste photos scoring below this threshold are routed to human inspection.
                  </p>
                </div>
              </div>
            </div>

            {/* Logistics & Dispatch Radius */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Sliders className="w-4 h-4 text-purple-600" />
                <span>Dispatch & Geofencing Parameters</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Max Collector Radial Search (km)
                  </label>
                  <input
                    type="number"
                    value={dispatchRadiusKm}
                    onChange={(e) => setDispatchRadiusKm(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Max Household Batch Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={maxPickupWeightKg}
                    onChange={(e) => setMaxPickupWeightKg(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Telecom & SMS OTP Gateway */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-purple-600" />
                <span>SMS OTP Gateway Provider</span>
              </h3>

              <div className="grid grid-cols-3 gap-3">
                {['Jazz Enterprise OTP', 'Telenor Connect Gateway', 'Twilio International'].map((gw) => (
                  <button
                    type="button"
                    key={gw}
                    onClick={() => setSmsGateway(gw)}
                    className={`p-3 rounded-xl border text-xs font-bold transition text-center ${
                      smsGateway === gw
                        ? 'bg-purple-50 border-purple-600 text-purple-900 ring-2 ring-purple-600/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {gw}
                  </button>
                ))}
              </div>
            </div>

            {/* Maintenance Mode */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Maintenance Mode</h4>
                <p className="text-[11px] text-slate-500">Temporarily pause new customer booking intakes for system upgrade.</p>
              </div>
              <button
                type="button"
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                  maintenanceMode ? 'bg-purple-600 justify-end' : 'bg-slate-200 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              {saved ? (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Platform configuration updated!</span>
                </span>
              ) : <span />}

              <button
                type="submit"
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-md shadow-purple-600/20"
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
