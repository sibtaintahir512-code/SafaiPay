'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SafaiPayLogo } from '@/components/SafaiPayLogo';
import { 
  UserCheck, 
  ArrowRight, 
  ShieldCheck, 
  Phone, 
  Lock, 
  User as UserIcon, 
  Mail, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<'customer' | 'collector' | 'recycler'>('customer');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!fullName.trim() || !phone.trim() || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    // Normalize phone number to E.164 (+92...)
    let cleanPhone = phone.trim().replace(/\s+/g, '');
    if (cleanPhone.startsWith('03')) {
      cleanPhone = '+92' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('+92')) {
      cleanPhone = '+92' + cleanPhone;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: cleanPhone,
          full_name: fullName.trim(),
          email: email.trim() || null,
          password: password,
          role: role.toUpperCase(),
        }),
      });

      if (!res.ok) {
        let msg = 'Registration failed. Please check your information.';
        try {
          const err = await res.json();
          msg = err.detail || err.message || msg;
        } catch {}
        throw new Error(msg);
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.replace('/login');
      }, 1800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. An account with this phone or email may already exist.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4FAF7] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#D5E6DD] p-7 sm:p-9 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <SafaiPayLogo size="lg" className="justify-center" />
          <h2 className="text-2xl font-extrabold text-[#0F3D3E] tracking-tight">Create Account</h2>
          <p className="text-xs text-[#5B6B66]">Join Pakistan’s verified circular waste network</p>
        </div>

        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-[#C0392B] rounded-2xl text-xs font-medium flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-[#C0392B] shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="p-6 bg-[#E6F4EC] border border-[#D5E6DD] rounded-2xl text-center space-y-2.5">
            <ShieldCheck className="w-10 h-10 text-[#1B7F5C] mx-auto" />
            <p className="text-sm font-bold text-[#0F3D3E]">Registration Successful!</p>
            <p className="text-xs text-[#3F5A52]">
              Your account has been created. Redirecting you to the sign-in portal...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0F3D3E] uppercase tracking-wider mb-1.5">
                Select Your Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['customer', 'collector', 'recycler'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition border ${
                      role === r
                        ? 'bg-[#1B7F5C] text-white border-[#1B7F5C] shadow-xs'
                        : 'bg-[#F4FAF7] text-[#0F3D3E] border-[#D5E6DD] hover:bg-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F3D3E] uppercase tracking-wider mb-1">
                Full Name / Organization
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Mehmood"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-[#F4FAF7] border border-[#D5E6DD] rounded-xl px-3.5 py-2.5 text-xs text-[#0F3D3E] placeholder-[#8A9A95] focus:outline-none focus:border-[#1B7F5C] focus:bg-white transition"
                />
                <UserIcon className="w-4 h-4 text-[#5B6B66] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F3D3E] uppercase tracking-wider mb-1">
                Mobile Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="+92 300 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-[#F4FAF7] border border-[#D5E6DD] rounded-xl px-3.5 py-2.5 text-xs text-[#0F3D3E] placeholder-[#8A9A95] focus:outline-none focus:border-[#1B7F5C] focus:bg-white transition"
                />
                <Phone className="w-4 h-4 text-[#5B6B66] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F3D3E] uppercase tracking-wider mb-1">
                Email Address (Optional)
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-[#F4FAF7] border border-[#D5E6DD] rounded-xl px-3.5 py-2.5 text-xs text-[#0F3D3E] placeholder-[#8A9A95] focus:outline-none focus:border-[#1B7F5C] focus:bg-white transition"
                />
                <Mail className="w-4 h-4 text-[#5B6B66] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F3D3E] uppercase tracking-wider mb-1">
                Password (Min 8 Characters)
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-[#F4FAF7] border border-[#D5E6DD] rounded-xl px-3.5 py-2.5 text-xs text-[#0F3D3E] placeholder-[#8A9A95] focus:outline-none focus:border-[#1B7F5C] focus:bg-white transition"
                />
                <Lock className="w-4 h-4 text-[#5B6B66] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1B7F5C] hover:bg-[#146B4D] text-white font-extrabold py-3.5 rounded-xl text-xs transition shadow-md shadow-[#1B7F5C]/25 flex items-center justify-center space-x-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-[#D5E6DD]">
          <Link href="/login" className="text-xs text-[#1B7F5C] hover:text-[#146B4D] font-bold">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
