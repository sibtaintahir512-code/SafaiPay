'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/context/LanguageContext';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  MoreVertical,
  UserCheck,
  Building,
  Truck,
  User
} from 'lucide-react';

interface UserRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: 'customer' | 'collector' | 'recycler' | 'admin';
  status: 'active' | 'suspended';
  verified: boolean;
  joinDate: string;
}

const INITIAL_USERS: UserRecord[] = [
  { id: 'usr-1', name: 'Super Administrator', phone: '+923000000000', email: 'admin@safaipay.org', role: 'admin', status: 'active', verified: true, joinDate: '2026-01-01' },
  { id: 'usr-2', name: 'PECHS Resident Community', phone: '+923001110001', email: 'household@safaipay.org', role: 'customer', status: 'active', verified: true, joinDate: '2026-02-14' },
  { id: 'usr-3', name: 'Rashid Khan (Fleet #4)', phone: '+923002220001', email: 'collector@safaipay.org', role: 'collector', status: 'active', verified: true, joinDate: '2026-02-18' },
  { id: 'usr-4', name: 'Pak Polymers Ltd', phone: '+923003330001', email: 'recycler@safaipay.org', role: 'recycler', status: 'active', verified: true, joinDate: '2026-03-01' },
  { id: 'usr-5', name: 'Imran Ali (Fleet #12)', phone: '+923002220002', email: 'imran.ali@safaipay.org', role: 'collector', status: 'active', verified: true, joinDate: '2026-03-10' },
  { id: 'usr-6', name: 'Clifton Green Residence', phone: '+923001110002', email: 'clifton@safaipay.org', role: 'customer', status: 'active', verified: true, joinDate: '2026-03-22' },
];

export default function AdminUsersPage() {
  const { isUrdu } = useLanguage();
  const [users, setUsers] = useState<UserRecord[]>(INITIAL_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const toggleUserStatus = (id: string) => {
    setUsers(users.map((u) => {
      if (u.id === id) {
        return { ...u, status: u.status === 'active' ? 'suspended' : 'active' };
      }
      return u;
    }));
  };

  const filtered = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.phone.includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  const getRoleBadge = (role: UserRecord['role']) => {
    switch (role) {
      case 'admin':
        return <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded-full font-bold">Admin</span>;
      case 'collector':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-bold">Collector</span>;
      case 'recycler':
        return <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold">Recycler</span>;
      default:
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold">Customer</span>;
    }
  };

  return (
    <ProtectedRoute allowedRole="admin">
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
                <Link href="/admin/dashboard" className="hover:text-purple-600 transition">
                  {isUrdu ? 'ڈیش بورڈ' : 'Admin Hub'}
                </Link>
                <span>/</span>
                <span className="text-purple-700 font-bold">{isUrdu ? 'صارفین' : 'User Management'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {isUrdu ? 'صارفین، رولز اور سیکیورٹی کی توثیق' : 'Users, Roles & Biometric Identity Verification'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {isUrdu
                  ? 'تمام شہریوں، کولیکٹرز، اور صنعتی ری سائیکلرز کے کھاتوں کی تصدیق اور رسائی کا انتظام کریں۔'
                  : 'Manage role-based privileges, NADRA biometric verification badges, and account locks.'}
              </p>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 mb-6 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-400" />
              {['all', 'customer', 'collector', 'recycler', 'admin'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition capitalize ${
                    roleFilter === r ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-5">User</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4">Assigned Role</th>
                    <th className="py-3.5 px-4">KYC / Verification</th>
                    <th className="py-3.5 px-4">Member Since</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.id}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-800">{u.phone}</div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </td>
                      <td className="py-3.5 px-4">{getRoleBadge(u.role)}</td>
                      <td className="py-3.5 px-4">
                        {u.verified ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Verified
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium text-[11px]">Pending KYC</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{u.joinDate}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => toggleUserStatus(u.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            u.status === 'active' ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
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
