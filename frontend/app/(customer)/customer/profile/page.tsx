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
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Award,
  CheckCircle2,
  ShieldCheck,
  Save,
  Trash2,
  Plus,
  Palette,
  KeyRound,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export default function CustomerProfilePage() {
  const { user, updateUser } = useAuth();
  const { isUrdu } = useLanguage();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [email, setEmail] = useState(user?.email || '');
  const [payoutMethod, setPayoutMethod] = useState<'easypaisa' | 'jazzcash' | 'bank'>('easypaisa');
  const [accountNumber, setAccountNumber] = useState('03001110001');
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

  const [addresses, setAddresses] = useState([
    { id: 1, title: 'Primary Residence', address: 'Falcon Complex, PECHS Block 6, Karachi', isDefault: true },
    { id: 2, title: 'Office', address: 'Plot 14-C, Shahrah-e-Faisal, Karachi', isDefault: false }
  ]);
  const [newAddressTitle, setNewAddressTitle] = useState('');
  const [newAddressText, setNewAddressText] = useState('');
  const [showAddAddress, setShowAddAddress] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone_number || '');
      setEmail(user.email || '');
      if (user.profile?.payout_method) {
        setPayoutMethod(user.profile.payout_method as any);
      }
      if (user.profile?.payout_account) {
        setAccountNumber(user.profile.payout_account);
      }
      if (user.profile?.street_address) {
        setAddresses((prev) => [
          { id: 1, title: 'Primary Residence', address: user.profile.street_address, isDefault: true },
          ...prev.slice(1)
        ]);
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
      const defaultAddr = addresses.find((a) => a.isDefault)?.address || addresses[0]?.address || '';
      const updated = await updateUserProfile({
        full_name: fullName.trim(),
        email: email.trim() || null,
        address: defaultAddr,
        payout_method: payoutMethod,
        payout_account: accountNumber.trim(),
      });
      updateUser(updated);
      setSaveSuccess(isUrdu ? 'پروفائل کامیابی سے محفوظ ہوگئی!' : 'Profile saved successfully!');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update profile.');
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

  const handleAddAddress = () => {
    if (!newAddressTitle.trim() || !newAddressText.trim()) return;
    setAddresses((prev) => [
      ...prev,
      { id: Date.now(), title: newAddressTitle.trim(), address: newAddressText.trim(), isDefault: false }
    ]);
    setNewAddressTitle('');
    setNewAddressText('');
    setShowAddAddress(false);
  };

  const handleDeleteAddress = (id: number) => {
    if (addresses.length <= 1) return;
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSetDefaultAddress = (id: number) => {
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, isDefault: a.id === id }))
    );
  };

  return (
    <ProtectedRoute allowedRole={['customer', 'admin']}>
      <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col font-sans transition-colors duration-200">
        <Navbar />

        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs text-theme-secondary mb-1">
              <Link href="/customer/dashboard" className="hover:text-theme-primary transition">
                {isUrdu ? 'ڈیش بورڈ' : 'Dashboard'}
              </Link>
              <span>/</span>
              <span className="text-theme-primary font-bold">{isUrdu ? 'پروفائل' : 'Profile & Settings'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-theme-text">
              {isUrdu ? 'کسٹمر پروفائل اور اکاؤنٹ' : 'Customer Account Profile'}
            </h1>
            <p className="text-xs sm:text-sm text-theme-secondary mt-1">
              {isUrdu
                ? 'اپنی رابطہ معلومات، ڈسپلے تھیم، محفوظ شدہ پتے، اور فوری ڈیجیٹل ادائیگی کے طریقے منظم کریں۔'
                : 'Manage verified contact details, display appearance theme, delivery addresses, and payout wallets.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Profile Card */}
            <div className="space-y-6">
              <div className="bg-theme-surface p-6 rounded-3xl border border-theme-border shadow-xs text-center transition-colors">
                <div className="w-20 h-20 bg-theme-soft-mint border-2 border-theme-border rounded-full flex items-center justify-center text-theme-primary font-black text-2xl mx-auto mb-4 overflow-hidden">
                  {user?.profile_photo_url ? (
                    <img src={user.profile_photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (fullName.charAt(0) || 'U').toUpperCase()
                  )}
                </div>
                <h3 className="text-lg font-bold text-theme-text">{fullName || 'Citizen User'}</h3>
                <p className="text-xs text-theme-secondary font-mono mt-0.5">{phone}</p>

                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-theme-soft-mint text-theme-primary rounded-full text-xs font-bold border border-theme-border">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verified Citizen Partner</span>
                </div>

                <div className="mt-6 pt-6 border-t border-theme-border/60 grid grid-cols-2 gap-3 text-left rtl:text-right">
                  <div className="bg-theme-bg p-3 rounded-xl border border-theme-border">
                    <span className="text-[10px] text-theme-secondary uppercase font-bold">Total Pickups</span>
                    <p className="text-lg font-bold text-theme-text mt-0.5">14</p>
                  </div>
                  <div className="bg-theme-bg p-3 rounded-xl border border-theme-border">
                    <span className="text-[10px] text-theme-secondary uppercase font-bold">Eco Tier</span>
                    <p className="text-lg font-bold text-theme-primary mt-0.5">Gold</p>
                  </div>
                </div>
              </div>

              {/* Eco Impact Badge */}
              <div className="bg-gradient-to-br from-theme-deep-green to-theme-surface text-white p-6 rounded-3xl border border-theme-border shadow-sm">
                <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                  <Award className="w-5 h-5 text-theme-bright-green" />
                  <h4 className="font-bold text-sm text-theme-text">Carbon Offset Champion</h4>
                </div>
                <p className="text-xs text-theme-secondary leading-relaxed">
                  Your recycled materials have diverted over 230 kg from Karachi landfills, offsetting an estimated 310 kg of CO2 equivalent.
                </p>
              </div>

              {/* Quick Password Toggle Button */}
              <button
                type="button"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="w-full p-4 rounded-2xl bg-theme-surface hover:bg-theme-soft-mint border border-theme-border text-xs font-bold text-theme-text flex items-center justify-between transition min-h-[48px]"
              >
                <span className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-theme-primary" />
                  <span>{showPasswordSection ? (isUrdu ? 'پاس ورڈ فارم چھپائیں' : 'Hide Password Form') : (isUrdu ? 'پاس ورڈ تبدیل کریں' : 'Change Password')}</span>
                </span>
                <span className="text-[11px] text-theme-primary font-mono">{showPasswordSection ? '▲' : '▼'}</span>
              </button>
            </div>

            {/* Right Column: Edit Forms & Theme Switcher */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Change Password Card (if toggled) */}
              {showPasswordSection && (
                <form onSubmit={handleChangePassword} className="bg-theme-surface p-6 sm:p-8 rounded-3xl border border-theme-border shadow-xs space-y-4 animate-fadeIn">
                  <h3 className="text-base font-bold text-theme-text flex items-center gap-2 border-b border-theme-border/60 pb-3">
                    <KeyRound className="w-4 h-4 text-theme-primary" />
                    <span>{isUrdu ? 'پاس ورڈ تبدیل کریں' : 'Change Password'}</span>
                  </h3>

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

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">Current Password</label>
                      <div className="relative">
                        <input
                          type={showCurrentPw ? 'text' : 'password'}
                          required
                          value={currentPw}
                          onChange={(e) => setCurrentPw(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full bg-theme-input border border-theme-border rounded-xl pl-4 pr-11 rtl:pr-4 rtl:pl-11 py-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary min-h-[48px] sm:min-h-[52px]"
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">New Password (Min 8)</label>
                        <div className="relative">
                          <input
                            type={showNewPw ? 'text' : 'password'}
                            required
                            value={newPw}
                            onChange={(e) => setNewPw(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full bg-theme-input border border-theme-border rounded-xl pl-4 pr-11 rtl:pr-4 rtl:pl-11 py-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary min-h-[48px] sm:min-h-[52px]"
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
                        <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">Confirm New Password</label>
                        <div className="relative">
                          <input
                            type={showConfirmPw ? 'text' : 'password'}
                            required
                            value={confirmPw}
                            onChange={(e) => setConfirmPw(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full bg-theme-input border border-theme-border rounded-xl pl-4 pr-11 rtl:pr-4 rtl:pl-11 py-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary min-h-[48px] sm:min-h-[52px]"
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

              {/* Appearance / Theme Switcher Card */}
              <div className="bg-theme-surface p-6 sm:p-8 rounded-3xl border border-theme-border shadow-xs space-y-4 transition-colors">
                <h3 className="text-base font-bold text-theme-text flex items-center gap-2 border-b border-theme-border/60 pb-3">
                  <Palette className="w-4 h-4 text-theme-primary" />
                  <span>{isUrdu ? 'پلیٹ فارم ڈسپلے تھیم' : 'Theme & Visual Appearance'}</span>
                </h3>
                <p className="text-xs text-theme-secondary">
                  {isUrdu 
                    ? 'صفائی پے پورٹل کو لائٹ، ڈارک، یا اپنے ڈیوائس کے سسٹم ڈیفالٹ میں دیکھیں:' 
                    : 'View SafaiPay in Light Mode, Dark Mode, or match your Operating System default:'}
                </p>
                <ThemeSwitcher variant="full" />
              </div>

              {/* Personal Information Form */}
              <form onSubmit={handleSave} className="bg-theme-surface p-6 sm:p-8 rounded-3xl border border-theme-border shadow-xs space-y-6 transition-colors">
                <h3 className="text-base font-bold text-theme-text flex items-center gap-2 border-b border-theme-border/60 pb-3">
                  <User className="w-4 h-4 text-theme-primary" />
                  <span>{isUrdu ? 'ذاتی معلومات' : 'Personal Information'}</span>
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
                    <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      disabled
                      className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-xs text-theme-secondary cursor-not-allowed font-mono min-h-[48px] sm:min-h-[52px]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary min-h-[48px] sm:min-h-[52px]"
                    />
                  </div>
                </div>

                {/* Saved Pickup Addresses */}
                <div className="pt-4 border-t border-theme-border/60">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-theme-text flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-theme-primary" />
                      <span>{isUrdu ? 'محفوظ شدہ پتے' : 'Saved Pickup Locations'}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAddAddress(!showAddAddress)}
                      className="text-xs font-bold text-theme-primary hover:underline flex items-center gap-1 min-h-[36px]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isUrdu ? 'نیا پتہ شامل کریں' : 'Add New'}</span>
                    </button>
                  </div>

                  {showAddAddress && (
                    <div className="p-4 bg-theme-bg rounded-2xl border border-theme-border mb-3 space-y-3">
                      <input
                        type="text"
                        placeholder="Label (e.g. Home, Warehouse, Factory)"
                        value={newAddressTitle}
                        onChange={(e) => setNewAddressTitle(e.target.value)}
                        className="w-full bg-theme-input border border-theme-border rounded-xl px-3.5 py-2.5 text-xs text-theme-text"
                      />
                      <input
                        type="text"
                        placeholder="Complete Street Address"
                        value={newAddressText}
                        onChange={(e) => setNewAddressText(e.target.value)}
                        className="w-full bg-theme-input border border-theme-border rounded-xl px-3.5 py-2.5 text-xs text-theme-text"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddAddress(false)}
                          className="px-3 py-1.5 rounded-lg border border-theme-border text-xs text-theme-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAddAddress}
                          className="px-3 py-1.5 rounded-lg bg-theme-primary text-white text-xs font-bold"
                        >
                          Add Location
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between transition ${
                          addr.isDefault
                            ? 'bg-theme-soft-mint/60 border-theme-primary/40'
                            : 'bg-theme-bg border-theme-border'
                        }`}
                      >
                        <div className="min-w-0 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-theme-text">{addr.title}</span>
                            {addr.isDefault && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-theme-primary text-white">
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-theme-secondary truncate mt-0.5">{addr.address}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!addr.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="text-[10px] font-bold text-theme-primary hover:underline px-2 py-1"
                            >
                              Set Default
                            </button>
                          )}
                          {addresses.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="p-1.5 text-theme-secondary hover:text-theme-error transition"
                              title="Delete location"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Digital Payout Wallet */}
                <div className="pt-4 border-t border-theme-border/60">
                  <h3 className="text-base font-bold text-theme-text flex items-center gap-2 mb-3">
                    <CreditCard className="w-4 h-4 text-theme-primary" />
                    <span>{isUrdu ? 'ڈیجیٹل ادائیگی کا والیٹ' : 'Digital Payout Destination'}</span>
                  </h3>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { id: 'easypaisa', name: 'Easypaisa' },
                      { id: 'jazzcash', name: 'JazzCash' },
                      { id: 'bank', name: 'Raast / Bank' }
                    ].map((m) => (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setPayoutMethod(m.id as any)}
                        className={`min-h-[48px] p-3 rounded-xl border text-xs font-bold transition text-center ${
                          payoutMethod === m.id
                            ? 'bg-theme-soft-mint border-theme-primary text-theme-primary ring-2 ring-theme-primary/20'
                            : 'bg-theme-surface border-theme-border text-theme-secondary hover:border-theme-primary/40'
                        }`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-theme-secondary uppercase mb-1">
                      {payoutMethod === 'bank' ? 'IBAN / Raast ID' : `${payoutMethod.toUpperCase()} Mobile Account`}
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
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
                    <span>{isUrdu ? 'محفوظ کریں' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
