'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { UserRole } from '@/lib/types';
import { getDashboardPath, checkBackendHealth } from '@/lib/api';
import { SafaiPayLogo } from '@/components/SafaiPayLogo';
import { 
  Shield, 
  Truck, 
  UserCheck, 
  Factory, 
  LogOut, 
  Bell, 
  HelpCircle, 
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  backendOnline?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ backendOnline: propBackendOnline }) => {
  const { user, role, logout, isLoading } = useAuth();
  const { language, setLanguage, t, isUrdu } = useLanguage();
  const router = useRouter();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isBackendLive, setIsBackendLive] = useState<boolean>(propBackendOnline ?? false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
        (!document.documentElement.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDarkMode(isDark);
    }

    // Check health asynchronously
    checkBackendHealth().then((live) => {
      setIsBackendLive(live);
    }).catch(() => {
      setIsBackendLive(false);
    });
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', nextDark ? 'dark' : 'light');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <>
      <header className="border-b border-[#D5E6DD] bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-eco-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & Brand */}
            <div 
              className="flex items-center space-x-3 cursor-pointer select-none" 
              onClick={() => router.push(user ? getDashboardPath(role) : '/login')}
            >
              <SafaiPayLogo size="md" showWordmark={true} />
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#E6F4EC] text-[#146B4D] border border-[#D5E6DD]">
                {role ? role.toUpperCase() : 'PORTAL'}
              </span>
            </div>

            {/* Verified Active Portal Badge (Desktop) */}
            {role && (
              <div className="hidden lg:flex items-center space-x-2 bg-[#F4FAF7] px-3.5 py-1.5 rounded-full border border-[#D5E6DD]">
                <span className="w-2 h-2 rounded-full bg-[#1B7F5C]" />
                <span className="text-xs font-bold text-[#0F3D3E] capitalize">
                  {role} Portal
                </span>
              </div>
            )}

            {/* Actions: Theme Toggle, Language Switcher, Notifications, Help, Profile */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              
              {/* Dark Mode Manual Toggle */}
              <button
                type="button"
                onClick={toggleDarkMode}
                className="p-2 rounded-xl text-[#5B6B66] hover:text-[#0F3D3E] hover:bg-[#E6F4EC] transition"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-[#F2A900]" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Language Switcher Toggle */}
              <div className="flex items-center bg-[#F4FAF7] border border-[#D5E6DD] rounded-xl p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-1 text-xs font-bold rounded-lg transition ${
                    language === 'en'
                      ? 'bg-[#1B7F5C] text-white shadow-xs'
                      : 'text-[#0F3D3E] hover:bg-[#E6F4EC]'
                  }`}
                  title="Switch to English"
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('ur')}
                  className={`px-2 py-1 text-xs font-bold rounded-lg transition ${
                    language === 'ur'
                      ? 'bg-[#1B7F5C] text-white shadow-xs'
                      : 'text-[#0F3D3E] hover:bg-[#E6F4EC]'
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
                  className="p-2 rounded-xl text-[#5B6B66] hover:text-[#0F3D3E] hover:bg-[#E6F4EC] transition relative"
                  title={t('nav.notifications')}
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#2FA37A] ring-2 ring-white" />
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-[#D5E6DD] p-4 z-50 text-[#0F3D3E]">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#D5E6DD]/60">
                      <h4 className="text-xs font-bold text-[#0F3D3E]">{t('nav.notifications')}</h4>
                      <span className="text-[10px] bg-[#E6F4EC] text-[#146B4D] px-2 py-0.5 rounded-full font-bold">3 New</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="p-2 bg-[#F4FAF7] rounded-xl border border-[#D5E6DD] flex items-start space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-[#1B7F5C] shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-[#0F3D3E]">PET Plastic Weighed</p>
                          <p className="text-[11px] text-[#5B6B66]">10.5 kg verified on scale. Rs 840 paid.</p>
                        </div>
                      </div>
                      <div className="p-2 bg-[#F4FAF7] rounded-xl border border-[#D5E6DD] flex items-start space-x-2">
                        <Sparkles className="w-4 h-4 text-[#1B7F5C] shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-[#0F3D3E]">Rate Index Updated</p>
                          <p className="text-[11px] text-[#5B6B66]">PET benchmark adjusted to Rs 80.00/kg.</p>
                        </div>
                      </div>
                      <div className="p-2 bg-[#F4FAF7] rounded-xl border border-[#D5E6DD] flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-[#F2A900] shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-[#0F3D3E]">Quality Check</p>
                          <p className="text-[11px] text-[#5B6B66]">Dry sorted cardboard batch ready for pickup.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Help & Support */}
              <button
                onClick={() => setShowHelp(true)}
                className="p-2 rounded-xl text-[#5B6B66] hover:text-[#0F3D3E] hover:bg-[#E6F4EC] transition hidden sm:inline-flex"
                title={t('nav.help')}
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              {/* API Online Badge */}
              <div className="hidden sm:flex items-center space-x-1.5 text-xs bg-white px-2.5 py-1 rounded-full border border-[#D5E6DD] shadow-2xs">
                <span className="flex h-2 w-2 relative">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isBackendLive ? 'bg-[#2FA37A]' : 'bg-[#1B7F5C]'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isBackendLive ? 'bg-[#1B7F5C]' : 'bg-[#146B4D]'
                    }`}
                  />
                </span>
                <span className="text-[10px] font-bold text-[#146B4D]">
                  {isBackendLive ? 'API CONNECTED' : 'SYSTEM ONLINE'}
                </span>
              </div>

              {/* Profile & Logout */}
              {user && (
                <div className="flex items-center space-x-2 pl-2 border-l border-[#D5E6DD]">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-[#0F3D3E] leading-tight">
                      {user.full_name || 'Pilot User'}
                    </p>
                    <p className="text-[10px] text-[#1B7F5C] font-mono font-medium">
                      {user.phone_number || user.email}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    title={t('nav.logout')}
                    className="p-2 text-[#5B6B66] hover:text-[#C0392B] hover:bg-red-50 rounded-xl transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </header>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#D5E6DD] space-y-4 text-[#0F3D3E]">
            <div className="flex items-center justify-between pb-3 border-b border-[#D5E6DD]/60">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[#E6F4EC] flex items-center justify-center text-[#1B7F5C]">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-[#0F3D3E] text-sm">
                  {isUrdu ? 'صفائی پے رہنمائی' : 'SafaiPay Platform Help'}
                </h3>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="text-[#5B6B66] hover:text-[#0F3D3E] text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs text-[#3F5A52] leading-relaxed">
              <p>
                <strong>Customer:</strong> Select your recyclable material, upload an AI photo, verify your address, and receive deterministic payout upon digital scale weighing.
              </p>
              <p>
                <strong>Collector:</strong> Toggle Online mode, accept verified jobs in your neighborhood, weigh with calibrated sensors, and receive instant wallet credit.
              </p>
              <p>
                <strong>Recycler:</strong> Access aggregated, verified material lots with chain-of-custody tracking.
              </p>
              <p>
                <strong>Admin:</strong> Real-time oversight, operations ledger, dispatch fleet control, scrap pricing updates, and fraud management.
              </p>
              <p className="p-3 bg-[#E6F4EC] text-[#0F3D3E] rounded-xl font-medium border border-[#D5E6DD]">
                Helpline: <strong>+92 (021) 3512-7000</strong> or email <strong>support@safaipay.org</strong>
              </p>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="w-full bg-[#1B7F5C] hover:bg-[#146B4D] text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
            >
              {isUrdu ? 'بند کریں' : 'Close Guide'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
