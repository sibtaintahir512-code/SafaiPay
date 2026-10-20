'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  CheckCheck, 
  Truck, 
  Scale, 
  TrendingUp, 
  Building2, 
  PackageCheck, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  X,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { 
  fetchUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  AppNotificationItem 
} from '@/lib/api';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadChange?: (unreadCount: number) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  onUnreadChange,
}) => {
  const router = useRouter();
  const { isUrdu } = useLanguage();
  const [notifications, setNotifications] = useState<AppNotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMarkingAll, setIsMarkingAll] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);

  // Format relative timestamp
  const formatTimeAgo = (dateStr: string) => {
    try {
      const now = Date.now();
      const past = new Date(dateStr).getTime();
      const diffSecs = Math.max(0, Math.floor((now - past) / 1000));

      if (diffSecs < 60) return isUrdu ? 'ابھی' : 'Just now';
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ${isUrdu ? 'پہلے' : 'ago'}`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ${isUrdu ? 'پہلے' : 'ago'}`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ${isUrdu ? 'پہلے' : 'ago'}`;
    } catch {
      return '';
    }
  };

  const loadNotifications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchUserNotifications();
      setNotifications(data);
      const unread = data.filter((n) => !n.is_read).length;
      if (onUnreadChange) onUnreadChange(unread);
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
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

  const handleMarkOne = async (item: AppNotificationItem) => {
    if (item.is_read) {
      if (item.link) {
        onClose();
        router.push(item.link);
      }
      return;
    }

    setMarkingId(item.id);
    try {
      await markNotificationAsRead(item.id);
      const updated = notifications.map((n) =>
        n.id === item.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
      );
      setNotifications(updated);
      const unread = updated.filter((n) => !n.is_read).length;
      if (onUnreadChange) onUnreadChange(unread);

      if (item.link) {
        onClose();
        router.push(item.link);
      }
    } catch (err) {
      console.error('Failed to mark read', err);
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAll = async () => {
    setIsMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      const updated = notifications.map((n) => ({
        ...n,
        is_read: true,
        read_at: new Date().toISOString(),
      }));
      setNotifications(updated);
      if (onUnreadChange) onUnreadChange(0);
    } catch (err: any) {
      setError(err.message || 'Failed to mark all as read.');
    } finally {
      setIsMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getNotificationIcon = (type: string) => {
    const t = (type || '').toUpperCase();
    if (t.includes('PICKUP') || t.includes('JOB')) {
      return <Truck className="w-4 h-4 text-theme-primary" />;
    }
    if (t.includes('SCALE') || t.includes('WEIGHT')) {
      return <Scale className="w-4 h-4 text-theme-success" />;
    }
    if (t.includes('PRICE') || t.includes('RATE')) {
      return <TrendingUp className="w-4 h-4 text-theme-yellow" />;
    }
    if (t.includes('MARKET') || t.includes('BATCH')) {
      return <Building2 className="w-4 h-4 text-theme-primary" />;
    }
    if (t.includes('DISPATCH')) {
      return <PackageCheck className="w-4 h-4 text-theme-bright-green" />;
    }
    if (t.includes('FRAUD') || t.includes('ALERT')) {
      return <AlertTriangle className="w-4 h-4 text-theme-error" />;
    }
    return <ShieldCheck className="w-4 h-4 text-theme-primary" />;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop Overlay (only on screens < sm) */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-2xs z-50 sm:hidden animate-fadeIn" 
        onClick={onClose} 
      />

      {/* Main Panel: Bottom Sheet on Mobile (<sm), Popover on Desktop (>=sm) */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label={isUrdu ? 'اطلاعات' : 'Notifications'}
        className="fixed bottom-0 inset-x-0 sm:inset-x-auto sm:bottom-auto sm:top-16 sm:right-6 sm:rtl:right-auto sm:rtl:left-6 z-50 w-full sm:w-[400px] max-w-full sm:max-w-[calc(100vw-24px)] bg-theme-surface rounded-t-3xl sm:rounded-2xl shadow-2xl border border-theme-border flex flex-col max-h-[85vh] sm:max-h-[540px] animate-slideUp sm:animate-fadeIn overflow-hidden text-theme-text"
      >
        {/* Mobile Drag Handle */}
        <div className="pt-3 pb-1 sm:hidden flex justify-center">
          <div className="w-12 h-1.5 rounded-full bg-theme-border" />
        </div>

        {/* Header */}
        <div className="p-4 border-b border-theme-border flex items-center justify-between shrink-0 bg-theme-bg/50">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <div className="w-8 h-8 rounded-xl bg-theme-soft-mint text-theme-primary flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-theme-text">
                {isUrdu ? 'اطلاعات' : 'Notifications'}
              </h3>
              <p className="text-[11px] text-theme-secondary">
                {unreadCount > 0
                  ? `${unreadCount} ${isUrdu ? 'غیر پڑھی گئی اطلاعات' : 'unread notifications'}`
                  : isUrdu ? 'سب پڑھ چکے ہیں' : 'All caught up'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                disabled={isMarkingAll}
                className="px-2.5 py-1 text-xs font-bold text-theme-primary hover:text-theme-primary-dark hover:bg-theme-soft-mint rounded-lg transition disabled:opacity-50 min-h-[36px] flex items-center gap-1"
                title={isUrdu ? 'سب پڑھا ہوا نشان زد کریں' : 'Mark all as read'}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">{isUrdu ? 'سب پڑھ لیا' : 'Mark all read'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-theme-secondary hover:text-theme-text hover:bg-theme-soft-mint transition min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Close notifications"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto flex-1 p-3 space-y-2 divide-y divide-theme-border/40">
          {isLoading ? (
            <div className="space-y-3 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-start space-x-3 p-3 rounded-xl bg-theme-bg/60">
                  <div className="w-8 h-8 rounded-lg bg-theme-border/60 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-theme-border/60 rounded w-3/4" />
                    <div className="h-2.5 bg-theme-border/40 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-theme-error mx-auto opacity-80" />
              <p className="text-xs text-theme-secondary">{error}</p>
              <button
                type="button"
                onClick={loadNotifications}
                className="px-3 py-1.5 bg-theme-soft-mint text-theme-primary text-xs font-bold rounded-xl hover:bg-theme-primary hover:text-white transition"
              >
                {isUrdu ? 'دوبارہ کوشش کریں' : 'Try Again'}
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-theme-soft-mint text-theme-primary flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-bold text-theme-text">
                {isUrdu ? 'کوئی نئی اطلاع نہیں ہے' : 'No notifications yet'}
              </h4>
              <p className="text-[11px] text-theme-secondary max-w-xs mx-auto">
                {isUrdu 
                  ? 'آپ کے تمام پک اپس اور والٹ ادائیگیوں کی اپ ڈیٹس یہاں ظاہر ہوں گی۔' 
                  : 'Updates on your pickups, scale measurements, and earnings will appear here.'}
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleMarkOne(item)}
                className={`pt-2.5 first:pt-0 p-3 rounded-xl transition cursor-pointer flex items-start space-x-3 rtl:space-x-reverse ${
                  !item.is_read
                    ? 'bg-theme-soft-mint/40 dark:bg-theme-soft-mint/20 border border-theme-primary/30 shadow-2xs'
                    : 'hover:bg-theme-bg/80'
                }`}
              >
                {/* Icon */}
                <div className="w-8 h-8 rounded-lg bg-theme-surface border border-theme-border flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  {getNotificationIcon(item.type || item.notification_type || '')}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs leading-snug truncate ${!item.is_read ? 'font-black text-theme-text' : 'font-semibold text-theme-text/90'}`}>
                      {item.title}
                    </p>
                    <span className="text-[10px] text-theme-secondary shrink-0 flex items-center gap-1 font-mono">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{formatTimeAgo(item.created_at)}</span>
                    </span>
                  </div>

                  <p className="text-[11px] text-theme-secondary mt-1 leading-relaxed line-clamp-2">
                    {item.message}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-1">
                    {item.link ? (
                      <span className="text-[10px] text-theme-primary font-bold flex items-center gap-1">
                        <span>{isUrdu ? 'تفصیلات دیکھیں' : 'View Details'}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    ) : <span />}

                    {!item.is_read && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-theme-primary text-white">
                        {isUrdu ? 'نئی' : 'Unread'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Note */}
        <div className="p-3 bg-theme-bg/60 border-t border-theme-border text-center shrink-0">
          <p className="text-[10px] text-theme-secondary">
            {isUrdu ? 'تمام الرٹس اور مالیاتی رسیدیں مصدقہ ہیں' : 'Certified SafaiPay telematics & ledger alerts'}
          </p>
        </div>
      </div>
    </>
  );
};
