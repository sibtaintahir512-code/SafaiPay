'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/context/LanguageContext';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Eye,
  Scale,
  Camera,
  MapPin,
  Lock
} from 'lucide-react';

interface FraudAlertItem {
  id: string;
  type: string;
  severity: 'high' | 'medium' | 'low';
  collector: string;
  pickupId: string;
  deviation: string;
  status: 'active' | 'resolved' | 'dismissed';
  time: string;
}

const FRAUD_ALERTS_INITIAL: FraudAlertItem[] = [
  {
    id: 'ALT-101',
    type: 'Abnormal Weight Variance',
    severity: 'high',
    collector: 'Zahid Hussain (ID #COL-8)',
    pickupId: 'SP-JOB-340',
    deviation: 'Est: 10 kg vs Weighed: 88 kg (+780% anomaly)',
    status: 'active',
    time: '24 mins ago'
  },
  {
    id: 'ALT-102',
    type: 'Duplicate Photo Hash Detected',
    severity: 'medium',
    collector: 'Tariq Mehmood (ID #COL-19)',
    pickupId: 'SP-JOB-328',
    deviation: 'Scale image byte-hash matches previous job SP-JOB-312',
    status: 'active',
    time: '2 hours ago'
  },
  {
    id: 'ALT-103',
    type: 'GPS Telemetry Mismatch',
    severity: 'low',
    collector: 'Imran Ali (ID #COL-12)',
    pickupId: 'SP-JOB-305',
    deviation: 'Weighing timestamp logged 1.8km outside customer geo-fence',
    status: 'resolved',
    time: 'Yesterday'
  }
];

export default function AdminFraudAlertsPage() {
  const { isUrdu } = useLanguage();
  const [alerts, setAlerts] = useState<FraudAlertItem[]>(FRAUD_ALERTS_INITIAL);
  const [actionDone, setActionDone] = useState<string | null>(null);

  const resolveAlert = (id: string, newStatus: 'resolved' | 'dismissed') => {
    setAlerts(alerts.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
    setActionDone(`Alert ${id} marked as ${newStatus}`);
    setTimeout(() => setActionDone(null), 2500);
  };

  return (
    <ProtectedRoute allowedRole="admin">
      <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col font-sans transition-colors duration-200">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
                <Link href="/admin/dashboard" className="hover:text-purple-600 transition">
                  {isUrdu ? 'ڈیش بورڈ' : 'Admin Hub'}
                </Link>
                <span>/</span>
                <span className="text-purple-700 font-bold">{isUrdu ? 'فراڈ اور مشکوک الرٹس' : 'Fraud & Anomaly Guard'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {isUrdu ? 'اے آئی اینوملی ڈیٹیکشن اور وزنی فراڈ کے الرٹس' : 'AI Anomaly Detection & Weight Verification Guard'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {isUrdu
                  ? 'کمپیوٹر ویژن اسکیل آڈٹ، جغرافیائی حدود، اور غیر معمولی اوزان کی خودکار جانچ۔'
                  : 'Automated computer vision duplicate checking, geo-fence deviations, and abnormal weight spikes.'}
              </p>
            </div>
          </div>

          {actionDone && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{actionDone}</span>
            </div>
          )}

          {/* Alerts List */}
          <div className="space-y-4">
            {alerts.map((alt) => (
              <div
                key={alt.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-2xl shrink-0 ${
                    alt.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    <AlertTriangle className="w-6 h-6" />
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-500">{alt.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        alt.severity === 'high' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {alt.severity} Risk
                      </span>
                      <span className="text-xs text-slate-400">• {alt.time}</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mt-1">{alt.type}</h3>
                    <p className="text-xs text-slate-600 mt-1">{alt.deviation}</p>

                    <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                      <span>Collector: <strong className="text-slate-800">{alt.collector}</strong></span>
                      <span>Job: <strong className="text-purple-700 font-mono">{alt.pickupId}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  {alt.status === 'active' ? (
                    <>
                      <button
                        onClick={() => resolveAlert(alt.id, 'resolved')}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-sm"
                      >
                        Investigate & Freeze Wallet
                      </button>
                      <button
                        onClick={() => resolveAlert(alt.id, 'dismissed')}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                      >
                        Dismiss False Alert
                      </button>
                    </>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      {alt.status.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
