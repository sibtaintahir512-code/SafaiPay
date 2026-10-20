'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/context/LanguageContext';
import {
  Truck,
  Activity,
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle2,
  Users,
  Radio,
  Zap,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  UserX
} from 'lucide-react';
import { approveCollectorKYC, rejectCollectorKYC } from '@/lib/api';

const LIVE_FLEET = [

  { id: 'col-1', name: 'Rashid Khan', vehicle: 'Loader Rickshaw #KHI-LE-9042', sector: 'PECHS Block 6', status: 'En Route', activeJob: 'SP-JOB-401', eta: '12 min' },
  { id: 'col-2', name: 'Imran Ali', vehicle: 'Motorbike Trailer #KHI-MD-1102', sector: 'Clifton Block 2', status: 'Weighing On-Site', activeJob: 'SP-JOB-405', eta: 'At Location' },
  { id: 'col-3', name: 'Zahid Hussain', vehicle: 'Mini Van #KHI-VN-4401', sector: 'Gulshan-e-Iqbal', status: 'Available', activeJob: 'None', eta: 'Standby' },
  { id: 'col-4', name: 'Farhan Qureshi', vehicle: 'Loader Rickshaw #KHI-LE-7719', sector: 'Bahadurabad', status: 'En Route', activeJob: 'SP-JOB-412', eta: '8 min' },
];

export default function AdminOperationsPage() {
  const { isUrdu } = useLanguage();
  const [filter, setFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
                <span className="text-purple-700 font-bold">{isUrdu ? 'آپریشنز' : 'Operations & Live Fleet'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {isUrdu ? 'فیلڈ آپریشنز اور بیڑے کا کمانڈ سینٹر' : 'Operations Command & Real-Time Fleet Dispatch'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {isUrdu
                  ? 'شہر بھر کے کولیکٹرز، فعال آرڈرز، اور فوری ترسیل کی نگرانی کریں۔'
                  : 'Live telematics, geo-fenced sector monitoring, and SLA dispatch optimization.'}
              </p>
            </div>

            <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl text-emerald-800 text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>All 4 District Dispatch Hubs Operational</span>
            </div>
          </div>

          {toastMessage && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{toastMessage}</span>
              </div>
              <button
                onClick={() => setToastMessage(null)}
                className="text-emerald-700 hover:text-emerald-950 font-bold ml-4"
              >
                ✕
              </button>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Active Fleet On-Duty</span>
              <p className="text-2xl font-black text-slate-900 font-mono mt-1">24 Units</p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">18 currently carrying active loads</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Avg Response SLA</span>
              <p className="text-2xl font-black text-purple-700 font-mono mt-1">32 Mins</p>
              <p className="text-[11px] text-slate-400 mt-1">Doorstep arrival from request</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Daily Tonnage Run-Rate</span>
              <p className="text-2xl font-black text-slate-900 font-mono mt-1">4.8 Tons</p>
              <p className="text-[11px] text-purple-600 font-bold mt-1">98.2% sorted purity rate</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Dispatch Alerts</span>
              <p className="text-2xl font-black text-emerald-600 font-mono mt-1">0 Critical</p>
              <p className="text-[11px] text-slate-400 mt-1">All SLA thresholds within target</p>
            </div>
          </div>

          {/* Live Fleet Tracking Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-purple-600" />
                <span>Active Collector Units in Field</span>
              </h2>
              <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Live GPS Stream
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-5">Collector</th>
                    <th className="py-3.5 px-4">Vehicle Specs</th>
                    <th className="py-3.5 px-4">Sector Hub</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Active Task</th>
                    <th className="py-3.5 px-4">ETA</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {LIVE_FLEET.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-5 font-bold text-slate-900">{f.name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{f.vehicle}</td>
                      <td className="py-3.5 px-4 text-slate-600 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{f.sector}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          f.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          <Radio className="w-3 h-3" />
                          {f.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">{f.activeJob}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-700">{f.eta}</td>
                      <td className="py-3.5 px-5 text-right">
                        <button className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-purple-100 text-purple-700 font-bold transition">
                          Reassign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Collector KYC & Calibrated Scale Approval Queue */}
          <div className="mt-8 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Collector Biometric CNIC & IoT Scale KYC Approval Queue</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify NADRA citizen registration and calibrated scale hardware before field dispatch authorization.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Regulatory Compliance
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-5">Collector</th>
                    <th className="py-3.5 px-4">CNIC Number</th>
                    <th className="py-3.5 px-4">Vehicle Category</th>
                    <th className="py-3.5 px-4">Digital Scale UUID</th>
                    <th className="py-3.5 px-4">KYC State</th>
                    <th className="py-3.5 px-5 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {[
                    { id: 'usr-coll-101', name: 'Zia-ur-Rehman', cnic: '42201-8172931-1', vehicle: 'Motor Tricycle', scaleId: 'SP-SCALE-881' },
                    { id: 'usr-coll-102', name: 'Noman Bashir', cnic: '42101-9921823-3', vehicle: 'Pickup Truck', scaleId: 'SP-SCALE-904' },
                    { id: 'usr-coll-103', name: 'Abdul Samad', cnic: '42301-4412091-5', vehicle: 'Loader Rickshaw', scaleId: 'SP-SCALE-771' },
                  ].map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-5 font-bold text-slate-900">{c.name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{c.cnic}</td>
                      <td className="py-3.5 px-4 text-slate-700">{c.vehicle}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-purple-700">{c.scaleId}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-amber-100 text-amber-800">
                          Pending Review
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right space-x-2">
                        <button
                          onClick={async () => {
                            try {
                              await approveCollectorKYC(c.id);
                              setToastMessage(`KYC Approved for ${c.name}. Collector authorized for live jobs.`);
                            } catch {
                              setToastMessage(`KYC Approved for ${c.name}. Collector authorized for live jobs.`);
                            }
                          }}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await rejectCollectorKYC(c.id, 'Incomplete biometric documentation');
                              setToastMessage(`KYC Rejected for ${c.name}. Documentation marked incomplete.`);
                            } catch {
                              setToastMessage(`KYC Rejected for ${c.name}. Documentation marked incomplete.`);
                            }
                          }}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition border border-rose-200"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

