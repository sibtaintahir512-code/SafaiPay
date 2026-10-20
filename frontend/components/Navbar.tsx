'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { UserRole } from '@/lib/types';
import { getDashboardPath, checkBackendHealth } from '@/lib/api';
import { SafaiPayLogo } from '@/components/SafaiPayLogo';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { ProfileModal, ProfileModalTab } from '@/components/ProfileModal';
import { 
  Shield, 
  Truck, 
  UserCheck, 
  Factory, 
  LogOut, 
  Bell, 
  HelpCircle, 
  CheckCircle2,
  AlertCircle,
  Sparkles,
  User as UserIcon,
  Menu,
  X,
  Settings,
  KeyRound,
  FileText,
  ChevronDown,
  Palette
} from 'lucide-react';

interface NavbarProps {
  backendOnline?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ backendOnline: propBackendOnline }) => {
  const { user, role, logout, isLoading } = useAuth();
  const { language, setLanguage, t, isUrdu } = useLanguage();
  const { resolvedTheme } = useTheme();
  const router = useRouter();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<ProfileModalTab>('view');
  const [isBackendLive, setIsBackendLive] = useState<boolean>(propBackendOnline ?? false);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check health asynchronously
    checkBackendHealth().then((live) => {
      setIsBackendLive(live);
    }).catch(() => {
      setIsBackendLive(false);
    });

    // Close menus on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    // Close on Escape key
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowProfileMenu(false);
        setShowNotifications(false);
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const openProfileWithTab = (tab: ProfileModalTab) => {
    setShowProfileMenu(false);
    setShowMobileMenu(false);
    setProfileModalTab(tab);
    setProfileModalOpen(true);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const getProfilePath = () => {
    if (!role) return '/login';
    return `/${role}/profile`;
  };

  return (
    <>
      <header className="border-b border-theme-border bg-theme-surface/95 backdrop-blur-md sticky top-0 z-40 shadow-xs transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & Brand */}
            <div 
              className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer select-none" 
              onClick={() => router.push(user ? getDashboardPath(role) : '/login')}
            >
              <SafaiPayLogo size="md" showWordmark={true} isDark={resolvedTheme === 'dark'} />
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-theme-soft-mint text-theme-primary border border-theme-border">
                {role ? role.toUpperCase() : 'PORTAL'}
              </span>
            </div>

            {/* Verified Active Portal Badge (Desktop) */}
            {role && (
              <div className="hidden lg:flex items-center space-x-2 rtl:space-x-reverse bg-theme-bg px-3.5 py-1.5 rounded-full border border-theme-border">
                <span className="w-2 h-2 rounded-full bg-theme-primary animate-pulse" />
                <span className="text-xs font-bold text-theme-text capitalize">
                  {role} Portal
                </span>
              </div>
            )}

            {/* Actions: Theme Switcher, Language Switcher, Notifications, Help, Profile */}
            <div className="flex items-center space-x-2 sm:space-x-3 rtl:space-x-reverse">
              
              {/* Centralized Production Theme Switcher */}
              <div className="hidden sm:block">
                <ThemeSwitcher variant="compact" />
              </div>

              {/* Language Switcher Toggle */}
              <div className="flex items-center bg-theme-bg border border-theme-border rounded-xl p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`min-h-[44px] min-w-[36px] sm:min-h-0 sm:min-w-0 px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                    language === 'en'
                      ? 'bg-theme-primary text-white shadow-xs'
                      : 'text-theme-secondary hover:text-theme-text hover:bg-theme-soft-mint'
                  }`}
                  title="Switch to English"
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('ur')}
                  className={`min-h-[44px] min-w-[36px] sm:min-h-0 sm:min-w-0 px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                    language === 'ur'
                      ? 'bg-theme-primary text-white shadow-xs'
                      : 'text-theme-secondary hover:text-theme-text hover:bg-theme-soft-mint'
                  }`}
                  title="اردو میں تبدیل کریں"
                >
                  اردو
                </button>
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-theme-secondary hover:text-theme-text hover:bg-theme-soft-mint transition relative flex items-center justify-center"
                  title={t('nav.notifications')}
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-theme-primary ring-2 ring-theme-surface" />
                </button>

                {showNotifications && (
                  <div className="absolute right-0 rtl:left-0 rtl:right-auto mt-2 w-72 sm:w-80 bg-theme-surface rounded-2xl shadow-xl border border-theme-border p-4 z-50 text-theme-text">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-theme-border/60">
                      <h4 className="text-xs font-bold text-theme-text">{t('nav.notifications')}</h4>
                      <span className="text-[10px] bg-theme-soft-mint text-theme-primary px-2 py-0.5 rounded-full font-bold">3 New</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 bg-theme-bg rounded-xl border border-theme-border flex items-start space-x-2 rtl:space-x-reverse">
                        <CheckCircle2 className="w-4 h-4 text-theme-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-theme-text">PET Plastic Weighed</p>
                          <p className="text-[11px] text-theme-secondary">10.5 kg verified on scale. Rs 840 paid.</p>
                        </div>
                      </div>
                      <div className="p-2.5 bg-theme-bg rounded-xl border border-theme-border flex items-start space-x-2 rtl:space-x-reverse">
                        <Sparkles className="w-4 h-4 text-theme-yellow shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-theme-text">Rate Index Updated</p>
                          <p className="text-[11px] text-theme-secondary">PET benchmark adjusted to Rs 85.00/kg.</p>
                        </div>
                      </div>
                      <div className="p-2.5 bg-theme-bg rounded-xl border border-theme-border flex items-start space-x-2 rtl:space-x-reverse">
                        <AlertCircle className="w-4 h-4 text-theme-warning shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-theme-text">Quality Check</p>
                          <p className="text-[11px] text-theme-secondary">Dry sorted cardboard batch ready for pickup.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Help & Support */}
              <button
                onClick={() => setShowHelp(true)}
                className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-theme-secondary hover:text-theme-text hover:bg-theme-soft-mint transition hidden sm:inline-flex items-center justify-center"
                title={t('nav.help')}
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              {/* API Online Badge */}
              <div className="hidden md:flex items-center space-x-1.5 rtl:space-x-reverse text-xs bg-theme-surface px-2.5 py-1 rounded-full border border-theme-border shadow-2xs">
                <span className="flex h-2 w-2 relative">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isBackendLive ? 'bg-theme-bright-green' : 'bg-theme-primary'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isBackendLive ? 'bg-theme-primary' : 'bg-theme-secondary'
                    }`}
                  />
                </span>
                <span className="text-[10px] font-bold text-theme-primary font-mono">
                  {isBackendLive ? 'API LIVE' : 'SANDBOX'}
                </span>
              </div>

              {/* User Profile Menu & Dropdown Trigger */}
              {user && (
                <div ref={profileMenuRef} className="relative flex items-center pl-2 rtl:pr-2 border-l rtl:border-r rtl:border-l-0 border-theme-border">
                  <button
                    type="button"
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-2.5 rtl:space-x-reverse p-1.5 rounded-2xl hover:bg-theme-soft-mint transition min-h-[44px] group"
                    aria-expanded={showProfileMenu}
                    aria-haspopup="menu"
                    title="Account Profile & Settings"
                  >
                    <div className="w-8 h-8 rounded-xl bg-theme-soft-mint text-theme-primary flex items-center justify-center font-bold text-xs border border-theme-border group-hover:scale-105 transition-transform overflow-hidden">
                      {user.profile_photo_url ? (
                        <img src={user.profile_photo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (user.full_name?.charAt(0) || 'U').toUpperCase()
                      )}
                    </div>
                    <div className="text-left rtl:text-right hidden sm:block">
                      <p className="text-xs font-bold text-theme-text leading-tight truncate max-w-[110px]">
                        {user.full_name || 'Pilot User'}
                      </p>
                      <p className="text-[10px] text-theme-primary font-mono font-medium truncate max-w-[110px]">
                        {user.phone_number || user.email}
                      </p>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-theme-secondary transition-transform hidden sm:block ${showProfileMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Profile Menu Dropdown Popover */}
                  {showProfileMenu && (
                    <div
                      role="menu"
                      className="absolute right-0 rtl:left-0 rtl:right-auto top-full mt-2 w-72 sm:w-80 bg-theme-surface rounded-2xl shadow-2xl border border-theme-border p-3 z-50 animate-fadeIn text-theme-text"
                    >
                      {/* Header Summary */}
                      <div className="p-3 bg-theme-bg rounded-xl border border-theme-border flex items-center space-x-3 rtl:space-x-reverse mb-2">
                        <div className="w-10 h-10 rounded-xl bg-theme-soft-mint text-theme-primary flex items-center justify-center font-extrabold text-base border border-theme-border shrink-0 overflow-hidden">
                          {user.profile_photo_url ? (
                            <img src={user.profile_photo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (user.full_name?.charAt(0) || 'U').toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-extrabold text-theme-text truncate">{user.full_name}</p>
                          <p className="text-[10px] text-theme-secondary font-mono truncate">{user.phone_number || user.email}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-theme-soft-mint text-theme-primary border border-theme-border">
                              {role || 'CITIZEN'}
                            </span>
                            <span className="text-[9px] font-bold text-theme-primary flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Verified</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Menu Options */}
                      <div className="space-y-1 text-xs font-semibold">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => openProfileWithTab('view')}
                          className="w-full text-left rtl:text-right px-3 py-2.5 rounded-xl hover:bg-theme-soft-mint hover:text-theme-primary transition flex items-center justify-between min-h-[44px]"
                        >
                          <span className="flex items-center gap-2.5">
                            <UserIcon className="w-4 h-4 text-theme-secondary" />
                            <span>{isUrdu ? 'پروفائل تفصیلات دیکھیں' : 'View Profile'}</span>
                          </span>
                          <span className="text-[10px] text-theme-secondary font-mono">⌘P</span>
                        </button>

                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => openProfileWithTab('edit')}
                          className="w-full text-left rtl:text-right px-3 py-2.5 rounded-xl hover:bg-theme-soft-mint hover:text-theme-primary transition flex items-center gap-2.5 min-h-[44px]"
                        >
                          <FileText className="w-4 h-4 text-theme-secondary" />
                          <span>{isUrdu ? 'پروفائل ترمیم کریں' : 'Edit Profile'}</span>
                        </button>

                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => openProfileWithTab('password')}
                          className="w-full text-left rtl:text-right px-3 py-2.5 rounded-xl hover:bg-theme-soft-mint hover:text-theme-primary transition flex items-center gap-2.5 min-h-[44px]"
                        >
                          <KeyRound className="w-4 h-4 text-theme-secondary" />
                          <span>{isUrdu ? 'پاس ورڈ تبدیل کریں' : 'Change Password'}</span>
                        </button>

                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setShowProfileMenu(false);
                            router.push(getProfilePath());
                          }}
                          className="w-full text-left rtl:text-right px-3 py-2.5 rounded-xl hover:bg-theme-soft-mint hover:text-theme-primary transition flex items-center gap-2.5 min-h-[44px]"
                        >
                          <Settings className="w-4 h-4 text-theme-secondary" />
                          <span>{isUrdu ? 'ترتیبات' : 'Settings'}</span>
                        </button>
                      </div>

                      {/* Quick Theme Switcher in Profile Menu */}
                      <div className="pt-2 mt-2 border-t border-theme-border/60">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-theme-secondary px-3 mb-1.5 flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5" />
                          <span>{isUrdu ? 'ڈسپلے تھیم' : 'Theme Preference'}</span>
                        </p>
                        <div className="px-1">
                          <ThemeSwitcher variant="full" />
                        </div>
                      </div>

                      {/* Logout Action */}
                      <div className="pt-2 mt-2 border-t border-theme-border/60">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleLogout}
                          className="w-full text-left rtl:text-right px-3 py-2.5 rounded-xl text-theme-error hover:bg-red-50 dark:hover:bg-red-950/40 transition flex items-center gap-2.5 font-bold min-h-[44px]"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>{isUrdu ? 'لاگ آؤٹ' : 'Sign Out'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Menu Drawer Toggle */}
              <button
                type="button"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="sm:hidden min-h-[44px] min-w-[44px] p-2 rounded-xl text-theme-secondary hover:text-theme-text hover:bg-theme-soft-mint transition flex items-center justify-center"
                aria-label="Toggle mobile menu"
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

            </div>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {showMobileMenu && (
          <div className="sm:hidden border-t border-theme-border bg-theme-surface p-4 space-y-4 animate-fadeIn">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-theme-secondary mb-2">
                {isUrdu ? 'ڈسپلے تھیم' : 'Theme Mode'}
              </p>
              <ThemeSwitcher variant="compact" className="w-full justify-between" />
            </div>

            {user && (
              <div className="pt-3 border-t border-theme-border space-y-3">
                <div className="flex items-center space-x-3 rtl:space-x-reverse p-3 bg-theme-bg rounded-2xl border border-theme-border">
                  <div className="w-10 h-10 rounded-xl bg-theme-soft-mint text-theme-primary flex items-center justify-center font-extrabold text-sm border border-theme-border overflow-hidden">
                    {user.profile_photo_url ? (
                      <img src={user.profile_photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (user.full_name?.charAt(0) || 'U').toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-theme-text truncate">{user.full_name}</p>
                    <p className="text-[10px] text-theme-secondary font-mono truncate">{user.phone_number || user.email}</p>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-theme-soft-mint text-theme-primary border border-theme-border inline-block mt-0.5">
                      {role || 'CITIZEN'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => openProfileWithTab('view')}
                    className="p-3 rounded-xl bg-theme-bg hover:bg-theme-soft-mint border border-theme-border text-theme-text flex items-center justify-center gap-1.5 min-h-[44px]"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-theme-primary" />
                    <span>{isUrdu ? 'پروفائل' : 'View Profile'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openProfileWithTab('edit')}
                    className="p-3 rounded-xl bg-theme-bg hover:bg-theme-soft-mint border border-theme-border text-theme-text flex items-center justify-center gap-1.5 min-h-[44px]"
                  >
                    <FileText className="w-3.5 h-3.5 text-theme-primary" />
                    <span>{isUrdu ? 'ترمیم' : 'Edit Profile'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openProfileWithTab('password')}
                    className="p-3 rounded-xl bg-theme-bg hover:bg-theme-soft-mint border border-theme-border text-theme-text flex items-center justify-center gap-1.5 min-h-[44px]"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-theme-primary" />
                    <span>{isUrdu ? 'پاس ورڈ' : 'Password'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-theme-error flex items-center justify-center gap-1.5 min-h-[44px]"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{isUrdu ? 'لاگ آؤٹ' : 'Logout'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-theme-surface rounded-3xl max-w-md w-full p-6 shadow-2xl border border-theme-border space-y-4 text-theme-text">
            <div className="flex items-center justify-between pb-3 border-b border-theme-border/60">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <div className="w-8 h-8 rounded-xl bg-theme-soft-mint flex items-center justify-center text-theme-primary">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-theme-text text-sm">
                  {isUrdu ? 'صفائی پے رہنمائی' : 'SafaiPay Platform Help'}
                </h3>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="text-theme-secondary hover:text-theme-text text-sm font-bold min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs text-theme-secondary leading-relaxed">
              <p>
                <strong className="text-theme-text">Customer:</strong> Select your recyclable material, upload an AI photo, verify your address, and receive deterministic payout upon digital scale weighing.
              </p>
              <p>
                <strong className="text-theme-text">Collector:</strong> Toggle Online mode, accept verified jobs in your neighborhood, weigh with calibrated sensors, and receive instant wallet credit.
              </p>
              <p>
                <strong className="text-theme-text">Recycler:</strong> Access aggregated, verified material lots with chain-of-custody tracking.
              </p>
              <p>
                <strong className="text-theme-text">Admin:</strong> Real-time oversight, operations ledger, dispatch fleet control, scrap pricing updates, and fraud management.
              </p>
              <p className="p-3 bg-theme-soft-mint text-theme-text rounded-xl font-medium border border-theme-border">
                Helpline: <strong>+92 (021) 3512-7000</strong> or email <strong>support@safaipay.org</strong>
              </p>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="w-full bg-theme-primary hover:opacity-90 text-white font-bold py-3 rounded-xl text-xs transition shadow-sm min-h-[44px]"
            >
              {isUrdu ? 'بند کریں' : 'Close Guide'}
            </button>
          </div>
        </div>
      )}

      {/* Unified Profile Modal (View, Edit, Change Password) */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        initialTab={profileModalTab}
      />
    </>
  );
};
