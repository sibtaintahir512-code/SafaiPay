'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { updateUserProfile, changePassword } from '@/lib/api';
import {
  X,
  User as UserIcon,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Camera,
  Lock,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  MapPin,
  Building,
  Phone,
  Mail,
  Calendar,
  Award,
  Wallet,
  Truck,
  Factory,
  KeyRound,
  FileText
} from 'lucide-react';

export type ProfileModalTab = 'view' | 'edit' | 'password';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: ProfileModalTab;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'view',
}) => {
  const { user, role, updateUser } = useAuth();
  const { isUrdu } = useLanguage();
  const { resolvedTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<ProfileModalTab>(initialTab);
  const modalRef = useRef<HTMLDivElement>(null);

  // Edit Profile Form State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState(user?.profile?.street_address || user?.customer_profile?.street_address || '');
  const [serviceArea, setServiceArea] = useState(user?.profile?.service_area || user?.collector_profile?.service_area || '');
  const [companyName, setCompanyName] = useState(user?.profile?.organization_name || user?.recycler_profile?.company_name || '');
  const [emergencyContact, setEmergencyContact] = useState(user?.profile?.emergency_contact || user?.collector_profile?.emergency_contact || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.profile_photo_url || null);

  const [isEditingLoading, setIsEditingLoading] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isPwLoading, setIsPwLoading] = useState(false);
  const [pwSuccessMsg, setPwSuccessMsg] = useState<string | null>(null);
  const [pwErrorMsg, setPwErrorMsg] = useState<string | null>(null);

  // Sync state when user object updates
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
      setAddress(user.profile?.street_address || user.customer_profile?.street_address || '');
      setServiceArea(user.profile?.service_area || user.collector_profile?.service_area || '');
      setCompanyName(user.profile?.organization_name || user.recycler_profile?.company_name || '');
      setEmergencyContact(user.profile?.emergency_contact || user.collector_profile?.emergency_contact || '');
      setAvatarPreview(user.profile_photo_url || null);
    }
  }, [user]);

  // Set active tab when initialTab changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleSafeClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isDirty]);

  if (!isOpen) return null;

  const handleSafeClose = () => {
    if (isDirty) {
      const confirmDiscard = window.confirm(
        isUrdu
          ? 'آپ کے پاس غیر محفوظ شدہ تبدیلیاں ہیں۔ کیا آپ واقعی بند کرنا چاہتے ہیں؟'
          : 'You have unsaved changes in your profile. Are you sure you want to discard them?'
      );
      if (!confirmDiscard) return;
    }
    setIsDirty(false);
    setEditSuccessMsg(null);
    setEditErrorMsg(null);
    setPwSuccessMsg(null);
    setPwErrorMsg(null);
    onClose();
  };

  // Avatar file upload handler with validation
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setEditErrorMsg(
        isUrdu
          ? 'براہ کرم صرف JPEG، PNG، یا WebP تصویر منتخب کریں۔'
          : 'Please select a valid image file (JPEG, PNG, or WebP).'
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setEditErrorMsg(
        isUrdu
          ? 'تصویر کا سائز 5MB سے کم ہونا چاہیے۔'
          : 'Image file size must be less than 5MB.'
      );
      return;
    }

    setEditErrorMsg(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarPreview(reader.result);
        setIsDirty(true);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditingLoading) return;

    if (!fullName.trim() || fullName.trim().length < 2) {
      setEditErrorMsg(
        isUrdu ? 'پورا نام کم از کم 2 حروف پر مشتمل ہونا چاہیے۔' : 'Full name must be at least 2 characters.'
      );
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEditErrorMsg(
        isUrdu ? 'براہ کرم درست ای میل پتہ درج کریں۔' : 'Please provide a valid email address.'
      );
      return;
    }

    setIsEditingLoading(true);
    setEditErrorMsg(null);
    setEditSuccessMsg(null);

    try {
      const payload: any = {
        full_name: fullName.trim(),
        email: email.trim() || null,
        profile_photo_url: avatarPreview,
      };

      if (role === 'customer') payload.address = address.trim();
      if (role === 'collector') {
        payload.service_area = serviceArea.trim();
        payload.emergency_contact = emergencyContact.trim();
      }
      if (role === 'recycler') payload.company_name = companyName.trim();

      const updated = await updateUserProfile(payload);
      updateUser(updated);

      setEditSuccessMsg(
        isUrdu ? 'پروفائل کامیابی سے اپ ڈیٹ ہو گئی۔' : 'Your profile details have been updated successfully!'
      );
      setIsDirty(false);
      setTimeout(() => setEditSuccessMsg(null), 3500);
    } catch (err: any) {
      setEditErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsEditingLoading(false);
    }
  };

  // Change password handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPwLoading) return;

    if (!currentPassword) {
      setPwErrorMsg(isUrdu ? 'موجودہ پاس ورڈ درج کریں۔' : 'Please enter your current password.');
      return;
    }

    if (newPassword.length < 8) {
      setPwErrorMsg(
        isUrdu ? 'نیا پاس ورڈ کم از کم 8 حروف پر مشتمل ہونا چاہیے۔' : 'New password must be at least 8 characters long.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwErrorMsg(isUrdu ? 'پاس ورڈز مطابقت نہیں رکھتے۔' : 'New password and confirmation do not match.');
      return;
    }

    setIsPwLoading(true);
    setPwErrorMsg(null);
    setPwSuccessMsg(null);

    try {
      const result = await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      });

      setPwSuccessMsg(
        isUrdu
          ? 'پاس ورڈ کامیابی سے تبدیل ہو گیا ہے۔ آئندہ لاگ ان کے لیے نیا پاس ورڈ استعمال کریں۔'
          : 'Password successfully changed! Please use your new password for future logins.'
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwSuccessMsg(null), 4000);
    } catch (err: any) {
      setPwErrorMsg(err.message || 'Failed to change password. Please verify your current password.');
    } finally {
      setIsPwLoading(false);
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pw: string) => {
    if (!pw) return { score: 0, label: '', color: 'bg-theme-border' };
    let score = 0;
    if (pw.length >= 8) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;

    if (score <= 1) return { score: 1, label: isUrdu ? 'کمزور' : 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { score: 2, label: isUrdu ? 'درمیانہ' : 'Medium', color: 'bg-yellow-500' };
    return { score: 3, label: isUrdu ? 'مضبوط' : 'Strong', color: 'bg-theme-primary' };
  };

  const pwStrength = getPasswordStrength(newPassword);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-theme-deep-green/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl bg-theme-surface border border-theme-border rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden transition-colors"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border/70 bg-theme-surface sticky top-0 z-10">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-theme-soft-mint text-theme-primary flex items-center justify-center font-bold text-lg border border-theme-border">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={user?.full_name || 'User'}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                (user?.full_name?.charAt(0) || 'U').toUpperCase()
              )}
            </div>
            <div>
              <h2 id="profile-modal-title" className="text-base sm:text-lg font-extrabold text-theme-text leading-tight">
                {user?.full_name || 'SafaiPay User'}
              </h2>
              <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs text-theme-secondary">
                <span className="font-mono text-[11px]">{user?.phone_number || user?.email}</span>
                <span>•</span>
                <span className="capitalize font-bold text-theme-primary">{role || 'User'}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSafeClose}
            className="p-2 rounded-xl text-theme-secondary hover:text-theme-text hover:bg-theme-soft-mint transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-theme-border/70 px-6 bg-theme-bg/50 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('view')}
            className={`py-3 px-4 border-b-2 transition whitespace-nowrap min-h-[44px] flex items-center gap-1.5 ${
              activeTab === 'view'
                ? 'border-theme-primary text-theme-primary'
                : 'border-transparent text-theme-secondary hover:text-theme-text'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>{isUrdu ? 'پروفائل تفصیلات' : 'View Profile'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`py-3 px-4 border-b-2 transition whitespace-nowrap min-h-[44px] flex items-center gap-1.5 ${
              activeTab === 'edit'
                ? 'border-theme-primary text-theme-primary'
                : 'border-transparent text-theme-secondary hover:text-theme-text'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isUrdu ? 'پروفائل ترمیم کریں' : 'Edit Profile'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`py-3 px-4 border-b-2 transition whitespace-nowrap min-h-[44px] flex items-center gap-1.5 ${
              activeTab === 'password'
                ? 'border-theme-primary text-theme-primary'
                : 'border-transparent text-theme-secondary hover:text-theme-text'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>{isUrdu ? 'پاس ورڈ تبدیل کریں' : 'Change Password'}</span>
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-theme-text">
          {/* ================= TAB 1: VIEW PROFILE ================= */}
          {activeTab === 'view' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Account Status Card */}
              <div className="bg-theme-bg border border-theme-border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="p-2.5 rounded-xl bg-theme-soft-mint text-theme-primary">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-theme-secondary">Account Status</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-theme-soft-mint text-theme-primary border border-theme-border">
                        {user?.is_active ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </div>
                    <p className="text-xs text-theme-text font-semibold mt-0.5">
                      {role === 'customer' && 'Verified Household Citizen Partner'}
                      {role === 'collector' && 'Verified Field Collector & Weigher'}
                      {role === 'recycler' && 'Verified Commercial Recycler'}
                      {role === 'admin' && 'Platform Super Administrator'}
                    </p>
                  </div>
                </div>

                <div className="text-left rtl:text-right sm:text-right rtl:sm:text-left text-xs text-theme-secondary font-mono">
                  <div className="flex items-center gap-1.5 sm:justify-end">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Member since: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '2026-01-01'}</span>
                  </div>
                </div>
              </div>

              {/* Core Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-theme-surface rounded-2xl border border-theme-border">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-theme-secondary block mb-1">
                    Full Name
                  </span>
                  <p className="text-sm font-bold text-theme-text">{user?.full_name || 'Not provided'}</p>
                </div>

                <div className="p-4 bg-theme-surface rounded-2xl border border-theme-border">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-theme-secondary block mb-1">
                    Phone Number
                  </span>
                  <p className="text-sm font-bold text-theme-text font-mono">{user?.phone_number || 'Not provided'}</p>
                </div>

                <div className="p-4 bg-theme-surface rounded-2xl border border-theme-border">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-theme-secondary block mb-1">
                    Email Address
                  </span>
                  <p className="text-sm font-bold text-theme-text truncate">{user?.email || 'Not provided'}</p>
                </div>

                <div className="p-4 bg-theme-surface rounded-2xl border border-theme-border">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-theme-secondary block mb-1">
                    Platform Role
                  </span>
                  <p className="text-sm font-bold text-theme-primary uppercase">{role || 'Citizen'}</p>
                </div>
              </div>

              {/* Role-Specific Detail Cards */}
              {role === 'customer' && (
                <div className="bg-theme-bg border border-theme-border rounded-2xl p-5 space-y-3">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse text-theme-primary font-bold text-xs uppercase tracking-wider">
                    <Award className="w-4 h-4" />
                    <span>Household Recycling Performance</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-theme-surface p-3 rounded-xl border border-theme-border">
                      <span className="text-[10px] text-theme-secondary uppercase font-bold block">Pickups</span>
                      <span className="text-base font-extrabold text-theme-text mt-0.5 block">14 Completed</span>
                    </div>
                    <div className="bg-theme-surface p-3 rounded-xl border border-theme-border">
                      <span className="text-[10px] text-theme-secondary uppercase font-bold block">Diverted</span>
                      <span className="text-base font-extrabold text-theme-text mt-0.5 block">230.5 kg</span>
                    </div>
                    <div className="bg-theme-surface p-3 rounded-xl border border-theme-border">
                      <span className="text-[10px] text-theme-secondary uppercase font-bold block">Offset</span>
                      <span className="text-base font-extrabold text-theme-primary mt-0.5 block">310 kg CO₂</span>
                    </div>
                  </div>
                  {address && (
                    <div className="pt-2 text-xs flex items-center gap-1.5 text-theme-secondary">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-theme-primary" />
                      <span>{address}</span>
                    </div>
                  )}
                </div>
              )}

              {role === 'collector' && (
                <div className="bg-theme-bg border border-theme-border rounded-2xl p-5 space-y-3">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse text-theme-primary font-bold text-xs uppercase tracking-wider">
                    <Truck className="w-4 h-4" />
                    <span>Collector Territory & Verified Payouts</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-theme-surface p-3 rounded-xl border border-theme-border">
                      <span className="text-[10px] text-theme-secondary uppercase font-bold block">Territory</span>
                      <span className="text-xs font-bold text-theme-text mt-0.5 block truncate">
                        {serviceArea || 'Karachi South & East'}
                      </span>
                    </div>
                    <div className="bg-theme-surface p-3 rounded-xl border border-theme-border">
                      <span className="text-[10px] text-theme-secondary uppercase font-bold block">Rating</span>
                      <span className="text-base font-extrabold text-theme-yellow mt-0.5 block">4.9 ★</span>
                    </div>
                    <div className="bg-theme-surface p-3 rounded-xl border border-theme-border">
                      <span className="text-[10px] text-theme-secondary uppercase font-bold block">Completed</span>
                      <span className="text-base font-extrabold text-theme-primary mt-0.5 block">142 Jobs</span>
                    </div>
                  </div>
                </div>
              )}

              {role === 'recycler' && (
                <div className="bg-theme-bg border border-theme-border rounded-2xl p-5 space-y-3">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse text-theme-primary font-bold text-xs uppercase tracking-wider">
                    <Factory className="w-4 h-4" />
                    <span>Commercial Facility Profile</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-theme-surface p-3 rounded-xl border border-theme-border">
                      <span className="text-[10px] text-theme-secondary uppercase font-bold block">Company</span>
                      <span className="text-xs font-bold text-theme-text mt-0.5 block truncate">
                        {companyName || 'Pak Green Polymers Ltd'}
                      </span>
                    </div>
                    <div className="bg-theme-surface p-3 rounded-xl border border-theme-border">
                      <span className="text-[10px] text-theme-secondary uppercase font-bold block">B2B Standing</span>
                      <span className="text-xs font-bold text-theme-primary mt-0.5 block">SECP Registered</span>
                    </div>
                  </div>
                </div>
              )}

              {role === 'admin' && (
                <div className="bg-theme-bg border border-theme-border rounded-2xl p-5 space-y-3">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse text-theme-primary font-bold text-xs uppercase tracking-wider">
                    <Lock className="w-4 h-4" />
                    <span>Governance & Permission Level</span>
                  </div>
                  <div className="p-3 bg-theme-surface rounded-xl border border-theme-border flex items-center justify-between text-xs">
                    <span className="text-theme-secondary">Role Classification:</span>
                    <span className="font-bold text-theme-primary font-mono">SUPERADMINISTRATOR (Full Platform Access)</span>
                  </div>
                </div>
              )}

              {/* Theme Preference Quick Switcher */}
              <div className="pt-4 border-t border-theme-border/60">
                <span className="text-xs font-bold text-theme-secondary block uppercase mb-2">
                  Display Appearance Preference
                </span>
                <ThemeSwitcher variant="full" />
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  className="px-5 py-2.5 rounded-xl bg-theme-primary text-white font-bold text-xs hover:opacity-95 transition min-h-[44px]"
                >
                  {isUrdu ? 'پروفائل ترمیم کریں' : 'Edit Profile Details'}
                </button>
              </div>
            </div>
          )}

          {/* ================= TAB 2: EDIT PROFILE ================= */}
          {activeTab === 'edit' && (
            <form onSubmit={handleSaveProfile} className="space-y-5 animate-fadeIn">
              {editSuccessMsg && (
                <div className="p-3.5 bg-theme-soft-mint border border-theme-primary/30 text-theme-primary rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{editSuccessMsg}</span>
                </div>
              )}

              {editErrorMsg && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-theme-error rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editErrorMsg}</span>
                </div>
              )}

              {/* Avatar Upload with Preview */}
              <div className="flex items-center space-x-4 rtl:space-x-reverse pb-3 border-b border-theme-border/60">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-theme-soft-mint text-theme-primary flex items-center justify-center font-bold text-2xl border-2 border-theme-border overflow-hidden">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      (fullName.charAt(0) || 'U').toUpperCase()
                    )}
                  </div>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute -bottom-1 -right-1 rtl:-right-auto rtl:-left-1 p-1.5 rounded-xl bg-theme-primary text-white cursor-pointer hover:opacity-90 shadow-sm min-h-[32px] min-w-[32px] flex items-center justify-center"
                    title="Upload new photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-theme-text">Profile Avatar</h4>
                  <p className="text-[11px] text-theme-secondary mt-0.5">JPEG, PNG, or WebP. Max 5MB file size.</p>
                </div>
              </div>

              {/* Form Inputs with Proper Non-overlapping Paddings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-fullname" className="block text-xs font-bold text-theme-secondary uppercase mb-1.5">
                    {isUrdu ? 'پورا نام' : 'Full Name *'}
                  </label>
                  <div className="relative">
                    <input
                      id="edit-fullname"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary transition min-h-[48px] sm:min-h-[52px]"
                      placeholder="e.g. Tariq Mehmood"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="edit-phone" className="block text-xs font-bold text-theme-secondary uppercase mb-1.5">
                    {isUrdu ? 'فون نمبر' : 'Phone Number (Read-only)'}
                  </label>
                  <div className="relative">
                    <input
                      id="edit-phone"
                      type="text"
                      disabled
                      value={user?.phone_number || ''}
                      className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-xs text-theme-secondary font-mono cursor-not-allowed min-h-[48px] sm:min-h-[52px]"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="edit-email" className="block text-xs font-bold text-theme-secondary uppercase mb-1.5">
                    {isUrdu ? 'ای میل ایڈریس' : 'Email Address'}
                  </label>
                  <div className="relative">
                    <input
                      id="edit-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary transition min-h-[48px] sm:min-h-[52px]"
                      placeholder="e.g. resident@safaipay.test"
                    />
                  </div>
                </div>

                {role === 'customer' && (
                  <div className="sm:col-span-2">
                    <label htmlFor="edit-address" className="block text-xs font-bold text-theme-secondary uppercase mb-1.5">
                      {isUrdu ? 'پتہ / علاقہ' : 'Default Pickup Address'}
                    </label>
                    <input
                      id="edit-address"
                      type="text"
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary transition min-h-[48px] sm:min-h-[52px]"
                      placeholder="e.g. House 45, Street 12, PECHS Block 6, Karachi"
                    />
                  </div>
                )}

                {role === 'collector' && (
                  <>
                    <div>
                      <label htmlFor="edit-servicearea" className="block text-xs font-bold text-theme-secondary uppercase mb-1.5">
                        {isUrdu ? 'سروس کا علاقہ' : 'Service Territory'}
                      </label>
                      <input
                        id="edit-servicearea"
                        type="text"
                        value={serviceArea}
                        onChange={(e) => {
                          setServiceArea(e.target.value);
                          setIsDirty(true);
                        }}
                        className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary transition min-h-[48px] sm:min-h-[52px]"
                        placeholder="e.g. PECHS, Clifton, Saddar"
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-emergency" className="block text-xs font-bold text-theme-secondary uppercase mb-1.5">
                        {isUrdu ? 'ہنگامی رابطہ' : 'Emergency Contact'}
                      </label>
                      <input
                        id="edit-emergency"
                        type="text"
                        value={emergencyContact}
                        onChange={(e) => {
                          setEmergencyContact(e.target.value);
                          setIsDirty(true);
                        }}
                        className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary transition min-h-[48px] sm:min-h-[52px]"
                        placeholder="+92 300 0000000"
                      />
                    </div>
                  </>
                )}

                {role === 'recycler' && (
                  <div className="sm:col-span-2">
                    <label htmlFor="edit-company" className="block text-xs font-bold text-theme-secondary uppercase mb-1.5">
                      {isUrdu ? 'کمپنی کا نام' : 'Registered Business Name'}
                    </label>
                    <input
                      id="edit-company"
                      type="text"
                      value={companyName}
                      onChange={(e) => {
                        setCompanyName(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary transition min-h-[48px] sm:min-h-[52px]"
                      placeholder="e.g. Pak Green Polymers Pvt Ltd"
                    />
                  </div>
                )}
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-theme-border/60">
                <button
                  type="button"
                  onClick={() => {
                    setIsDirty(false);
                    setActiveTab('view');
                  }}
                  className="px-4 py-2.5 rounded-xl border border-theme-border text-xs font-bold text-theme-secondary hover:text-theme-text hover:bg-theme-bg transition min-h-[44px]"
                >
                  {isUrdu ? 'منسوخ کریں' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={isEditingLoading}
                  className="px-6 py-2.5 rounded-xl bg-theme-primary hover:opacity-95 text-white text-xs font-bold transition shadow-md flex items-center gap-2 disabled:opacity-60 min-h-[44px]"
                >
                  {isEditingLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{isUrdu ? 'محفوظ کیا جا رہا ہے...' : 'Saving Changes...'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{isUrdu ? 'تبدیلیاں محفوظ کریں' : 'Save Changes'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ================= TAB 3: CHANGE PASSWORD ================= */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4 animate-fadeIn">
              {pwSuccessMsg && (
                <div className="p-3.5 bg-theme-soft-mint border border-theme-primary/30 text-theme-primary rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{pwSuccessMsg}</span>
                </div>
              )}

              {pwErrorMsg && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-theme-error rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pwErrorMsg}</span>
                </div>
              )}

              {/* Current Password Field */}
              <div>
                <label htmlFor="pw-current" className="block text-xs font-bold text-theme-secondary uppercase mb-1.5">
                  {isUrdu ? 'موجودہ پاس ورڈ' : 'Current Password *'}
                </label>
                <div className="relative">
                  <input
                    id="pw-current"
                    type={showCurrentPw ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-theme-input border border-theme-border rounded-xl pl-4 pr-11 rtl:pr-4 rtl:pl-11 py-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary transition min-h-[48px] sm:min-h-[52px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-3 rtl:pr-0 rtl:pl-3 flex items-center text-theme-secondary hover:text-theme-text transition min-h-[44px] min-w-[44px] justify-center"
                    aria-label={showCurrentPw ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password Field */}
              <div>
                <label htmlFor="pw-new" className="block text-xs font-bold text-theme-secondary uppercase mb-1.5">
                  {isUrdu ? 'نیا پاس ورڈ (کم از کم 8 حروف)' : 'New Password (Min 8 Characters) *'}
                </label>
                <div className="relative">
                  <input
                    id="pw-new"
                    type={showNewPw ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-theme-input border border-theme-border rounded-xl pl-4 pr-11 rtl:pr-4 rtl:pl-11 py-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary transition min-h-[48px] sm:min-h-[52px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-3 rtl:pr-0 rtl:pl-3 flex items-center text-theme-secondary hover:text-theme-text transition min-h-[44px] min-w-[44px] justify-center"
                    aria-label={showNewPw ? 'Hide password' : 'Show password'}
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-theme-secondary">Strength:</span>
                      <span className="font-bold text-theme-text">{pwStrength.label}</span>
                    </div>
                    <div className="w-full h-1.5 bg-theme-border rounded-full overflow-hidden">
                      <div
                        className={`h-full ${pwStrength.color} transition-all duration-300`}
                        style={{ width: `${(pwStrength.score / 3) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm New Password Field */}
              <div>
                <label htmlFor="pw-confirm" className="block text-xs font-bold text-theme-secondary uppercase mb-1.5">
                  {isUrdu ? 'نئے پاس ورڈ کی تصدیق کریں' : 'Confirm New Password *'}
                </label>
                <div className="relative">
                  <input
                    id="pw-confirm"
                    type={showConfirmPw ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-theme-input border border-theme-border rounded-xl pl-4 pr-11 rtl:pr-4 rtl:pl-11 py-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary transition min-h-[48px] sm:min-h-[52px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-3 rtl:pr-0 rtl:pl-3 flex items-center text-theme-secondary hover:text-theme-text transition min-h-[44px] min-w-[44px] justify-center"
                    aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-theme-border/60">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setActiveTab('view');
                  }}
                  className="px-4 py-2.5 rounded-xl border border-theme-border text-xs font-bold text-theme-secondary hover:text-theme-text hover:bg-theme-bg transition min-h-[44px]"
                >
                  {isUrdu ? 'منسوخ کریں' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={isPwLoading}
                  className="px-6 py-2.5 rounded-xl bg-theme-primary hover:opacity-95 text-white text-xs font-bold transition shadow-md flex items-center gap-2 disabled:opacity-60 min-h-[44px]"
                >
                  {isPwLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{isUrdu ? 'پاس ورڈ تبدیل ہو رہا ہے...' : 'Updating Password...'}</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>{isUrdu ? 'پاس ورڈ اپ ڈیٹ کریں' : 'Update Password'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
