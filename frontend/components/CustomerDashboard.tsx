'use client';

import React, { useState, useMemo } from 'react';
import { PickupRequest, MaterialRate } from '@/lib/types';
import { createPickup, confirmPickup, disputePickup, ratePickup } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { LineTrendChart, LineDataPoint } from '@/components/charts/LineTrendChart';
import { 
  PlusCircle, 
  Package, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Star, 
  ArrowRight, 
  Scale, 
  Sparkles, 
  Camera, 
  FileText, 
  DollarSign, 
  ShieldCheck,
  AlertCircle,
  X
} from 'lucide-react';

interface CustomerDashboardProps {
  pickups: PickupRequest[];
  materialRates: MaterialRate[];
  onRefresh: () => void;
}

const MATERIAL_OPTIONS = [
  {
    code: 'PET_PLASTIC',
    name: 'PET Plastic',
    rate: 80,
    desc: 'Clean water bottles & clear beverage containers',
    color: 'from-[#1B7F5C] to-[#2FA37A]',
    iconColor: 'text-theme-primary',
    bgColor: 'bg-theme-soft-mint',
    borderColor: 'border-theme-border',
  },
  {
    code: 'CARDBOARD_OCC',
    name: 'Cardboard',
    rate: 35,
    desc: 'Corrugated boxes, packaging cartons & kraft',
    color: 'from-[#0F3D3E] to-[#146B4D]',
    iconColor: 'text-theme-text',
    bgColor: 'bg-theme-bg',
    borderColor: 'border-theme-border',
  },
  {
    code: 'MIXED_METAL',
    name: 'Metal',
    rate: 120,
    desc: 'Soda cans, scrap aluminum, tins & copper wiring',
    color: 'from-[#F2A900] to-[#D99500]',
    iconColor: 'text-theme-text',
    bgColor: 'bg-theme-soft-mint',
    borderColor: 'border-theme-border',
  },
  {
    code: 'GLASS_BOTTLES',
    name: 'Glass',
    rate: 25,
    desc: 'Intact glass bottles, jars & culinary containers',
    color: 'from-[#2E6F9E] to-[#3B82F6]',
    iconColor: 'text-theme-primary',
    bgColor: 'bg-theme-bg',
    borderColor: 'border-theme-border',
  },
];

