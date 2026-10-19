'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ur';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultText?: string) => string;
  isUrdu: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.book_pickup': 'Book Pickup',
    'nav.my_pickups': 'My Pickups',
    'nav.earnings': 'Earnings',
    'nav.jobs': 'Nearby Jobs',
    'nav.marketplace': 'Marketplace',
    'nav.operations': 'Operations',
    'nav.dispatch': 'Dispatch',
    'nav.pricing': 'Pricing',
    'nav.payments': 'Payments',
    'nav.fraud_alerts': 'Fraud Alerts',
    'nav.reports': 'Reports',
    'nav.help': 'Help & Support',
    'nav.logout': 'Sign Out',
    'nav.notifications': 'Notifications',
    'nav.role': 'Role',
    'nav.online': 'Online',
    'nav.offline': 'Offline',

    // Customer
    'customer.welcome': 'Welcome to SafaiPay',
    'customer.subtitle': 'Turn your household recyclables into verified digital cash',
    'customer.book_cta': 'Book a Pickup',
    'customer.select_material': 'Select Material Stream',
    'customer.approx_weight': 'Approximate Weight',
    'customer.ai_photo': 'AI Waste Photo Verification',
    'customer.ai_photo_sub': 'Upload photo for automated computer-vision grading',
    'customer.address_time': 'Pickup Location & Preferred Time',
    'customer.estimated_payout': 'Estimated Payout',
    'customer.payout_disclaimer': 'Final payout depends on verified weight and quality',
    'customer.timeline_title': 'Active Pickup Lifecycle',
    'customer.trend_title': 'Monthly Recycling Trend (kg)',
    'customer.diverted_stat': 'diverted from landfills',
    'customer.earned_stat': 'direct cash earned',
    'customer.history_title': 'Recent Pickups & Certified Receipts',
    'customer.step.requested': 'Requested',
    'customer.step.assigned': 'Assigned',
    'customer.step.on_the_way': 'On the way',
    'customer.step.weighed': 'Weighed',
    'customer.step.paid': 'Paid',

    // Collector
    'collector.today_earnings': "Today's Earnings",
    'collector.weekly_trend': 'Weekly Earnings Trend',
    'collector.nearby_jobs': 'Available Nearby Jobs',
    'collector.progress_title': 'Daily Target Completion',
    'collector.material_distribution': 'Jobs by Material Stream',
    'collector.accept_job': 'Accept Job',
    'collector.start_job': 'Start Trip (GPS Live)',
    'collector.submit_weight': 'Verify Certified Weight',
    'collector.step_weigh': 'Enter Certified Weight',
    'collector.step_photos': 'Attach Scale Photo',
    'collector.complete_cta': 'Complete Pickup & Get Paid',

    // Recycler
    'recycler.market_title': 'Verified Material Marketplace',
    'recycler.market_sub': 'Direct industrial procurement of verified post-consumer recyclables',
    'recycler.request_batch': 'Request Batch',
    'recycler.stock_title': 'Available Certified Stock',
    'recycler.quality_title': 'Stock Quality Breakdown',
    'recycler.traceability_title': 'Provenance & Traceability Chain',

    // Admin
    'admin.total_pickups': 'Total Pickups',
    'admin.total_recycled': 'Material Recycled',
    'admin.collector_earnings': 'Collector Earnings',
    'admin.fraud_alerts': 'Fraud Alerts',
    'admin.alerts_banner': '2 alerts require immediate review',
    'admin.monthly_volume': 'Monthly Recycled Volume',
    'admin.status_breakdown': 'Pickup Status Breakdown',
    'admin.audit_title': 'Operations Audit Log',
  },
  ur: {
    // Navigation
    'nav.dashboard': 'ڈیش بورڈ',
    'nav.book_pickup': 'پک اپ بک کریں',
    'nav.my_pickups': 'میری بکنگز',
    'nav.earnings': 'کمائی',
    'nav.jobs': 'قریبی نوکریاں',
    'nav.marketplace': 'مارکیٹ پلیس',
    'nav.operations': 'آپریشنز',
    'nav.dispatch': 'ڈسپیچ',
    'nav.pricing': 'قیمتیں',
    'nav.payments': 'ادائیگیاں',
    'nav.fraud_alerts': 'فراڈ الرٹس',
    'nav.reports': 'رپورٹس',
    'nav.help': 'مدد اور رہنمائی',
    'nav.logout': 'لاگ آؤٹ',
    'nav.notifications': 'اطلاعات',
    'nav.role': 'عہدہ',
    'nav.online': 'آن لائن',
    'nav.offline': 'آف لائن',

    // Customer
    'customer.welcome': 'صفائی پے میں خوش آمدید',
    'customer.subtitle': 'اپنے گھر کے ری سائیکل کچرے کو تصدیق شدہ رقم میں تبدیل کریں',
    'customer.book_cta': 'پک اپ بک کریں',
    'customer.select_material': 'کچرے کی قسم منتخب کریں',
    'customer.approx_weight': 'تخمینہ شدہ وزن',
    'customer.ai_photo': 'اے آئی ویسٹ فوٹو تصدیق',
    'customer.ai_photo_sub': 'کوالٹی اور گریڈنگ جانچنے کے لیے تصویر لگائیں',
    'customer.address_time': 'پک اپ کا پتہ اور پسندیدہ وقت',
    'customer.estimated_payout': 'متوقع ادائیگی',
    'customer.payout_disclaimer': 'حتمی ادائیگی تصدیق شدہ وزن اور معیار پر منحصر ہے',
    'customer.timeline_title': 'پک اپ کی موجودہ صورتحال',
    'customer.trend_title': 'ماہانہ ری سائیکلنگ رجحان (کلو گرام)',
    'customer.diverted_stat': 'کچرا لینڈ فل سے بچایا گیا',
    'customer.earned_stat': 'براہ راست کمائی گئی رقم',
    'customer.history_title': 'حالیہ پک اپ تاریخ اور ڈیجیٹل رسیدیں',
    'customer.step.requested': 'درخواست موصول',
    'customer.step.assigned': 'تفویض شدہ',
    'customer.step.on_the_way': 'راستے میں',
    'customer.step.weighed': 'وزن ہو گیا',
    'customer.step.paid': 'ادائیگی مکمل',

    // Collector
    'collector.today_earnings': 'آج کی کل کمائی',
    'collector.weekly_trend': 'ہفتہ وار کمائی کا رجحان',
    'collector.nearby_jobs': 'قریب دستیاب کچرا پک اپ',
    'collector.progress_title': 'روزانہ کے ہدف کی پیش رفت',
    'collector.material_distribution': 'میٹریل کے لحاظ سے نوکریاں',
    'collector.accept_job': 'نوکری قبول کریں',
    'collector.start_job': 'سفر شروع کریں (جی پی ایس)',
    'collector.submit_weight': 'تصدیق شدہ وزن درج کریں',
    'collector.step_weigh': 'ڈیجیٹل ترازو کا وزن',
    'collector.step_photos': 'ترازو کی تصویر شامل کریں',
    'collector.complete_cta': 'پک اپ مکمل کریں اور ادائیگی لیں',

    // Recycler
    'recycler.market_title': 'تصدیق شدہ خام مال مارکیٹ',
    'recycler.market_sub': 'صنعتی ری سائیکلرز کے لیے تصدیق شدہ کچرے کی براہ راست خریداری',
    'recycler.request_batch': 'بیچ آرڈر کریں',
    'recycler.stock_title': 'دستیاب تصدیق شدہ اسٹاک',
    'recycler.quality_title': 'اسٹاک کوالٹی کا تناسب',
    'recycler.traceability_title': 'ڈیجیٹل سپلائی چین ریکارڈ',

    // Admin
    'admin.total_pickups': 'کل پک اپس',
    'admin.total_recycled': 'ری سائیکل شدہ میٹریل',
    'admin.collector_earnings': 'جمع کاروں کی کمائی',
    'admin.fraud_alerts': 'فراڈ الرٹس',
    'admin.alerts_banner': '2 الرٹس کو فوری جائزے کی ضرورت ہے',
    'admin.monthly_volume': 'ماہانہ ری سائیکلنگ حجم',
    'admin.status_breakdown': 'پک اپ اسٹیٹس کا تناسب',
    'admin.audit_title': 'سسٹم آپریشنز اور آڈٹ لاگ',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('safaipay_lang') as Language;
      if (saved === 'en' || saved === 'ur') {
        setLanguageState(saved);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('safaipay_lang', lang);
    }
  };

  const t = (key: string, defaultText?: string): string => {
    return translations[language]?.[key] || defaultText || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isUrdu: language === 'ur',
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
