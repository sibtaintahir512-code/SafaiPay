'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/types';
import { UserCheck, Truck, Factory, LogOut, ArrowRight, ShieldAlert } from 'lucide-react';

export default function OnboardingPage() {
  const { user, logout, switchRole } = useAuth();
  const router = useRouter();

  const handleSelectSafeRole = (selectedRole: UserRole) => {
    switchRole(selectedRole);
    router.push(`/${selectedRole}/dashboard`);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#F4FAF7] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-xl bg-white border border-[#D5E6DD] rounded-3xl p-8 sm:p-10 shadow-xl shadow-[#0F3D3E]/5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#E6F4EC] border border-[#D5E6DD] text-[#146B4D] flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <h1 className="text-2xl font-bold text-[#0F3D3E] mb-2">
          SafaiPay Account Setup
        </h1>
        <p className="text-xs text-[#5B6B66] mb-6 max-w-md mx-auto">
          {user ? `Welcome ${user.full_name}! ` : ''}Please select your participant profile below to proceed to your dedicated portal.
        </p>

        <div className="space-y-3 text-left mb-6">
          <button
            onClick={() => handleSelectSafeRole('customer')}
            className="w-full p-4 rounded-2xl border border-[#D5E6DD] hover:border-[#1B7F5C] hover:bg-[#E6F4EC]/60 transition flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#E6F4EC] text-[#146B4D] flex items-center justify-center group-hover:scale-105 transition">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0F3D3E]">Resident / Business Customer</p>
                <p className="text-xs text-[#5B6B66]">Book doorstep recyclable pickups and receive instant payouts</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#5B6B66] group-hover:text-[#1B7F5C] transition" />
          </button>

          <button
            onClick={() => handleSelectSafeRole('collector')}
            className="w-full p-4 rounded-2xl border border-[#D5E6DD] hover:border-[#1B7F5C] hover:bg-[#E6F4EC]/60 transition flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#E6F4EC] text-[#146B4D] flex items-center justify-center group-hover:scale-105 transition">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0F3D3E]">Verified Waste Collector</p>
                <p className="text-xs text-[#5B6B66]">Accept field collection jobs, weigh with digital scales, and track earnings</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#5B6B66] group-hover:text-[#1B7F5C] transition" />
          </button>

          <button
            onClick={() => handleSelectSafeRole('recycler')}
            className="w-full p-4 rounded-2xl border border-[#D5E6DD] hover:border-[#1B7F5C] hover:bg-[#E6F4EC]/60 transition flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#E6F4EC] text-[#146B4D] flex items-center justify-center group-hover:scale-105 transition">
                <Factory className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0F3D3E]">Industrial Recycler / Off-Taker</p>
                <p className="text-xs text-[#5B6B66]">Procure verified aggregated batches of post-consumer PET & OCC</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#5B6B66] group-hover:text-[#1B7F5C] transition" />
          </button>
        </div>

        <div className="pt-4 border-t border-[#D5E6DD]/60 flex items-center justify-between">
          <button
            onClick={handleLogout}
            className="text-xs font-semibold text-[#5B6B66] hover:text-rose-600 flex items-center space-x-1.5 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out to login screen</span>
          </button>
          <span className="text-[11px] text-[#5B6B66]">SafaiPay RBAC Gatekeeper</span>
        </div>
      </div>
    </div>
  );
}
