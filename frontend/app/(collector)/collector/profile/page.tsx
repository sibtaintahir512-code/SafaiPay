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
  Truck,
  User,
  Phone,
  ShieldCheck,
  CreditCard,
  Scale,
  Save,
  CheckCircle2,
  MapPin,
  Palette,
  KeyRound,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export default function CollectorProfilePage() {
  const { user, updateUser } = useAuth();
  const { isUrdu } = useLanguage();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [vehicleType, setVehicleType] = useState('Motorized Cargo Tricycle');
  const [vehicleNumber, setVehicleNumber] = useState('KHI-LE-9042');
  const [operatingZone, setOperatingZone] = useState('Karachi South & East (PECHS, Clifton, Saddar)');
  const [scaleSerial, setScaleSerial] = useState('SCALE-KHI-402 (Bluetooth Calibrated)');
  const [walletPhone, setWalletPhone] = useState('03002220001');

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
      setFullName(user.full_name || '');
      setPhone(user.phone_number || '');
      if (user.profile?.service_area) {
        setOperatingZone(user.profile.service_area);
      }
      if (user.profile?.vehicle_type) {
        setVehicleType(user.profile.vehicle_type);
      }
      if (user.profile?.payout_account) {
        setWalletPhone(user.profile.payout_account);
      }
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    if (!fullName.trim() || fullName.trim().length < 2) {
      setSaveError(isUrdu ? 'پورا نام کم از کم 2 حروف پر مشتمل ہونا چاہیے۔' : 'Full name must be at least 2 characters.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const updated = await updateUserProfile({
        full_name: fullName.trim(),
        service_area: operatingZone.trim(),
        payout_account: walletPhone.trim(),
      });
      updateUser(updated);
      setSaveSuccess(isUrdu ? 'پروفائل کامیابی سے محفوظ ہوگئی!' : 'Collector profile updated successfully!');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update collector profile.');
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
    <ProtectedRoute allowedRole={['collector', 'admin']}>
      <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col font-sans transition-colors duration-200">
        <Navbar />

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs text-theme-secondary mb-1">
              <Link href="/collector/dashboard" className="hover:text-theme-primary transition">
                {isUrdu ? 'ڈیش بورڈ' : 'Dashboard'}
              </Link>
              <span>/</span>
              <span className="text-theme-primary font-bold">{isUrdu ? 'پروفائل' : 'Collector Profile'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-theme-text">
              {isUrdu ? 'کولیکٹر تصدیق شدہ پروفائل' : 'Collector Verified Profile & Equipment'}
            </h1>
            <p className="text-xs sm:text-sm text-theme-secondary mt-1">
              {isUrdu
                ? 'ڈسپلے تھیم، گاڑی کی تفصیلات، وزنی ترازو کی کیلیبریشن اور کمیشن والٹ کا انتظام کریں۔'
                : 'Manage display appearance, vehicle registration, smart scale IoT calibration, and payout wallet.'}
            </p>
          </div>

          <div className="space-y-6">
            {/* Appearance / Theme Switcher Card */}
            <div className="bg-theme-surface p-6 sm:p-8 rounded-3xl border border-theme-border shadow-xs space-y-4 transition-colors">
              <h3 className="text-base font-bold text-theme-text flex items-center gap-2 border-b border-theme-border/60 pb-3">
                <Palette className="w-4 h-4 text-theme-primary" />
                <span>{isUrdu ? 'پلیٹ فارم ڈسپلے تھیم' : 'Theme & Visual Appearance'}</span>
              </h3>
              <p className="text-xs text-theme-secondary">
                {isUrdu
                  ? 'دھوپ میں یا رات کے وقت آسانی کے لیے موزوں تھیم منتخب کریں:'
                  : 'Optimize screen contrast for high-glare daytime routes or night hours:'}
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

            {/* Profile & Vehicle Information Form */}
            <form onSubmit={handleSave} className="bg-theme-surface p-6 sm:p-8 rounded-3xl border border-theme-border shadow-xs space-y-6 transition-colors">
              <h3 className="text-base font-bold text-theme-text flex items-center gap-2 border-b border-theme-border/60 pb-3">
                <User className="w-4 h-4 text-theme-primary" />
                <span>Personal & Equipment Credentials</span>
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
                  <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary min-h-[48px] sm:min-h-[52px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">Phone Number (Verified)</label>
                  <input
                    type="text"
                    value={phone}
                    disabled
                    className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-xs text-theme-secondary cursor-not-allowed font-mono min-h-[48px] sm:min-h-[52px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">Operating Territory</label>
                  <input
                    type="text"
                    value={operatingZone}
                    onChange={(e) => setOperatingZone(e.target.value)}
                    className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary min-h-[48px] sm:min-h-[52px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">Payout Wallet Mobile Number</label>
                  <input
                    type="text"
                    value={walletPhone}
                    onChange={(e) => setWalletPhone(e.target.value)}
                    className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-xs text-theme-text font-mono focus:outline-none focus:border-theme-primary min-h-[48px] sm:min-h-[52px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">Vehicle Classification</label>
                  <input
                    type="text"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary min-h-[48px] sm:min-h-[52px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">Digital Scale Serial</label>
                  <input
                    type="text"
                    value={scaleSerial}
                    onChange={(e) => setScaleSerial(e.target.value)}
                    className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-xs text-theme-text font-mono focus:outline-none focus:border-theme-primary min-h-[48px] sm:min-h-[52px]"
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
                  <span>Save Collector Profile</span>
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