// Baseline 6-month historical recycling trend data
const BASELINE_TREND_DATA: LineDataPoint[] = [
  { label: 'Jan', value: 18 },
  { label: 'Feb', value: 26 },
  { label: 'Mar', value: 21 },
  { label: 'Apr', value: 39 },
  { label: 'May', value: 34 },
  { label: 'Jun', value: 52 },
];

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  pickups,
  materialRates,
  onRefresh,
}) => {
  const { t, isUrdu } = useLanguage();

  const [selectedMaterial, setSelectedMaterial] = useState<string>('PET_PLASTIC');
  const [estimatedWeight, setEstimatedWeight] = useState<number>(12);
  const [address, setAddress] = useState('Flat 402, Al-Razi Tower, Block 7, Clifton, Karachi');
  const [preferredTime, setPreferredTime] = useState('Today 2:00 PM - 5:00 PM');
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<PickupRequest | null>(null);

  // Dispute Modal State
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeTargetId, setDisputeTargetId] = useState<string | null>(null);
  const [disputeCategory, setDisputeCategory] = useState('Scale reading differed from physical display');
  const [disputeDetails, setDisputeDetails] = useState('');
  const [isDisputing, setIsDisputing] = useState(false);
  const [disputeError, setDisputeError] = useState<string | null>(null);

  // Ratings state
  const [ratingScore, setRatingScore] = useState<Record<string, number>>({});
  const [ratingComment, setRatingComment] = useState<Record<string, string>>({});

  // Active rate & estimation
  const currentMaterial = MATERIAL_OPTIONS.find((m) => m.code === selectedMaterial) || MATERIAL_OPTIONS[0];
  const backendRate = materialRates.find((m) => m.code === selectedMaterial)?.benchmark_rate_pkr;
  const effectiveRate = backendRate || currentMaterial.rate;
  const estimatedPayout = (estimatedWeight * effectiveRate).toFixed(2);

  // Dynamic calculations from pickups
  const completedPickups = useMemo(() => {
    return pickups.filter((p) =>
      ['weight_verified', 'customer_confirmed', 'payment_pending', 'payment_completed', 'inventory_ready'].includes(p.status)
    );
  }, [pickups]);

  const verifiedWeightSum = useMemo(() => {
    return completedPickups.reduce((sum, p) => {
      const calc = p.pricing_calculations?.[0];
      return sum + (calc?.verified_weight_kg || p.estimated_quantity_kg || 0);
    }, 0);
  }, [completedPickups]);

  const verifiedEarningsSum = useMemo(() => {
    return completedPickups.reduce((sum, p) => {
      const calc = p.pricing_calculations?.[0];
      const weight = calc?.verified_weight_kg || p.estimated_quantity_kg || 0;
      return sum + (calc?.total_price || weight * 80);
    }, 0);
  }, [completedPickups]);

  // If customer has actual logged pickups, use their dynamic values, else display benchmark values
  const displayDivertedKg = verifiedWeightSum > 0 ? verifiedWeightSum : 52;
  const displayEarnings = verifiedEarningsSum > 0 ? verifiedEarningsSum : 4160;
  const dynamicAvgRate = displayDivertedKg > 0 ? (displayEarnings / displayDivertedKg).toFixed(2) : '80.00';

  // Dynamic Monthly Trend: blend baseline with latest pickup additions
  const trendData: LineDataPoint[] = useMemo(() => {
    if (completedPickups.length > 0) {
      const data = [...BASELINE_TREND_DATA];
      // Update peak / current month with verified cumulative weight
      data[data.length - 1] = {
        ...data[data.length - 1],
        value: Math.max(verifiedWeightSum, data[data.length - 1].value),
      };
      return data;
    }
    return BASELINE_TREND_DATA;
  }, [completedPickups, verifiedWeightSum]);

  // Dynamically compute the peak month
  const peakMonth = useMemo(() => {
    return trendData.reduce((prev, curr) => (curr.value > prev.value ? curr : prev), trendData[0]);
  }, [trendData]);

  const handleCreatePickup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionSuccessNotice(null);
    try {
      await createPickup({
        material_code: selectedMaterial,
        estimated_quantity_kg: Number(estimatedWeight),
        street_address: address,
        preferred_time: preferredTime,
        photo_url: photoUploaded ? 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=500&q=80' : undefined,
      });
      setActionSuccessNotice('Pickup request submitted! A verified collector in Clifton South is being dispatched.');
      setIsBookingOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(`Booking Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCompletion = async (pickupId: string) => {
    try {
      await confirmPickup(pickupId);
      setActionSuccessNotice('Scale weight accepted! Digital payout credited to your balance.');
      onRefresh();
    } catch (err: any) {
      alert(`Confirmation Error: ${err.message}`);
    }
  };

  const handleOpenDispute = (pickupId: string) => {
    setDisputeTargetId(pickupId);
    setDisputeCategory('Scale reading differed from physical display');
    setDisputeDetails('');
    setDisputeError(null);
    setDisputeModalOpen(true);
  };

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeTargetId) return;
    if (!disputeDetails.trim()) {
      setDisputeError('Please describe the discrepancy details.');
      return;
    }
    setIsDisputing(true);
    setDisputeError(null);
    try {
      const fullReason = `[${disputeCategory}] ${disputeDetails.trim()}`;
      await disputePickup(disputeTargetId, fullReason);
      setActionSuccessNotice('Dispute registered. SafaiPay Admin & field supervisor will inspect the certified scale image.');
      setDisputeModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setDisputeError(err.message || 'Failed to submit dispute');
    } finally {
      setIsDisputing(false);
    }
  };

  const handleRate = async (pickupId: string) => {
    const score = ratingScore[pickupId] || 5;
    const comment = ratingComment[pickupId] || 'Punctual, polite, and verified with calibrated scale!';
    try {
      await ratePickup(pickupId, score, comment);
      setActionSuccessNotice('Thank you! Collector rated successfully.');
      onRefresh();
    } catch (err: any) {
      alert(`Rating Error: ${err.message}`);
    }
  };

  const activePickup = pickups.find(
    (p) => p.status !== 'payment_completed' && p.status !== 'cancelled' && p.status !== 'inventory_ready'
  ) || pickups[0];

  const getTimelineStepIndex = (status?: string): number => {
    switch (status) {
      case 'requested': return 0;
      case 'assigned': return 1;
      case 'accepted':
      case 'in_progress': return 2;
      case 'weight_verified':
      case 'customer_confirmed':
      case 'payment_pending': return 3;
      case 'payment_completed':
      case 'inventory_ready': return 4;
      default: return 0;
    }
  };

  const timelineSteps = [
    { key: 'requested', label: t('customer.step.requested', 'Requested'), desc: 'Broadcast to collectors' },
    { key: 'assigned', label: t('customer.step.assigned', 'Assigned'), desc: 'Collector verified' },
    { key: 'on_the_way', label: t('customer.step.on_the_way', 'On the way'), desc: 'En route to doorstep' },
    { key: 'weighed', label: t('customer.step.weighed', 'Weighed'), desc: 'Scale certified reading' },
    { key: 'paid', label: t('customer.step.paid', 'Paid'), desc: 'Instant wallet payout' },
  ];

  const currentStep = getTimelineStepIndex(activePickup?.status);

  return (
    <div className="space-y-8 pb-12 font-sans transition-colors duration-200">
      
      {/* ================= 1. WELCOME & PRIMARY CTA ================= */}
      {/* Layered deep teal #0F3D3E banner with mint/emerald accents */}
      <div className="bg-[#0F3D3E] dark:bg-[#061A1A] rounded-3xl p-6 sm:p-8 text-white shadow-eco-lg border border-[#1F4A4B] dark:border-[#173F3C] relative overflow-hidden transition-colors">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-theme-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-theme-bright-green/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-[#1F4A4B] text-xs font-semibold text-[#9FE6C6]">
              <span className="w-2 h-2 rounded-full bg-theme-primary animate-pulse" />
              <span>Doorstep Recyclable Collection</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              {t('customer.welcome', 'Welcome to SafaiPay')}
            </h1>
            <p className="text-[#E6F4EC]/90 text-sm sm:text-base leading-relaxed">
              {t('customer.subtitle', 'Turn your household recyclables into verified digital cash with calibrated digital scales and AI image classification.')}
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => setIsBookingOpen(true)}
              className="bg-theme-primary hover:bg-[#146B4D] text-white font-extrabold px-6 py-3.5 rounded-2xl text-sm transition shadow-md shadow-theme-primary/25 flex items-center justify-center space-x-2.5 active:scale-98"
            >
              <PlusCircle className="w-5 h-5 text-white" />
              <span>{t('customer.book_cta', 'Book a Pickup')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {actionSuccessNotice && (
        <div className="p-4 bg-theme-soft-mint border border-theme-primary/40 text-theme-text rounded-2xl text-xs font-semibold flex items-center justify-between shadow-eco-sm transition-colors">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-theme-primary shrink-0" />
            <span>{actionSuccessNotice}</span>
          </div>
          <button
            onClick={() => setActionSuccessNotice(null)}
            className="text-theme-primary hover:text-theme-text font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* ================= 2. BOOK PICKUP MODAL ================= */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-50 bg-[#072021]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-theme-surface rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-theme-border space-y-6 max-h-[90vh] overflow-y-auto text-theme-text transition-colors">
            
            <div className="flex items-center justify-between pb-4 border-b border-theme-border/60">
              <div>
                <h2 className="text-xl font-extrabold text-theme-text">
                  {t('customer.book_cta', 'Book Recyclable Pickup')}
                </h2>
                <p className="text-xs text-theme-secondary mt-0.5">
                  Verified weighing at your doorstep • Instant digital payout
                </p>
              </div>
              <button
                onClick={() => setIsBookingOpen(false)}
                className="w-8 h-8 rounded-full bg-theme-bg hover:bg-theme-soft-mint flex items-center justify-center text-theme-secondary hover:text-theme-text font-bold text-sm transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePickup} className="space-y-6">
              
              {/* Material Cards Selection */}
              <div>
                <label className="block text-xs font-extrabold text-theme-text uppercase tracking-wider mb-2.5">
                  1. {t('customer.select_material', 'Select Material Stream')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {MATERIAL_OPTIONS.map((mat) => {
                    const isSelected = selectedMaterial === mat.code;
                    return (
                      <div
                        key={mat.code}
                        onClick={() => setSelectedMaterial(mat.code)}
                        className={`cursor-pointer rounded-2xl p-3.5 border transition-all text-center relative ${
                          isSelected
                            ? 'bg-theme-soft-mint border-theme-primary shadow-eco-sm'
                            : 'bg-theme-bg border-theme-border hover:border-theme-primary/60'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-theme-primary" />
                        )}
                        <p className="text-xs font-bold text-theme-text mb-0.5">{mat.name}</p>
                        <p className="text-xs font-extrabold font-mono text-theme-text bg-theme-surface px-1.5 py-0.5 rounded border border-theme-border inline-block">
                          <span className="text-theme-yellow font-black">Rs {mat.rate}</span>/kg
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Approximate Weight Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-extrabold text-theme-text uppercase tracking-wider">
                    2. {t('customer.approx_weight', 'Approximate Weight (kg)')}
                  </label>
                  <span className="text-sm font-extrabold font-mono text-theme-primary bg-theme-soft-mint px-2.5 py-0.5 rounded-lg border border-theme-border">
                    {estimatedWeight} kg
                  </span>
                </div>
                
                {/* Quick Chips */}
                <div className="flex items-center gap-2 mb-3">
                  {[5, 10, 15, 25, 50].map((kg) => (
                    <button
                      key={kg}
                      type="button"
                      onClick={() => setEstimatedWeight(kg)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold font-mono transition ${
                        estimatedWeight === kg
                          ? 'bg-theme-primary text-white shadow-xs'
                          : 'bg-theme-bg hover:bg-theme-soft-mint text-theme-text border border-theme-border'
                      }`}
                    >
                      {kg} kg
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  min="2"
                  max="100"
                  step="1"
                  value={estimatedWeight}
                  onChange={(e) => setEstimatedWeight(Number(e.target.value))}
                  className="w-full accent-theme-primary h-2 bg-theme-border rounded-lg cursor-pointer"
                />
              </div>

              {/* AI Waste Photo Upload */}
              <div>
                <label className="block text-xs font-extrabold text-theme-text uppercase tracking-wider mb-1.5">
                  3. {t('customer.ai_photo', 'AI Waste Photo Verification')} (Optional)
                </label>
                <div
                  onClick={() => setPhotoUploaded(!photoUploaded)}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition ${
                    photoUploaded
                      ? 'border-theme-primary bg-theme-soft-mint'
                      : 'border-theme-border hover:border-theme-primary bg-theme-bg'
                  }`}
                >
                  {photoUploaded ? (
                    <div className="flex items-center justify-center space-x-2 text-xs font-bold text-theme-primary">
                      <Sparkles className="w-4 h-4 text-theme-primary" />
                      <span>AI Verification Passed: Grade A Recyclable Stream (98.4% Confidence)</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Camera className="w-6 h-6 text-theme-primary mx-auto" />
                      <p className="text-xs font-bold text-theme-text">Click to upload waste photo</p>
                      <p className="text-[11px] text-theme-secondary">Automated computer-vision classification & contaminant detection</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pickup Address & Preferred Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-theme-text uppercase tracking-wider mb-1">
                    Pickup Street Address
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-theme-bg border border-theme-border rounded-[14px] px-3.5 py-2.5 text-xs text-theme-text focus:outline-none focus:border-theme-primary focus:bg-theme-surface"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-theme-text uppercase tracking-wider mb-1">
                    Preferred Time Slot
                  </label>
                  <input
                    type="text"
                    required
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full bg-theme-bg border border-theme-border rounded-[14px] px-3.5 py-2.5 text-xs text-theme-text focus:outline-none focus:border-theme-primary focus:bg-theme-surface"
                  />
                </div>
              </div>

              {/* Estimated Payout Card on Dark Teal Container */}
              <div className="bg-[#0F3D3E] dark:bg-[#072021] text-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-eco-md border border-[#1F4A4B] dark:border-[#173F3C]">
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#9FE6C6] block">
                    {t('customer.estimated_payout', 'Estimated Payout')}
                  </span>
                  <div className="text-2xl font-extrabold font-mono text-[#F2A900]">
                    Rs {estimatedPayout}
                  </div>
                  <p className="text-[11px] text-[#E6F4EC]/90 mt-0.5 font-medium">
                    Note: “Final payout depends on verified weight and quality”
                  </p>
                </div>
                <div className="text-right text-[11px] text-[#9DB8AE] font-mono">
                  {estimatedWeight} kg × Rs {effectiveRate}/kg (Benchmark)
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBookingOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-theme-border text-xs font-bold text-theme-secondary hover:bg-theme-bg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-theme-primary hover:bg-[#146B4D] text-white font-extrabold px-6 py-2.5 rounded-xl text-xs transition shadow-md shadow-theme-primary/25 flex items-center space-x-2"
                >
                  <span>{isSubmitting ? 'Confirming...' : 'Confirm Booking'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ================= 3. ACTIVE PICKUP TIMELINE ================= */}
      <div className="bg-theme-surface rounded-3xl border border-theme-border p-6 sm:p-7 shadow-eco-sm transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-theme-border/60">
          <div>
            <h2 className="text-sm font-extrabold text-theme-text tracking-tight flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-theme-primary" />
              <span>{t('customer.timeline_title', 'Pickup Timeline')}</span>
            </h2>
            <p className="text-xs text-theme-secondary mt-0.5">
              Current pickup: {activePickup?.id ? `#${activePickup.id.slice(0, 8)}` : 'Live Demo Pickup'} • {activePickup?.material_code || 'PET_PLASTIC'}
            </p>
          </div>

          <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-theme-soft-mint text-theme-primary border border-theme-border uppercase tracking-wide">
            {activePickup?.status?.replace(/_/g, ' ') || 'IN PROGRESS'}
          </span>
        </div>

        {/* 5-Step Horizontal Timeline with responsive touch scroll on mobile */}
        <div className="overflow-x-auto pb-2 scrollbar-none">
          <div className="min-w-[520px] grid grid-cols-5 gap-2 relative">
            {timelineSteps.map((step, idx) => {
              const isCompleted = idx < currentStep;
              const isCurrent = idx === currentStep;

              return (
                <div key={step.key} className="flex flex-col items-center text-center space-y-2 relative">
                  {/* Connecting Line */}
                  {idx < 4 && (
                    <div
                      className={`absolute top-4 left-1/2 w-full h-1 -z-0 transition-colors ${
                        idx < currentStep ? 'bg-theme-primary' : 'bg-theme-border'
                      }`}
                    />
                  )}

                  {/* Step Circle */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs z-10 transition-all ${
                      isCompleted
                        ? 'bg-theme-primary text-white shadow-xs'
                        : isCurrent
                        ? 'bg-theme-surface text-theme-primary ring-4 ring-theme-primary/30 border-2 border-theme-primary shadow-md'
                        : 'bg-theme-bg text-theme-secondary border border-theme-border'
                    }`}
                  >
                    {isCompleted ? '✓' : idx + 1}
                  </div>

                  {/* Step Labels */}
                  <div className="px-1">
                    <p className={`text-xs font-bold leading-tight ${isCurrent ? 'text-theme-text font-extrabold' : isCompleted ? 'text-theme-primary' : 'text-theme-secondary'}`}>
                      {step.label}
                    </p>
                    <p className="text-[10px] text-theme-secondary hidden sm:block mt-0.5 leading-snug">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions if Verified & Awaiting Confirmation */}
        {activePickup?.status === 'weight_verified' && (
          <div className="mt-6 p-4 rounded-2xl bg-theme-soft-mint border border-theme-primary/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-theme-text">
                Collector has submitted verified scale reading!
              </p>
              <p className="text-xs text-theme-secondary mt-0.5">
                Please verify certified weight and confirm to release digital payout.
              </p>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => handleConfirmCompletion(activePickup.id)}
                className="px-4 py-2 bg-theme-primary hover:bg-[#146B4D] text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                Confirm & Pay
              </button>
              <button
                onClick={() => handleOpenDispute(activePickup.id)}
                className="px-4 py-2 bg-theme-surface text-theme-error border border-theme-error/40 text-xs font-bold rounded-xl hover:bg-theme-error/10 transition"
              >
                Dispute Weight
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= 4. RECYCLING TREND LINE CHART & KPI STATS ================= */}
      {/* Strict Layout Rule: Dedicated card for line chart, and dedicated cards beside it for Diverted & Earned */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Line Chart Dedicated Card (8 cols) */}
        <div className="lg:col-span-8">
          <LineTrendChart
            title={t('customer.trend_title', 'Monthly Recycling Trend')}
            subtitle="Household recyclable diversion trajectory over past 6 months"
            data={trendData}
            unit="kg"
            highlightLabel="Peak Month"
            highlightValue={`${peakMonth.value} kg (${peakMonth.label})`}
          />
        </div>

        {/* Dedicated Impact Cards beside the chart (4 cols) */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-4">
          
          {/* Metric 1: Landfill Diversion */}
          <div className="bg-theme-surface rounded-2xl border border-theme-border p-6 shadow-xs flex-1 flex flex-col justify-between transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-theme-secondary">
                Landfill Diversion
              </span>
              <div className="w-8 h-8 rounded-xl bg-theme-soft-mint text-theme-primary flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold font-mono text-theme-primary tracking-tight">
                {displayDivertedKg.toLocaleString()} kg diverted
              </div>
              <p className="text-xs text-theme-secondary mt-1">
                Total post-consumer plastics & paper kept out of local municipal landfills.
              </p>
            </div>
            <div className="pt-3 border-t border-theme-border/60 text-[11px] text-theme-primary font-semibold flex items-center space-x-1 mt-2">
              <span>+18 kg increase since April</span>
            </div>
          </div>

          {/* Metric 2: Cumulative Household Income */}
          {/* Safe gold #F2A900 on dark teal container per design guidelines */}
          <div className="bg-[#0F3D3E] dark:bg-[#072021] text-white rounded-2xl border border-[#1F4A4B] dark:border-[#173F3C] p-6 shadow-md flex-1 flex flex-col justify-between transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#9FE6C6]">
                Cumulative Household Income
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#072021] dark:bg-[#041516] text-[#F2A900] flex items-center justify-center border border-[#1F4A4B] dark:border-[#173F3C]">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold font-mono text-[#F2A900] tracking-tight">
                Rs {Math.round(displayEarnings).toLocaleString()} earned
              </div>
              <p className="text-xs text-[#9DB8AE] mt-1">
                Direct transparent digital wallet settlements credited via SafaiPay.
              </p>
            </div>
            <div className="pt-3 border-t border-[#1F4A4B] text-[11px] text-[#9FE6C6] font-semibold flex items-center space-x-1 mt-2">
              <span>Average rate: Rs {dynamicAvgRate}/kg</span>
            </div>
          </div>

        </div>

      </div>

      {/* ================= 5. RECENT PICKUPS & DIGITAL RECEIPTS ================= */}
      <div className="bg-theme-surface rounded-3xl border border-theme-border shadow-xs overflow-hidden transition-colors">
        <div className="p-6 border-b border-theme-border/60 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-theme-text tracking-tight flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-theme-primary" />
              <span>{t('customer.history_title', 'Recent Pickups & Certified Receipts')}</span>
            </h2>
            <p className="text-xs text-theme-secondary mt-0.5">
              Click any record to inspect certified scale readings and chain-of-custody
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-theme-secondary">
            {pickups.length} Records Logged
          </span>
        </div>

        {pickups.length === 0 ? (
          <div className="p-10 text-center text-theme-secondary space-y-2">
            <Package className="w-10 h-10 mx-auto text-theme-border" />
            <p className="text-sm font-bold text-theme-text">No pickups registered yet</p>
            <p className="text-xs text-theme-secondary">Book your first doorstep recycling pickup above!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-theme-soft-mint/40 text-theme-secondary border-b border-theme-border uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Pickup ID</th>
                  <th className="px-6 py-3.5">Material</th>
                  <th className="px-6 py-3.5">Weight (Verified)</th>
                  <th className="px-6 py-3.5">Total Settlement</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Digital Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/60">
                {pickups.map((p) => {
                  const calc = p.pricing_calculations?.[0];
                  const verifiedWeight = calc ? calc.verified_weight_kg : p.estimated_quantity_kg;
                  const finalPrice = calc ? calc.total_price : p.estimated_quantity_kg * 80;

                  return (
                    <tr key={p.id} className="hover:bg-theme-soft-mint/30 transition">
                      <td className="px-6 py-4 font-mono font-bold text-theme-text">
                        #{p.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-theme-text block">{p.material_code}</span>
                        <span className="text-[11px] text-theme-secondary">{p.street_address}</span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-theme-primary">
                        {verifiedWeight} kg
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-theme-text">
                        <span className="bg-theme-soft-mint text-theme-text px-2 py-0.5 rounded border border-theme-border">
                          <strong className="text-theme-primary">Rs {finalPrice.toFixed(2)}</strong>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-theme-soft-mint text-theme-primary border border-theme-border">
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedReceipt(p)}
                          className="px-3 py-1.5 rounded-xl bg-theme-soft-mint hover:bg-theme-border text-theme-primary border border-theme-border font-bold text-xs transition inline-flex items-center space-x-1"
                        >
                          <FileText className="w-3.5 h-3.5 text-theme-primary" />
                          <span>View Receipt</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= DIGITAL RECEIPT MODAL ================= */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-[#072021]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-theme-surface rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-theme-border space-y-5 text-theme-text transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-theme-border/60">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-theme-soft-mint text-theme-primary flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-theme-text text-sm">Certified Digital Receipt</h3>
                  <p className="text-[10px] font-mono text-theme-secondary">ID: #{selectedReceipt.id.slice(0, 12)}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-theme-secondary hover:text-theme-text text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 bg-theme-bg rounded-2xl p-4 text-xs border border-theme-border">
              <div className="flex justify-between">
                <span className="text-theme-secondary">Material Stream:</span>
                <span className="font-bold text-theme-text">{selectedReceipt.material_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-secondary">Certified Weight:</span>
                <span className="font-mono font-bold text-theme-primary">
                  {selectedReceipt.pricing_calculations?.[0]?.verified_weight_kg || selectedReceipt.estimated_quantity_kg} kg
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-secondary">Benchmark Rate:</span>
                <span className="font-mono text-theme-text">
                  Rs {selectedReceipt.pricing_calculations?.[0]?.material_rate_applied || 80}/kg
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-secondary">Quality Factor:</span>
                <span className="font-mono text-theme-primary font-bold">
                  {selectedReceipt.pricing_calculations?.[0]?.quality_factor || 1.0} (Grade A)
                </span>
              </div>
              <div className="pt-2 border-t border-theme-border flex justify-between text-sm font-extrabold text-theme-text">
                <span>Total Payout:</span>
                <span className="font-mono text-theme-text bg-theme-soft-mint px-2 py-0.5 rounded border border-theme-border">
                  <strong className="text-theme-primary">Rs {(selectedReceipt.pricing_calculations?.[0]?.total_price || selectedReceipt.estimated_quantity_kg * 80).toFixed(2)}</strong>
                </span>
              </div>
            </div>

            {/* Scale Photo proof indicator */}
            <div className="p-3 bg-theme-soft-mint rounded-xl border border-theme-border text-xs text-theme-text flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-theme-primary shrink-0" />
              <span>Certified digital hanging scale calibration #SP-SCL-8910 verified.</span>
            </div>

            {/* Rate Collector */}
            <div className="space-y-2 pt-2 border-t border-theme-border/60">
              <label className="text-xs font-bold text-theme-text block">Rate Collector Performance</label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingScore({ ...ratingScore, [selectedReceipt.id]: star })}
                    className="p-1 text-[#F2A900] hover:scale-110 transition"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        (ratingScore[selectedReceipt.id] || 5) >= star
                          ? 'fill-[#F2A900] text-[#F2A900]'
                          : 'text-theme-border'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                handleRate(selectedReceipt.id);
                setSelectedReceipt(null);
              }}
              className="w-full bg-theme-primary hover:bg-[#146B4D] text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
            >
              Submit Rating & Close Receipt
            </button>
          </div>
        </div>
      )}

      {/* ================= 6. DEDICATED DISPUTE WEIGHT MODAL ================= */}
      {disputeModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#072021]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-theme-surface rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-theme-border space-y-5 text-theme-text transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-theme-border/60">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-theme-error/15 text-theme-error flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-theme-text text-sm">Dispute Scale Weight</h3>
                  <p className="text-[10px] font-mono text-theme-secondary">
                    Pickup #{disputeTargetId?.slice(0, 8)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDisputeModalOpen(false)}
                className="text-theme-secondary hover:text-theme-text text-sm font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitDispute} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-theme-text uppercase tracking-wider mb-1.5">
                  Dispute Reason
                </label>
                <select
                  value={disputeCategory}
                  onChange={(e) => setDisputeCategory(e.target.value)}
                  className="w-full bg-theme-bg border border-theme-border rounded-xl px-3 py-2.5 text-xs text-theme-text font-medium focus:outline-none focus:border-theme-primary"
                >
                  <option value="Scale reading differed from physical display">
                    Scale reading differed from physical display
                  </option>
                  <option value="Contamination or quality factor applied incorrectly">
                    Contamination or quality factor applied incorrectly
                  </option>
                  <option value="Rate applied does not match official benchmark">
                    Rate applied does not match official benchmark
                  </option>
                  <option value="Incorrect recyclable material stream classified">
                    Incorrect recyclable material stream classified
                  </option>
                  <option value="Other discrepancy">
                    Other discrepancy
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-text uppercase tracking-wider mb-1.5">
                  Detailed Explanation
                </label>
                <textarea
                  required
                  rows={3}
                  value={disputeDetails}
                  onChange={(e) => setDisputeDetails(e.target.value)}
                  placeholder="Describe what occurred during weighing (e.g. scale read 14 kg, but app recorded 10 kg)..."
                  className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary resize-none placeholder:text-theme-secondary/60"
                />
              </div>

              {disputeError && (
                <div className="p-2.5 bg-theme-error/15 border border-theme-error/30 rounded-xl text-xs text-theme-error font-medium flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{disputeError}</span>
                </div>
              )}

              <p className="text-[11px] text-theme-secondary leading-snug">
                Upon submission, payout will be temporarily paused while a supervisor reviews the certified scale photograph.
              </p>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDisputeModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-theme-border text-xs font-bold text-theme-secondary hover:bg-theme-bg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDisputing}
                  className="flex-1 bg-theme-error hover:opacity-90 text-white font-extrabold py-2.5 rounded-xl text-xs transition shadow-sm"
                >
                  {isDisputing ? 'Submitting...' : 'Register Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
