'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useLanguage, Language } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { getDashboardPath, checkBackendHealth, fetchUnreadCount } from '@/lib/api';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { ProfileModal, ProfileModalTab } from '@/components/ProfileModal';
import { NotificationPanel } from '@/components/NotificationPanel';
import { ProfileDropdown } from '@/components/ProfileDropdown';
import { 
  Bell, 
  HelpCircle, 
  ChevronDown, 
  Menu, 
  X, 
  User as UserIcon, 
  FileText, 
  KeyRound, 
  LogOut,
  Globe,
  MessageSquare
} from 'lucide-react';
import { fetchChatUnreadCount } from '@/lib/chatApi';

interface NavbarProps {
  backendOnline?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ backendOnline: propBackendOnline }) => {
  const { user, role, logout } = useAuth();
  const { language, setLanguage, t, isUrdu } = useLanguage();
  const { resolvedTheme } = useTheme();
  const router = useRouter();

  const isDark = resolvedTheme === 'dark';

  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [chatUnreadCount, setChatUnreadCount] = useState<number>(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<ProfileModalTab>('view');
  const [isBackendLive, setIsBackendLive] = useState<boolean>(propBackendOnline ?? false);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Health check
    checkBackendHealth().then((live) => {
      setIsBackendLive(live);
    }).catch(() => {
      setIsBackendLive(false);
    });

    // Fetch initial unread count
    if (user) {
      fetchUnreadCount().then((cnt) => setUnreadCount(cnt)).catch(() => {});
      fetchChatUnreadCount().then((cnt) => setChatUnreadCount(cnt)).catch(() => {});
    } else {
      setUnreadCount(0);
      setChatUnreadCount(0);
    }

    // Close menus on click / touch outside
    const handleClickOutside = (event: Event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    // Close on Escape key and restore focus
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowProfileMenu(false);
        setShowNotifications(false);
        setShowMobileMenu(false);
        profileButtonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [user]);

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

  const handleHomeClick = () => {
    router.push(user ? getDashboardPath(role) : '/login');
  };

  // Portal sub-label text
  const portalLabel = role ? `${role.toUpperCase()} PORTAL` : 'RECYCLER PORTAL';

  return (
    <>
      {/* Page Wrapper: Full width, sticky top 0, z-index 40 */}
      <header
        className="w-full sticky top-0 z-40 transition-colors duration-150 py-3 sm:py-5 px-3 sm:px-6 select-none"
        style={{ backgroundColor: 'var(--pill-page-bg)' }}
      >
        {/* Floating Pill: 72px (60px mobile), 36px radius (30px mobile), exact colors */}
        <nav
          role="navigation"
          aria-label="Main Navigation"
          className="max-w-7xl mx-auto h-[60px] md:h-[72px] rounded-[30px] md:rounded-[36px] px-3 md:px-[14px] md:pl-[18px] rtl:md:pr-[18px] rtl:md:pl-[14px] flex items-center gap-2 md:gap-4 transition-all duration-150"
          style={{
            backgroundColor: 'var(--pill-bg)',
            border: '1px solid var(--pill-border)',
            color: 'var(--pill-text)',
            boxShadow: 'var(--pill-shadow)',
          }}
        >
          {/* 1. SafaiPay Logo Lockup & Portal Sub-label */}
          <div
            role="button"
            tabIndex={0}
            onClick={handleHomeClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleHomeClick();
              }
            }}
            className="flex items-center gap-3 cursor-pointer group pill-focus rounded-full p-1 -m-1 shrink-0"
            aria-label="SafaiPay - Go to Dashboard"
          >
            {/* Logo Mark: 24px, correct asset based on theme, no orange dot */}
            <div className="w-[24px] h-[24px] shrink-0 flex items-center justify-center">
              <Image
                src={isDark ? '/logo/safaipay-mark-small.svg' : '/logo/safaipay-mark-light.svg'}
                alt="SafaiPay"
                width={24}
                height={24}
                priority
                className="w-[24px] h-[24px] object-contain group-hover:scale-105 transition-transform duration-150"
              />
            </div>

            {/* Wordmark and Portal Sub-label */}
            <div className="flex flex-col justify-center">
              <span className="font-sans font-extrabold text-[18px] tracking-[-0.02em] leading-none">
                <span style={{ color: isDark ? '#E8F3EE' : '#12302A' }}>Safai</span>
                <span style={{ color: isDark ? '#9FE6C6' : '#1B7F5C' }}>Pay</span>
              </span>
              
              {/* Recycler Portal Sub-label: >=1100px visible, hidden <1100px */}
              <span
                className="hidden min-[1100px]:block text-[11px] font-bold tracking-[0.12em] uppercase leading-tight mt-0.5"
                style={{ color: isDark ? '#8FD9B4' : '#4B6B60' }}
              >
                {portalLabel}
              </span>
            </div>
          </div>

          {/* 2. Flex Spacer */}
          <div className="flex-1" />

          {/* 3. API LIVE Status Chip */}
          <div
            className="hidden md:inline-flex items-center h-[44px] px-[14px] rounded-[22px] transition-colors duration-150 select-none shrink-0"
            style={{
              backgroundColor: isDark ? '#07110F' : '#E3F4EB',
            }}
            title={isBackendLive ? 'API LIVE: Server Operational' : 'API OFFLINE: Sandbox Mode'}
            aria-label={isBackendLive ? 'API status: Live' : 'API status: Offline'}
          >
            <span
              className="w-[8px] h-[8px] rounded-full shrink-0 animate-pulse"
              style={{
                backgroundColor: isBackendLive
                  ? isDark ? '#6CCB9D' : '#1F7A55'
                  : isDark ? '#FF8B8B' : '#D64545',
              }}
            />
            {/* Text hidden on 768px-1099px, visible on >=1100px */}
            <span
              className="hidden min-[1100px]:inline text-[12px] font-bold tracking-[0.08em] ml-2 rtl:mr-2 rtl:ml-0"
              style={{
                color: isBackendLive
                  ? isDark ? '#8FD9B4' : '#17603F'
                  : isDark ? '#FF8B8B' : '#D64545',
              }}
            >
              {isBackendLive ? 'API LIVE' : 'SANDBOX'}
            </span>
          </div>

          {/* 4. Light/Dark Icon-Only Toggle: Strictly 2 options */}
          <div className="hidden md:inline-flex shrink-0">
            <ThemeSwitcher variant="pill" />
          </div>

          {/* 5. Language Control: Single 44px Pill (EN · اردو) */}
          <div
            className="hidden md:inline-flex items-center h-[44px] px-1 rounded-[22px] transition-colors duration-150 shrink-0"
            style={{
              backgroundColor: isDark ? '#07110F' : '#EEF6F2',
            }}
            role="group"
            aria-label="Language selector"
          >
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className="h-[36px] px-3 rounded-[18px] text-[12px] font-bold transition-all duration-150 pill-focus"
              style={{
                backgroundColor: language === 'en' ? (isDark ? '#6CCB9D' : '#1F7A55') : 'transparent',
                color: language === 'en'
                  ? (isDark ? '#07110F' : '#FFFFFF')
                  : (isDark ? '#9FB8AF' : '#4B6B60'),
              }}
              aria-label="Switch to English"
              aria-pressed={language === 'en'}
            >
              EN
            </button>
            <span
              className="text-[11px] font-semibold px-0.5 select-none"
              style={{ color: isDark ? '#234239' : '#CFE0D8' }}
            >
              ·
            </span>
            <button
              type="button"
              onClick={() => setLanguage('ur')}
              className="h-[36px] px-3 rounded-[18px] text-[12px] font-bold transition-all duration-150 pill-focus"
              style={{
                backgroundColor: language === 'ur' ? (isDark ? '#6CCB9D' : '#1F7A55') : 'transparent',
                color: language === 'ur'
                  ? (isDark ? '#07110F' : '#FFFFFF')
                  : (isDark ? '#9FB8AF' : '#4B6B60'),
              }}
              aria-label="اردو میں تبدیل کریں"
              aria-pressed={language === 'ur'}
            >
              اردو
            </button>
          </div>

          {/* 6. Notification Bell: 44px x 44px round button, mint unread dot */}
          <div className="relative shrink-0" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="w-[44px] h-[44px] rounded-full flex items-center justify-center transition-colors duration-150 relative pill-focus hover:opacity-85"
              style={{
                color: isDark ? '#C9DDD4' : '#12302A',
                backgroundColor: isDark ? '#142C26' : '#EEF6F2',
              }}
              aria-label={
                unreadCount > 0
                  ? (isUrdu ? `اطلاعات، ${unreadCount} نئی` : `Notifications, ${unreadCount} unread`)
                  : (isUrdu ? 'اطلاعات' : 'Notifications')
              }
              title={t('nav.notifications')}
            >
              <Bell className="w-5 h-5 stroke-[1.8] stroke-linecap-round stroke-linejoin-round" />
              
              {/* Unread Indicator: 9px mint dot, 2px ring using button background, NEVER gold/orange */}
              {unreadCount > 0 && (
                <span
                  className="absolute top-2 right-2 w-[9px] h-[9px] rounded-full ring-2"
                  style={{
                    backgroundColor: isDark ? '#9FE6C6' : '#1F7A55',
                    // Ring matches button background
                    boxShadow: isDark
                      ? '0 0 0 2px #142C26'
                      : '0 0 0 2px #EEF6F2',
                  }}
                  aria-hidden="true"
                />
              )}
            </button>

            {/* Notification Panel */}
            <NotificationPanel
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
              onUnreadChange={(count) => setUnreadCount(count)}
            />
          </div>

          {/* 6.5. Real-Time Chat Button */}
          {user && (
            <button
              type="button"
              onClick={() => router.push('/chat')}
              className="w-[44px] h-[44px] rounded-full flex items-center justify-center transition-colors duration-150 relative pill-focus hover:opacity-85 shrink-0"
              style={{
                color: isDark ? '#C9DDD4' : '#12302A',
                backgroundColor: isDark ? '#142C26' : '#EEF6F2',
              }}
              aria-label={
                chatUnreadCount > 0
                  ? (isUrdu ? `پیغامات، ${chatUnreadCount} نئے` : `Messages, ${chatUnreadCount} unread`)
                  : (isUrdu ? 'پیغامات' : 'Messages')
              }
              title={isUrdu ? 'پیغامات' : 'Messages'}
            >
              <MessageSquare className="w-5 h-5 stroke-[1.8] stroke-linecap-round stroke-linejoin-round" />
              {chatUnreadCount > 0 && (
                <span
                  className="absolute top-2 right-2 w-[9px] h-[9px] rounded-full ring-2"
                  style={{
                    backgroundColor: isDark ? '#9FE6C6' : '#1F7A55',
                    boxShadow: isDark
                      ? '0 0 0 2px #142C26'
                      : '0 0 0 2px #EEF6F2',
                  }}
                  aria-hidden="true"
                />
              )}
            </button>
          )}

          {/* 7. Help Icon: 44px x 44px round button, matching notification styling */}
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="w-[44px] h-[44px] rounded-full hidden md:flex items-center justify-center transition-colors duration-150 pill-focus hover:opacity-85 shrink-0"
            style={{
              color: isDark ? '#C9DDD4' : '#12302A',
              backgroundColor: isDark ? '#142C26' : '#EEF6F2',
            }}
            title={t('nav.help')}
            aria-label="Help and platform guidelines"
          >
            <HelpCircle className="w-5 h-5 stroke-[1.8] stroke-linecap-round stroke-linejoin-round" />
          </button>

          {/* 8. Profile Card: 52px height, 26px radius, responsive states */}
          {user && (
            <div className="relative shrink-0" ref={profileMenuRef}>
              <button
                ref={profileButtonRef}
                type="button"
                onClick={() => {
                  setShowProfileMenu((prev) => !prev);
                  setShowNotifications(false);
                }}
                className="h-[44px] md:h-[52px] rounded-[22px] md:rounded-[26px] pl-[4px] md:pl-[6px] pr-2 md:pr-[14px] rtl:pl-2 rtl:pr-[4px] rtl:md:pr-[6px] rtl:md:pl-[14px] flex items-center gap-2.5 transition-all duration-150 pill-focus hover:opacity-95"
                style={{
                  backgroundColor: isDark ? '#1A362F' : '#FFFFFF',
                  border: isDark ? 'none' : '1px solid #CFE0D8',
                }}
                aria-expanded={showProfileMenu}
                aria-haspopup="menu"
                aria-controls="profile-dropdown-menu"
                aria-label={isUrdu ? 'صارف اکاؤنٹ مینو' : 'User profile and settings'}
              >
                {/* 40px Circular Avatar */}
                <div
                  className="w-[36px] h-[36px] md:w-[40px] md:h-[40px] rounded-full flex items-center justify-center font-extrabold text-[13px] md:text-[14px] shrink-0 overflow-hidden"
                  style={{
                    backgroundColor: isDark ? '#6CCB9D' : '#1F7A55',
                    color: isDark ? '#07110F' : '#FFFFFF',
                  }}
                >
                  {user.profile_photo_url ? (
                    <img src={user.profile_photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (user.full_name?.charAt(0) || 'U').toUpperCase()
                  )}
                </div>

                {/* Business / User Details: >=1100px visible, hidden on 768px-1099px */}
                <div className="hidden min-[1100px]:flex flex-col text-left rtl:text-right min-w-0">
                  <span
                    className="text-[14px] font-[800] leading-tight truncate max-w-[170px]"
                    style={{ color: isDark ? '#E8F3EE' : '#12302A' }}
                  >
                    {user.full_name || 'Pilot User'}
                  </span>
                  <span
                    className="text-[12px] font-mono leading-tight truncate max-w-[170px]"
                    style={{ color: isDark ? '#8FD9B4' : '#6B817C' }}
                  >
                    {user.phone_number || user.email}
                  </span>
                </div>

                {/* 16px Chevron-down */}
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-150 ${showProfileMenu ? 'rotate-180' : ''}`}
                  style={{ color: isDark ? '#8FD9B4' : '#4B6B60' }}
                />
              </button>

              {/* Profile Dropdown Menu */}
              <ProfileDropdown
                isOpen={showProfileMenu}
                onClose={() => setShowProfileMenu(false)}
                onOpenModalTab={(tab) => {
                  setProfileModalTab(tab);
                  setProfileModalOpen(true);
                }}
              />
            </div>
          )}

          {/* 9. Mobile Overflow Menu Button (<768px) */}
          <button
            type="button"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden w-[44px] h-[44px] rounded-full flex items-center justify-center transition-colors duration-150 pill-focus"
            style={{
              color: isDark ? '#C9DDD4' : '#12302A',
              backgroundColor: isDark ? '#142C26' : '#EEF6F2',
            }}
            aria-label="Toggle navigation menu"
          >
            {showMobileMenu ? <X className="w-5 h-5 stroke-[1.8]" /> : <Menu className="w-5 h-5 stroke-[1.8]" />}
          </button>
        </nav>

        {/* Mobile Overflow Drawer (<768px) */}
        {showMobileMenu && (
          <div
            className="md:hidden mt-3 max-w-7xl mx-auto rounded-[24px] p-4 space-y-4 border transition-all duration-150 shadow-lg"
            style={{
              backgroundColor: 'var(--pill-bg)',
              borderColor: 'var(--pill-border)',
              color: 'var(--pill-text)',
            }}
          >
            {/* Status and Portal Header */}
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--pill-border)' }}>
              <div className="flex items-center gap-2">
                <span
                  className="w-[8px] h-[8px] rounded-full animate-pulse"
                  style={{
                    backgroundColor: isBackendLive
                      ? isDark ? '#6CCB9D' : '#1F7A55'
                      : isDark ? '#FF8B8B' : '#D64545',
                  }}
                />
                <span
                  className="text-[12px] font-bold tracking-[0.08em]"
                  style={{
                    color: isBackendLive
                      ? isDark ? '#8FD9B4' : '#17603F'
                      : isDark ? '#FF8B8B' : '#D64545',
                  }}
                >
                  {isBackendLive ? 'API LIVE' : 'SANDBOX'}
                </span>
              </div>

              <span
                className="text-[11px] font-bold tracking-[0.12em] uppercase px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: isDark ? '#142C26' : '#EEF6F2',
                  color: isDark ? '#8FD9B4' : '#4B6B60',
                }}
              >
                {portalLabel}
              </span>
            </div>

            {/* Theme & Language Controls Row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Theme Toggle in Mobile Drawer */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: isDark ? '#8FD9B4' : '#4B6B60' }}>
                  {isUrdu ? 'تھیم' : 'Theme'}
                </p>
                <ThemeSwitcher variant="pill" className="w-full justify-around" />
              </div>

              {/* Language Toggle in Mobile Drawer */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: isDark ? '#8FD9B4' : '#4B6B60' }}>
                  {isUrdu ? 'زبان' : 'Language'}
                </p>
                <div
                  className="flex items-center h-[48px] px-1 rounded-[24px] justify-around"
                  style={{ backgroundColor: isDark ? '#07110F' : '#EEF6F2' }}
                >
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className="flex-1 h-[40px] rounded-[20px] text-xs font-bold transition-all"
                    style={{
                      backgroundColor: language === 'en' ? (isDark ? '#6CCB9D' : '#1F7A55') : 'transparent',
                      color: language === 'en' ? (isDark ? '#07110F' : '#FFFFFF') : (isDark ? '#9FB8AF' : '#4B6B60'),
                    }}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('ur')}
                    className="flex-1 h-[40px] rounded-[20px] text-xs font-bold transition-all"
                    style={{
                      backgroundColor: language === 'ur' ? (isDark ? '#6CCB9D' : '#1F7A55') : 'transparent',
                      color: language === 'ur' ? (isDark ? '#07110F' : '#FFFFFF') : (isDark ? '#9FB8AF' : '#4B6B60'),
                    }}
                  >
                    اردو
                  </button>
                </div>
              </div>
            </div>

            {/* Help Button in Drawer */}
            <button
              type="button"
              onClick={() => {
                setShowMobileMenu(false);
                setShowHelp(true);
              }}
              className="w-full h-[44px] rounded-2xl flex items-center justify-center gap-2 font-bold text-xs transition-colors"
              style={{
                backgroundColor: isDark ? '#142C26' : '#EEF6F2',
                color: isDark ? '#E8F3EE' : '#12302A',
              }}
            >
              <HelpCircle className="w-4 h-4" />
              <span>{t('nav.help')}</span>
            </button>

            {/* Messages / Chat Link in Mobile Drawer */}
            {user && (
              <button
                type="button"
                onClick={() => {
                  setShowMobileMenu(false);
                  router.push('/chat');
                }}
                className="w-full h-[44px] rounded-2xl flex items-center justify-between px-4 font-bold text-xs transition-colors"
                style={{
                  backgroundColor: isDark ? '#142C26' : '#EEF6F2',
                  color: isDark ? '#E8F3EE' : '#12302A',
                }}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{isUrdu ? 'پیغامات (چیٹ)' : 'Messages (Chat)'}</span>
                </div>
                {chatUnreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                    {chatUnreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Mobile Profile Actions */}
            {user && (
              <div className="pt-3 border-t space-y-2" style={{ borderColor: 'var(--pill-border)' }}>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => openProfileWithTab('view')}
                    className="h-[44px] rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    style={{
                      backgroundColor: isDark ? '#142C26' : '#EEF6F2',
                      color: isDark ? '#E8F3EE' : '#12302A',
                    }}
                  >
                    <UserIcon className="w-3.5 h-3.5" style={{ color: isDark ? '#6CCB9D' : '#1F7A55' }} />
                    <span>{isUrdu ? 'پروفائل' : 'View Profile'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openProfileWithTab('edit')}
                    className="h-[44px] rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    style={{
                      backgroundColor: isDark ? '#142C26' : '#EEF6F2',
                      color: isDark ? '#E8F3EE' : '#12302A',
                    }}
                  >
                    <FileText className="w-3.5 h-3.5" style={{ color: isDark ? '#6CCB9D' : '#1F7A55' }} />
                    <span>{isUrdu ? 'ترمیم' : 'Edit Profile'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openProfileWithTab('password')}
                    className="h-[44px] rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    style={{
                      backgroundColor: isDark ? '#142C26' : '#EEF6F2',
                      color: isDark ? '#E8F3EE' : '#12302A',
                    }}
                  >
                    <KeyRound className="w-3.5 h-3.5" style={{ color: isDark ? '#6CCB9D' : '#1F7A55' }} />
                    <span>{isUrdu ? 'پاس ورڈ' : 'Password'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="h-[44px] rounded-xl flex items-center justify-center gap-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="rounded-[28px] max-w-md w-full p-6 shadow-2xl border space-y-4"
            style={{
              backgroundColor: 'var(--pill-bg)',
              borderColor: 'var(--pill-border)',
              color: 'var(--pill-text)',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--pill-border)' }}>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: isDark ? '#142C26' : '#EEF6F2',
                    color: isDark ? '#6CCB9D' : '#1F7A55',
                  }}
                >
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-sm">
                  {isUrdu ? 'صفائی پے رہنمائی' : 'SafaiPay Platform Help'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="w-[44px] h-[44px] rounded-full flex items-center justify-center font-bold text-sm pill-focus"
                style={{ color: isDark ? '#9FB8AF' : '#4B6B60' }}
                aria-label="Close Help"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs leading-relaxed" style={{ color: isDark ? '#A9C2B9' : '#6B817C' }}>
              <p>
                <strong style={{ color: isDark ? '#E8F3EE' : '#12302A' }}>Customer:</strong> Select your recyclable material, upload an AI photo, verify your address, and receive deterministic payout upon digital scale weighing.
              </p>
              <p>
                <strong style={{ color: isDark ? '#E8F3EE' : '#12302A' }}>Collector:</strong> Toggle Online mode, accept verified jobs in your neighborhood, weigh with calibrated sensors, and receive instant wallet credit.
              </p>
              <p>
                <strong style={{ color: isDark ? '#E8F3EE' : '#12302A' }}>Recycler:</strong> Access aggregated, verified material lots with chain-of-custody tracking.
              </p>
              <p>
                <strong style={{ color: isDark ? '#E8F3EE' : '#12302A' }}>Admin:</strong> Real-time oversight, operations ledger, dispatch fleet control, scrap pricing updates, and fraud management.
              </p>
              <div
                className="p-3.5 rounded-2xl font-medium border text-xs"
                style={{
                  backgroundColor: isDark ? '#142C26' : '#EEF6F2',
                  borderColor: isDark ? '#234239' : '#DCE9E2',
                  color: isDark ? '#E8F3EE' : '#12302A',
                }}
              >
                Helpline: <strong>+92 (021) 3512-7000</strong> or email <strong>support@safaipay.org</strong>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="w-full h-[44px] rounded-xl font-bold text-xs transition duration-150 shadow-sm pill-focus"
              style={{
                backgroundColor: isDark ? '#6CCB9D' : '#1F7A55',
                color: isDark ? '#07110F' : '#FFFFFF',
              }}
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
