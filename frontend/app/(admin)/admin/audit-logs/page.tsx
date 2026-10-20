'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/context/LanguageContext';
import {
  FileCode,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Terminal,
  Activity
} from 'lucide-react';

interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  ipAddress: string;
  status: 'SUCCESS' | 'WARN' | 'BLOCKED';
}

const AUDIT_EVENTS: AuditEvent[] = [
  { id: 'EVT-9001', timestamp: '2026-10-20 01:24:12', actor: 'admin@safaipay.org', action: 'UPDATE_PRICING_BENCHMARK', target: 'PET_PLASTIC -> Rs 80/kg', ipAddress: '192.168.1.45', status: 'SUCCESS' },
  { id: 'EVT-9002', timestamp: '2026-10-20 01:15:02', actor: 'SYSTEM_IOT_BRIDGE', action: 'SCALE_CALIBRATION_CHECK', target: 'SP-SCALE-8841 (±0.01kg)', ipAddress: '10.0.4.12', status: 'SUCCESS' },
  { id: 'EVT-9003', timestamp: '2026-10-20 00:54:33', actor: '+923002220001', action: 'COLLECTOR_WEIGH_SUBMIT', target: 'Job SP-JOB-401 (18.5kg)', ipAddress: '175.107.20.14', status: 'SUCCESS' },
  { id: 'EVT-9004', timestamp: '2026-10-19 23:40:11', actor: 'DISBURSEMENT_GATEWAY', action: 'EASYPAISA_PAYOUT_INITIATED', target: 'Txn EP-9028192831 (Rs 1,480)', ipAddress: '10.0.8.2', status: 'SUCCESS' },
  { id: 'EVT-9005', timestamp: '2026-10-19 22:18:49', actor: 'ANOMALY_ENGINE', action: 'FRAUD_FLAG_RAISED', target: 'Job SP-JOB-340 (+780% Weight)', ipAddress: '10.0.12.8', status: 'WARN' },
  { id: 'EVT-9006', timestamp: '2026-10-19 21:05:14', actor: 'UNKNOWN_IP', action: 'FAILED_ADMIN_AUTH', target: '/admin/settings (Invalid token)', ipAddress: '103.255.4.19', status: 'BLOCKED' },
];

export default function AdminAuditLogsPage() {
  const { isUrdu } = useLanguage();
  const [events] = useState<AuditEvent[]>(AUDIT_EVENTS);
  const [filter, setFilter] = useState('all');

  const filtered = events.filter((e) => {
    if (filter === 'all') return true;
    return e.status === filter;
  });

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
                <span className="text-purple-700 font-bold">{isUrdu ? 'سیکیورٹی آڈٹ لاگز' : 'Audit Logs'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {isUrdu ? 'ناقابل تغیر سیکیورٹی آڈٹ لاگز' : 'Immutable Security & Operations Audit Trail'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {isUrdu
                  ? 'سسٹم کی ہر کارروائی، قیمتوں میں تبدیلی، اور مالیاتی ٹرانزیکشن کا مصدقہ ریکارڈ۔'
                  : 'Tamper-evident system access, pricing changes, KYC verifications, and financial disbursement events.'}
              </p>
            </div>

            <div className="flex items-center space-x-2 bg-purple-50 border border-purple-200 px-4 py-2 rounded-2xl text-purple-900 text-xs font-mono font-bold">
              <Shield className="w-4 h-4 text-purple-600" />
              <span>SHA-256 Ledger Sealed</span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-slate-400" />
                {['all', 'SUCCESS', 'WARN', 'BLOCKED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition uppercase ${
                      filter === st ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-500 font-mono">{filtered.length} Recorded Events</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-5">Event ID</th>
                    <th className="py-3.5 px-4">Timestamp (UTC+5)</th>
                    <th className="py-3.5 px-4">Actor</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Resource Target</th>
                    <th className="py-3.5 px-4">IP Address</th>
                    <th className="py-3.5 px-5 text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filtered.map((evt) => (
                    <tr key={evt.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-5 font-mono font-bold text-purple-700">{evt.id}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{evt.timestamp}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{evt.actor}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700">{evt.action}</td>
                      <td className="py-3.5 px-4 text-slate-600">{evt.target}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{evt.ipAddress}</td>
                      <td className="py-3.5 px-5 text-right">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          evt.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : evt.status === 'WARN'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {evt.status}
                        </span>
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
