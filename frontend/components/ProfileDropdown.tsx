'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User as UserIcon, 
  FileText, 
  KeyRound, 
  Settings, 
  LogOut, 
  CheckCircle2, 
  Palette, 
  X, 
  AlertCircle,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { ProfileModalTab } from '@/components/ProfileModal';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenModalTab: (tab: ProfileModalTab) => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  isOpen,
  onClose,
  onOpenModalTab,
}) => {
  const { user, role, logout } = useAuth();
  const { isUrdu } = useLanguage();
  const router = useRouter();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click and Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Reset confirmation dialog if menu closes
  useEffect(() => {
    if (!isOpen) {
      setShowLogoutConfirm(false);
      setLogoutError(null);
    }
  }, [isOpen]);

  const handleAction = (tab: ProfileModalTab) => {
    onClose();
    onOpenModalTab(tab);
  };

  const handleSettings = () => {
    onClose();
    if (role === 'admin') {
      router.push('/admin/settings');
    } else {
      router.push(`/${role}/profile`);
    }
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      await logout();
      onClose();
      router.replace('/login');
    } catch (err: any) {
      setLogoutError(err.message || 'Logout failed. Please try again.');
      setIsLoggingOut(false);
    }
  };

  if (!isOpen || !user) return null;

  const roleBadgeColors: Record<string, string> = {
    customer: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    collector: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30',
    recycler: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    admin: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  };

  return (
    <>
      {/* Mobile Backdrop Overlay (only on screens < sm) */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-2xs z-50 sm:hidden animate-fadeIn" 
        onClick={onClose} 
      />

      {/* Main Container: Bottom Sheet on Mobile (<sm), Popover on Desktop (>=sm) */}
      <div
        ref={dropdownRef}
        role="menu"
        aria-label={isUrdu ? 'صارف اکاؤنٹ مینو' : 'User account menu'}
        className="fixed bottom-0 inset-x-0 sm:inset-x-auto sm:bottom-auto sm:top-16 sm:right-6 sm:rtl:right-auto sm:rtl:left-6 z-50 w-full sm:w-[420px] max-w-full sm:max-w-[calc(100vw-24px)] bg-theme-surface rounded-t-3xl sm:rounded-2xl shadow-2xl border border-theme-border flex flex-col max-h-[85vh] sm:max-h-[calc(100vh-80px)] animate-slideUp sm:animate-fadeIn overflow-hidden text-theme-text"
      >
        {/* Mobile Drag Handle */}
        <div className="pt-3 pb-1 sm:hidden flex justify-center">
          <div className="w-12 h-1.5 rounded-full bg-theme-border" />
        </div>

        {/* SECTION A: User Summary Section */}
        <div className="p-4 border-b border-theme-border bg-theme-bg/60 shrink-0">
          <div className="flex items-start space-x-3.5 rtl:space-x-reverse">
            {/* Avatar with Verified Indicator */}
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-theme-soft-mint text-theme-primary flex items-center justify-center font-extrabold text-base border border-theme-border overflow-hidden shadow-xs">
                {user.profile_photo_url ? (
                  <img src={user.profile_photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  (user.full_name?.charAt(0) || 'U').toUpperCase()
                )}
              </div>
              <span 
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-theme-primary text-white flex items-center justify-center ring-2 ring-theme-surface shadow-2xs" 
                title={isUrdu ? 'مصدقہ اکاؤنٹ' : 'Verified Account'}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Name, Phone/Email, Role badge */}
            <div className="min-w-0 flex-1">
              <h3 
                className="text-sm font-extrabold text-theme-text leading-snug line-clamp-2 break-words"
                title={user.full_name}
              >
                {user.full_name || (isUrdu ? 'صارف' : 'Registered User')}
              </h3>

              <p className="text-xs text-theme-secondary font-mono mt-0.5 truncate">
                {user.phone_number || user.email}
              </p>

              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${roleBadgeColors[role || 'customer'] || roleBadgeColors.customer}`}>
                  {role ? role.toUpperCase() : 'PORTAL'}
                </span>
                <span className="text-[10px] font-bold text-theme-primary flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{isUrdu ? 'مصدقہ رکن' : 'Verified'}</span>
                </span>
              </div>
            </div>

            {/* Mobile close cross */}
            <button
              type="button"
              onClick={onClose}
              className="sm:hidden p-1.5 rounded-lg text-theme-secondary hover:text-theme-text hover:bg-theme-soft-mint transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Middle Body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4 divide-y divide-theme-border/50">
          
          {/* SECTION B: Menu Actions */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-theme-secondary px-2 mb-1.5">
              {isUrdu ? 'اکاؤنٹ کے اختیارات' : 'Account Actions'}
            </p>

            <button
              type="button"
              role="menuitem"
              onClick={() => handleAction('view')}
              className="w-full text-left rtl:text-right px-3 py-3 rounded-xl hover:bg-theme-soft-mint/70 hover:text-theme-primary active:scale-[0.99] transition flex items-center justify-between min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-theme-bg border border-theme-border flex items-center justify-center text-theme-secondary">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-theme-text">
                    {isUrdu ? 'پروفائل تفصیلات دیکھیں' : 'View Profile'}
                  </p>
                  <p className="text-[11px] text-theme-secondary leading-none mt-0.5">
                    {isUrdu ? 'اپنی تصدیق اور تفصیلات کا معائنہ کریں' : 'Inspect verified status and account details'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-theme-secondary rtl:rotate-180" />
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => handleAction('edit')}
              className="w-full text-left rtl:text-right px-3 py-3 rounded-xl hover:bg-theme-soft-mint/70 hover:text-theme-primary active:scale-[0.99] transition flex items-center justify-between min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-theme-bg border border-theme-border flex items-center justify-center text-theme-secondary">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-theme-text">
                    {isUrdu ? 'پروفائل ترمیم کریں' : 'Edit Profile'}
                  </p>
                  <p className="text-[11px] text-theme-secondary leading-none mt-0.5">
                    {isUrdu ? 'نام، پتہ اور تصویر تبدیل کریں' : 'Update name, contact address and photo'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-theme-secondary rtl:rotate-180" />
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => handleAction('password')}
              className="w-full text-left rtl:text-right px-3 py-3 rounded-xl hover:bg-theme-soft-mint/70 hover:text-theme-primary active:scale-[0.99] transition flex items-center justify-between min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-theme-bg border border-theme-border flex items-center justify-center text-theme-secondary">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-theme-text">
                    {isUrdu ? 'پاس ورڈ تبدیل کریں' : 'Change Password'}
                  </p>
                  <p className="text-[11px] text-theme-secondary leading-none mt-0.5">
                    {isUrdu ? 'نیا محفوظ پاس ورڈ مقرر کریں' : 'Update login password and credentials'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-theme-secondary rtl:rotate-180" />
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={handleSettings}
              className="w-full text-left rtl:text-right px-3 py-3 rounded-xl hover:bg-theme-soft-mint/70 hover:text-theme-primary active:scale-[0.99] transition flex items-center justify-between min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-theme-bg border border-theme-border flex items-center justify-center text-theme-secondary">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-theme-text">
                    {isUrdu ? 'پلیٹ فارم ترتیبات' : 'Settings'}
                  </p>
                  <p className="text-[11px] text-theme-secondary leading-none mt-0.5">
                    {isUrdu ? 'زبان اور سیکیورٹی کنٹرول' : 'Language, preferences and system security'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-theme-secondary rtl:rotate-180" />
            </button>
          </div>

          {/* SECTION C: Theme Preference Section */}
          <div className="pt-3">
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-theme-secondary flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-theme-primary" />
                <span>{isUrdu ? 'ڈسپلے تھیم' : 'Theme Preference'}</span>
              </p>
            </div>

            {/* Equal width and height Light and Dark cards with centered icons */}
            <ThemeSwitcher variant="menu" />
          </div>

          {/* SECTION D: Sign Out Section */}
          <div className="pt-3">
            {!showLogoutConfirm ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full text-left rtl:text-right px-3.5 py-3 rounded-xl text-theme-error hover:bg-red-50 dark:hover:bg-red-950/40 active:scale-[0.99] transition flex items-center justify-between font-bold min-h-[48px] border border-transparent hover:border-red-200 dark:hover:border-red-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-error"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100/60 dark:bg-red-950/60 flex items-center justify-center text-theme-error">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-theme-error">
                      {isUrdu ? 'لاگ آؤٹ' : 'Sign Out'}
                    </p>
                    <p className="text-[10px] text-theme-secondary">
                      {isUrdu ? 'اپنے اکاؤنٹ سے محفوظ طریقے سے باہر نکلیں' : 'End session securely and return to login'}
                    </p>
                  </div>
                </div>
              </button>
            ) : (
              /* Confirmation Dialog inside Dropdown */
              <div className="p-3.5 rounded-2xl bg-red-50/80 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 space-y-3 animate-fadeIn">
                <div className="flex items-start space-x-2.5 rtl:space-x-reverse">
                  <AlertCircle className="w-5 h-5 text-theme-error shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-extrabold text-theme-text">
                      {isUrdu ? 'کیا آپ واقعی لاگ آؤٹ کرنا چاہتے ہیں؟' : 'Sign Out of SafaiPay?'}
                    </h4>
                    <p className="text-[11px] text-theme-secondary mt-0.5">
                      {isUrdu 
                        ? 'آپ کے تمام جاری کام اور والٹ بیلنس محفوظ رہیں گے۔' 
                        : 'Your active sessions and verified earnings will remain securely saved.'}
                    </p>
                  </div>
                </div>

                {logoutError && (
                  <p className="text-[11px] text-theme-error font-semibold bg-white dark:bg-black/40 p-2 rounded-lg">
                    {logoutError}
                  </p>
                )}

                <div className="flex items-center space-x-2 rtl:space-x-reverse pt-1">
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(false)}
                    disabled={isLoggingOut}
                    className="flex-1 py-2 px-3 rounded-xl border border-theme-border bg-theme-surface hover:bg-theme-bg text-theme-text text-xs font-bold transition min-h-[44px]"
                  >
                    {isUrdu ? 'منسوخ کریں' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmLogout}
                    disabled={isLoggingOut}
                    className="flex-1 py-2 px-3 rounded-xl bg-theme-error hover:opacity-90 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm min-h-[44px]"
                  >
                    {isLoggingOut ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{isUrdu ? 'لاگ آؤٹ ہو رہا ہے...' : 'Signing out...'}</span>
                      </>
                    ) : (
                      <>
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{isUrdu ? 'تصدیق لاگ آؤٹ' : 'Confirm Sign Out'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
