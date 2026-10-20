'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { updateUserProfile, changePassword } from '@/lib/api';
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
  Palette,
  KeyRound,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export default function RecyclerProfilePage() {
  const { user, updateUser } = useAuth();
  const { isUrdu } = useLanguage();

  const [companyName, setCompanyName] = useState(user?.profile?.organization_name || user?.recycler_profile?.company_name || 'Pak Green Polymers Ltd');
  const [ntnNumber, setNtnNumber] = useState('NTN-8942109-7');
  const [capacityTons, setCapacityTons] = useState(500);
  const [plantAddress, setPlantAddress] = useState('Plot 48, Sector 15, Korangi Industrial Area, Karachi');
  const [focalPerson, setFocalPerson] = useState(user?.full_name || 'Engr. Kamran Siddiqui');
  const [contactEmail, setContactEmail] = useState(user?.email || 'procurement@indusplastic.pk');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Change Password state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isPwSaving, setIsPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      if (user.full_name) setFocalPerson(user.full_name);
      if (user.email) setContactEmail(user.email);
      if (user.profile?.organization_name) setCompanyName(user.profile.organization_name);
      if (user.profile?.street_address) setPlantAddress(user.profile.street_address);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    if (!companyName.trim()) {
      setSaveError(isUrdu ? 'کمپنی کا نام درج کریں۔' : 'Please provide company name.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const updated = await updateUserProfile({
        full_name: focalPerson.trim(),
        email: contactEmail.trim() || null,
        company_name: companyName.trim(),
        address: plantAddress.trim(),
      });
      updateUser(updated);
      setSaveSuccess(isUrdu ? 'کارپوریٹ تفصیلات محفوظ ہو گئیں!' : 'Corporate profile saved successfully!');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update recycler profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPwSaving) return;

    if (!currentPw) {
      setPwError(isUrdu ? 'موجودہ پاس ورڈ درج کریں۔' : 'Please enter your current password.');
      return;
    }
    if (newPw.length < 8) {
      setPwError(isUrdu ? 'نیا پاس ورڈ کم از کم 8 حروف پر مشتمل ہونا چاہیے۔' : 'New password must be at least 8 characters.');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError(isUrdu ? 'پاس ورڈز مطابقت نہیں رکھتے۔' : 'New password and confirmation do not match.');
      return;
    }

    setIsPwSaving(true);
    setPwError(null);
    setPwSuccess(null);

    try {
      await changePassword({
        current_password: currentPw,
        new_password: newPw,
        confirm_new_password: confirmPw,
      });
      setPwSuccess(isUrdu ? 'پاس ورڈ کامیابی سے تبدیل ہو گیا!' : 'Password updated successfully!');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setTimeout(() => {
        setPwSuccess(null);
        setShowPasswordSection(false);
      }, 3000);
    } catch (err: any) {
      setPwError(err.message || 'Failed to change password. Please check your current password.');
    } finally {
      setIsPwSaving(false);
    }
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
            <p className="text-xs sm:text-sm text-theme-secondary mt-1">
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

            {/* Change Password Card */}
            <div className="bg-theme-surface p-6 sm:p-8 rounded-3xl border border-theme-border shadow-xs transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-theme-border/60 mb-4">
                <h3 className="text-base font-bold text-theme-text flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-theme-primary" />
                  <span>{isUrdu ? 'پاس ورڈ سیکیورٹی' : 'Account Password & Security'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                  className="px-3 py-1.5 rounded-xl bg-theme-soft-mint text-theme-primary text-xs font-bold hover:opacity-90 transition min-h-[36px]"
                >
                  {showPasswordSection ? (isUrdu ? 'چھپائیں' : 'Close') : (isUrdu ? 'تبدیل کریں' : 'Change Password')}
                </button>
              </div>

              {showPasswordSection && (
                <form onSubmit={handleChangePassword} className="space-y-4 animate-fadeIn">
                  {pwSuccess && (
                    <div className="p-3.5 bg-theme-soft-mint text-theme-primary rounded-xl text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{pwSuccess}</span>
                    </div>
                  )}

                  {pwError && (
                    <div className="p-3.5 bg-red-50 dark:bg-red-950/40 text-theme-error rounded-xl text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{pwError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">Current Password</label>
                      <div className="relative">
                        <input
                          type={showCurrentPw ? 'text' : 'password'}
                          required
                          value={currentPw}
                          onChange={(e) => setCurrentPw(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full bg-theme-input border border-theme-border rounded-xl pl-4 pr-11 rtl:pr-4 rtl:pl-11 py-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary min-h-[48px]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPw(!showCurrentPw)}
                          className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-3 rtl:pr-0 rtl:pl-3 flex items-center text-theme-secondary hover:text-theme-text min-h-[44px] min-w-[44px] justify-center"
                          aria-label={showCurrentPw ? 'Hide password' : 'Show password'}
                        >
                          {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPw ? 'text' : 'password'}
                          required
                          value={newPw}
                          onChange={(e) => setNewPw(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full bg-theme-input border border-theme-border rounded-xl pl-4 pr-11 rtl:pr-4 rtl:pl-11 py-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary min-h-[48px]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPw(!showNewPw)}
                          className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-3 rtl:pr-0 rtl:pl-3 flex items-center text-theme-secondary hover:text-theme-text min-h-[44px] min-w-[44px] justify-center"
                          aria-label={showNewPw ? 'Hide password' : 'Show password'}
                        >
                          {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPw ? 'text' : 'password'}
                          required
                          value={confirmPw}
                          onChange={(e) => setConfirmPw(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full bg-theme-input border border-theme-border rounded-xl pl-4 pr-11 rtl:pr-4 rtl:pl-11 py-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary min-h-[48px]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPw(!showConfirmPw)}
                          className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-3 rtl:pr-0 rtl:pl-3 flex items-center text-theme-secondary hover:text-theme-text min-h-[44px] min-w-[44px] justify-center"
                          aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isPwSaving}
                      className="px-6 py-2.5 rounded-xl bg-theme-primary text-white text-xs font-bold hover:opacity-95 transition shadow-sm min-h-[44px] flex items-center gap-2"
                    >
                      {isPwSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>{isUrdu ? 'پاس ورڈ محفوظ کریں' : 'Update Password'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            <form onSubmit={handleSave} className="bg-theme-surface p-6 sm:p-8 rounded-3xl border border-theme-border shadow-xs space-y-6 transition-colors">
              <h3 className="text-base font-bold text-theme-text flex items-center gap-2 border-b border-theme-border/60 pb-3">
                <Factory className="w-4 h-4 text-theme-primary" />
                <span>Industrial Plant & Legal Information</span>
              </h3>

              {saveSuccess && (
                <div className="p-3.5 bg-theme-soft-mint text-theme-primary rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{saveSuccess}</span>
                </div>
              )}

              {saveError && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/40 text-theme-error rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{saveError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">Company Registered Name</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary min-h-[48px] sm:min-h-[52px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">National Tax Number (NTN)</label>
                  <input
                    type="text"
                    value={ntnNumber}
                    onChange={(e) => setNtnNumber(e.target.value)}
                    className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-xs text-theme-text font-mono focus:outline-none focus:border-theme-primary min-h-[48px] sm:min-h-[52px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">Technical Focal Person</label>
                  <input
                    type="text"
                    value={focalPerson}
                    onChange={(e) => setFocalPerson(e.target.value)}
                    className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary min-h-[48px] sm:min-h-[52px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">Official Procurement Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary min-h-[48px] sm:min-h-[52px]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">Processing Facility Address</label>
                  <input
                    type="text"
                    value={plantAddress}
                    onChange={(e) => setPlantAddress(e.target.value)}
                    className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary min-h-[48px] sm:min-h-[52px]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-theme-border/60 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center space-x-2 rtl:space-x-reverse px-6 py-3 rounded-xl bg-theme-primary hover:opacity-95 text-white font-bold text-xs transition shadow-md min-h-[48px]"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
