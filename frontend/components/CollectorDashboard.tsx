'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PickupRequest, MaterialRate, CollectorEarningsSummary } from '@/lib/types';
import { 
  acceptPickup, 
  rejectPickup, 
  startPickup, 
  submitWeight, 
  getMyEarnings 
} from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { LineTrendChart, LineDataPoint } from '@/components/charts/LineTrendChart';
import { HorizontalBarChart, HorizontalBarItem } from '@/components/charts/HorizontalBarChart';
import { ProgressBar } from '@/components/charts/ProgressBar';
import { 
  Truck, 
  DollarSign, 
  Navigation, 
  Scale, 
  CheckCircle2, 
  Award, 
  MapPin, 
  Clock, 
  Camera, 
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  Power,
  ChevronRight,
  Upload,
  AlertCircle,
  Sparkles,
  Loader2
} from 'lucide-react';

interface CollectorDashboardProps {
  pickups: PickupRequest[];
  materialRates: MaterialRate[];
  onRefresh: () => void;
}

// Exact weekly earnings data required:
// Monday Rs 700, Tuesday Rs 950, Wednesday Rs 800, Thursday Rs 1,400, Friday Rs 1,100, Saturday Rs 1,800, Sunday Rs 2,400
const WEEKLY_EARNINGS_DATA: LineDataPoint[] = [
  { label: 'Mon', value: 700 },
  { label: 'Tue', value: 950 },
  { label: 'Wed', value: 800 },
  { label: 'Thu', value: 1400 },
  { label: 'Fri', value: 1100 },
  { label: 'Sat', value: 1800 },
  { label: 'Sun', value: 2400 },
];

// Exact jobs by material required:
// PET 6 jobs, Cardboard 4 jobs, Metal 2 jobs
const JOBS_BY_MATERIAL_DATA: HorizontalBarItem[] = [
  { label: 'PET Plastic', value: 6, secondaryText: '60 kg aggregate', color: 'from-[#1B7F5C] to-[#146B4D]' },
  { label: 'Cardboard', value: 4, secondaryText: '88 kg aggregate', color: 'from-[#F2A900] to-[#D99000]' },
  { label: 'Metal', value: 2, secondaryText: '24 kg aggregate', color: 'from-[#0F3D3E] to-[#12383A]' },
];

// Realistic nearby mock pickup jobs if none returned from API
const SAMPLE_NEARBY_JOBS = [
  {
    id: 'sp-req-001',
    distance: '0.8 km',
    material_code: 'PET_PLASTIC',
    material_name: 'PET Plastic Bottles',
    estimated_quantity_kg: 15,
    expected_earning_pkr: 1200,
    street_address: 'House 14-C, 7th Commercial St, Phase 2, DHA, Karachi',
    preferred_time: 'Within 45 mins',
  },
  {
    id: 'sp-req-002',
    distance: '1.4 km',
    material_code: 'CARDBOARD_OCC',
    material_name: 'Corrugated Cardboard',
    estimated_quantity_kg: 22,
    expected_earning_pkr: 770,
    street_address: 'Shop 3, Al-Makkah Market, Block 4, Clifton, Karachi',
    preferred_time: 'Today by 4:00 PM',
  },
  {
    id: 'sp-req-003',
    distance: '2.1 km',
    material_code: 'MIXED_METAL',
    material_name: 'Mixed Scrap Metal',
    estimated_quantity_kg: 8,
    expected_earning_pkr: 960,
    street_address: 'Plot 88, Street 10, Navy Housing Scheme, Karachi',
    preferred_time: 'Flexible Today',
  },
];

export const CollectorDashboard: React.FC<CollectorDashboardProps> = ({
  pickups,
  materialRates,
  onRefresh,
}) => {
  const { t, isUrdu } = useLanguage();

  const [isOnline, setIsOnline] = useState(true);
  const [earnings, setEarnings] = useState<CollectorEarningsSummary | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [activeWorkflowPickup, setActiveWorkflowPickup] = useState<PickupRequest | null>(null);

  // Field verification state for active job
  const [workflowStep, setWorkflowStep] = useState<1 | 2 | 3 | 4>(1);
  const [verifiedWeight, setVerifiedWeight] = useState<number>(14.8);
  const [qualityFactor, setQualityFactor] = useState<number>(1.0);
  const [qualityGrade, setQualityGrade] = useState<'A' | 'B' | 'C'>('A');
  const [photosAttached, setPhotosAttached] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Job acceptance states
  const [acceptingJobId, setAcceptingJobId] = useState<string | null>(null);
  const [acceptedJobIds, setAcceptedJobIds] = useState<string[]>([]);
  const [jobActionError, setJobActionError] = useState<string | null>(null);

  useEffect(() => {
    getMyEarnings()
      .then((data) => setEarnings(data))
      .catch(() => {});
  }, []);

  // Check for assigned or in-progress pickups
  useEffect(() => {
    const active = pickups.find(
      (p) => p.status === 'assigned' || p.status === 'accepted' || p.status === 'in_progress' || p.status === 'weight_verified'
    );
    if (active) {
      setActiveWorkflowPickup(active);
      if (active.status === 'assigned' || active.status === 'accepted') setWorkflowStep(1);
      else if (active.status === 'in_progress') setWorkflowStep(2);
      else if (active.status === 'weight_verified') setWorkflowStep(4);
    }
  }, [pickups]);

  // Dynamically resolve nearby available jobs
  const availablePickupsList = useMemo(() => {
    const unassigned = pickups.filter((p) => p.status === 'requested');
    if (unassigned.length > 0) {
      return unassigned.map((p, idx) => ({
        id: p.id,
        distance: `${(0.8 + idx * 0.6).toFixed(1)} km`,
        material_code: p.material_code,
        material_name: p.material_code.replace(/_/g, ' '),
        estimated_quantity_kg: p.estimated_quantity_kg,
        expected_earning_pkr: p.pricing_calculations?.[0]?.total_price || (p.estimated_quantity_kg * 80),
        street_address: p.street_address,
        preferred_time: p.preferred_time || 'Flexible Today',
        status: p.status,
      }));
    }
    return SAMPLE_NEARBY_JOBS;
  }, [pickups]);

  const handleAcceptJob = async (pickupId: string) => {
    if (acceptingJobId) return;
    setAcceptingJobId(pickupId);
    setJobActionError(null);
    try {
      const accepted = await acceptPickup(pickupId);
      setAcceptedJobIds((prev) => [...prev, pickupId]);
      setActionNotice(
        isUrdu
          ? 'کام کامیابی سے قبول کر لیا گیا! نیویگیشن چالو ہو گئی۔'
          : 'Job accepted! Live GPS navigation routing to customer address.'
      );
      if (accepted) {
        setActiveWorkflowPickup(accepted);
        setWorkflowStep(1);
      }
      onRefresh();
    } catch (err: any) {
      setJobActionError(
        err.message ||
          'Failed to accept job. It may have already been assigned to another collector or your session has expired.'
      );
    } finally {
      setAcceptingJobId(null);
    }
  };

  const handleStartTrip = async (pickupId: string) => {
    try {
      await startPickup(pickupId, 24.8607, 67.0011);
      setActionNotice('Pickup started! Live GPS shared with customer.');
      setWorkflowStep(2);
      onRefresh();
    } catch (err: any) {
      alert(`Error starting trip: ${err.message}`);
    }
  };

  const handleSubmitVerifiedWeight = async (pickupId: string) => {
    setIsSubmitting(true);
    try {
      await submitWeight(pickupId, {
        verified_weight_kg: Number(verifiedWeight),
        quality_factor: Number(qualityFactor),
        quality_grade: qualityGrade,
        scale_photo_url: 'https://images.unsplash.com/photo-1584727638096-042c45049ebe?auto=format&fit=crop&w=500&q=80',
      });
      setActionNotice('Certified weight & scale reading submitted! Awaiting customer confirmation.');
      setWorkflowStep(4);
      onRefresh();
    } catch (err: any) {
      alert(`Error submitting weight: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Merge backend available pickups with sample nearby jobs
  const availablePickups = pickups.filter(
    (p) => p.status === 'requested' || p.status === 'assigned'
  );

  return (
    <div className="space-y-8 pb-12 font-sans transition-colors duration-200">
      
      {/* ================= 1. COLLECTOR HEADER & TODAY'S EARNINGS ================= */}
      <div className="bg-theme-surface rounded-3xl border border-theme-border p-6 sm:p-8 shadow-xs transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Identity & Status */}
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className={`w-3.5 h-3.5 rounded-full ${isOnline ? 'bg-theme-primary animate-pulse' : 'bg-slate-400'}`} />
              <span className="text-xs font-extrabold uppercase tracking-wider text-theme-secondary">
                {isOnline ? 'Online • Ready for Doorstep Dispatches' : 'Offline • Shift Paused'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-theme-text tracking-tight">
              Karachi South Field Collector
            </h1>
            <p className="text-xs text-theme-secondary">
              Assigned Hub: Clifton Hub #04 • Calibrated Digital Sensor Scale ID #SP-SCL-8910
            </p>
          </div>

          {/* Today's Earnings (Required: Rs 2,400) & Go Online Button */}
          <div className="flex flex-wrap items-center gap-4">
            
            {/* Today's Earnings Card - Deep Teal Hero Card with Gold Value */}
            <div className="bg-[#0F3D3E] dark:bg-[#072021] border border-[#1F4A4B] dark:border-[#173F3C] rounded-2xl px-5 py-3 shadow-md shadow-[#0F3D3E]/15 transition-colors">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9FE6C6] block">
                {t('collector.today_earnings', "Today's Earnings")}
              </span>
              <div className="text-3xl font-extrabold font-mono text-[#F2A900] mt-0.5">
                Rs 2,400
              </div>
              <span className="text-[10px] font-semibold text-[#6EE7B7] block mt-0.5">
                +Rs 600 pending settlement
              </span>
            </div>

            {/* Clear "Go Online" / "Offline" Toggle Button */}
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`px-5 py-4 rounded-2xl text-xs font-extrabold transition shadow-md flex items-center space-x-2 active:scale-98 ${
                isOnline
                  ? 'bg-theme-primary hover:bg-[#146B4D] text-white shadow-theme-primary/25 ring-2 ring-theme-primary/20'
                  : 'bg-[#0B2F30] hover:bg-[#0F3D3E] text-white shadow-[#0B2F30]/25'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{isOnline ? 'Go Offline' : 'Go Online'}</span>
            </button>

          </div>

        </div>
      </div>

      {/* Action Notice Alert */}
      {actionNotice && (
        <div className="p-4 bg-theme-soft-mint border border-theme-primary/40 text-theme-text rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs transition-colors">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-theme-primary shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-theme-primary font-bold ml-4 hover:text-theme-text">
            ✕
          </button>
        </div>
      )}

      {/* ================= 2. ACTIVE PICKUP STEP-BY-STEP WORKFLOW ================= */}
      {/* Required: Large mobile-friendly controls for outdoor field use */}
      <div className="bg-[#0F3D3E] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-[#0F3D3E]/25 border border-[#1F4A4B]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#1B7F5C]/30 text-[#9FE6C6] border border-[#2FA37A]/30 text-xs font-bold mb-2">
              <span className="w-2 h-2 rounded-full bg-[#2FA37A] animate-ping" />
              <span>Active Field Job • Mobile Flow</span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-white">
              Step-by-Step Pickup Execution
            </h2>
            <p className="text-xs text-[#9DB8AE] mt-0.5">
              Optimized for high-contrast outdoor sunlight and quick 1-touch field logging
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-[#9FE6C6] uppercase font-bold block">Current Stage</span>
            <span className="text-sm font-mono font-extrabold text-[#F2A900]">
              Stage {workflowStep} of 4
            </span>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[
            { num: 1, title: 'Trip Start' },
            { num: 2, title: 'Photo Proof' },
            { num: 3, title: 'Scale Weigh' },
            { num: 4, title: 'Settlement' },
          ].map((st) => (
            <div
              key={st.num}
              onClick={() => setWorkflowStep(st.num as any)}
              className={`p-2.5 rounded-xl text-center cursor-pointer transition border ${
                workflowStep === st.num
                  ? 'bg-[#1B7F5C] border-white/40 shadow-md font-extrabold text-white'
                  : workflowStep > st.num
                  ? 'bg-[#2FA37A]/25 border-[#2FA37A]/40 text-[#9FE6C6]'
                  : 'bg-white/5 border-white/10 text-white/50'
              }`}
            >
              <span className="text-[10px] block font-mono">STEP {st.num}</span>
              <span className="text-xs font-bold truncate block">{st.title}</span>
            </div>
          ))}
        </div>

        {/* Step Form Content with Large Touch Controls */}
        <div className="bg-[#0B2F30]/70 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-[#1F4A4B]">
          
          {/* STEP 1: Trip Start */}
          {workflowStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-start space-x-3 text-xs">
                <MapPin className="w-5 h-5 text-[#9FE6C6] shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-white text-sm">
                    {activeWorkflowPickup?.street_address || 'House 14-C, 7th Commercial St, DHA Phase 2'}
                  </p>
                  <p className="text-[#9DB8AE] text-xs mt-0.5">
                    Customer: Ayesha Khan • Estimated: {activeWorkflowPickup?.estimated_quantity_kg || 15} kg PET Plastic
                  </p>
                </div>
              </div>

              {/* Large Mobile Friendly CTA */}
              <button
                type="button"
                onClick={() => {
                  if (activeWorkflowPickup) handleStartTrip(activeWorkflowPickup.id);
                  else setWorkflowStep(2);
                }}
                className="w-full bg-[#1B7F5C] hover:bg-[#146B4D] text-white font-extrabold py-4 px-6 rounded-2xl text-base transition shadow-lg shadow-[#1B7F5C]/30 flex items-center justify-center space-x-2"
              >
                <Navigation className="w-5 h-5" />
                <span>Start Trip & Share GPS Coordinates (1-Tap)</span>
              </button>
            </div>
          )}

          {/* STEP 2: Upload Before & After Photos */}
          {workflowStep === 2 && (
            <div className="space-y-4">
              <p className="text-xs font-bold text-[#9FE6C6] uppercase tracking-wider">
                Upload Before & After Collection Photos
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setPhotosAttached(!photosAttached)}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition ${
                    photosAttached ? 'border-[#2FA37A] bg-[#2FA37A]/20' : 'border-white/30 hover:border-white bg-white/5'
                  }`}
                >
                  <Camera className="w-6 h-6 text-[#9FE6C6] mx-auto mb-1" />
                  <p className="text-xs font-bold text-white">1. Before Photo (Doorstep Recyclable Pile)</p>
                  <span className="text-[10px] text-[#9DB8AE]">{photosAttached ? '✓ Captured' : 'Tap to snap photo'}</span>
                </div>

                <div
                  onClick={() => setPhotosAttached(!photosAttached)}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition ${
                    photosAttached ? 'border-[#2FA37A] bg-[#2FA37A]/20' : 'border-white/30 hover:border-white bg-white/5'
                  }`}
                >
                  <Camera className="w-6 h-6 text-[#9FE6C6] mx-auto mb-1" />
                  <p className="text-xs font-bold text-white">2. After Photo (Cleaned Doorstep & Tied Bags)</p>
                  <span className="text-[10px] text-[#9DB8AE]">{photosAttached ? '✓ Captured' : 'Tap to snap photo'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setWorkflowStep(3)}
                className="w-full bg-[#1B7F5C] hover:bg-[#146B4D] text-white font-extrabold py-4 px-6 rounded-2xl text-base transition shadow-lg flex items-center justify-center space-x-2"
              >
                <span>Proceed to Scale Weighing</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* STEP 3: Enter Certified Digital Scale Weight */}
          {workflowStep === 3 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Large Scale Reading Input */}
                <div>
                  <label className="block text-xs font-bold text-[#9FE6C6] uppercase tracking-wider mb-1.5">
                    Certified Scale Weight (kg)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={verifiedWeight}
                      onChange={(e) => setVerifiedWeight(Number(e.target.value))}
                      className="w-full bg-white/10 border-2 border-[#1F4A4B] rounded-2xl px-4 py-3.5 text-2xl font-extrabold font-mono text-white focus:outline-none focus:border-[#2FA37A]"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono font-bold text-[#9DB8AE] text-sm">
                      kg
                    </span>
                  </div>
                </div>

                {/* Quality Factor Selector */}
                <div>
                  <label className="block text-xs font-bold text-[#9FE6C6] uppercase tracking-wider mb-1.5">
                    Quality Grading
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { factor: 1.0, grade: 'A', desc: 'Grade A (100%)' },
                      { factor: 0.9, grade: 'B', desc: 'Grade B (90%)' },
                      { factor: 0.8, grade: 'C', desc: 'Grade C (80%)' },
                    ].map((g) => (
                      <button
                        key={g.grade}
                        type="button"
                        onClick={() => {
                          setQualityFactor(g.factor);
                          setQualityGrade(g.grade as any);
                        }}
                        className={`py-3.5 rounded-xl text-xs font-extrabold transition border ${
                          qualityGrade === g.grade
                            ? 'bg-[#1B7F5C] border-white text-white shadow-md'
                            : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        {g.desc}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Price Calculation Preview */}
              <div className="p-3.5 rounded-xl bg-[#072021]/80 border border-[#1F4A4B] flex justify-between items-center text-xs text-[#E6F4EC]">
                <span>
                  Pricing: {verifiedWeight} kg × Rs 80.00 × {qualityFactor} (Factor)
                </span>
                <span className="text-base font-extrabold font-mono text-[#F2A900]">
                  Total: Rs {(verifiedWeight * 80 * qualityFactor).toFixed(2)}
                </span>
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  if (activeWorkflowPickup) handleSubmitVerifiedWeight(activeWorkflowPickup.id);
                  else setWorkflowStep(4);
                }}
                className="w-full bg-[#1B7F5C] hover:bg-[#146B4D] text-white font-extrabold py-4 px-6 rounded-2xl text-base transition shadow-lg shadow-[#1B7F5C]/30 flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Submit Certified Weight & Generate Receipt</span>
              </button>
            </div>
          )}

          {/* STEP 4: Completed & Settlement */}
          {workflowStep === 4 && (
            <div className="text-center py-4 space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#2FA37A] text-[#0B2F30] flex items-center justify-center mx-auto shadow-lg shadow-[#2FA37A]/30">
                <CheckCircle2 className="w-8 h-8 text-[#0B2F30]" />
              </div>
              <h3 className="text-lg font-extrabold text-white">Pickup Completed Successfully!</h3>
              <p className="text-xs text-[#9DB8AE] max-w-md mx-auto">
                Verified weight #{verifiedWeight} kg logged to SafaiPay immutable ledger. Digital payout of Rs {(verifiedWeight * 80 * qualityFactor).toFixed(2)} approved.
              </p>
              <button
                type="button"
                onClick={() => setWorkflowStep(1)}
                className="px-6 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition"
              >
                Ready for Next Job
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ================= 3. CHARTS & METRICS ================= */}
      {/* Strict Layout Rule: Dedicated card for weekly line chart, dedicated progress bar card, dedicated horizontal bar chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Weekly Earnings Line Chart (7 cols) */}
        {/* Required Daily Values: Mon 700, Tue 950, Wed 800, Thu 1400, Fri 1100, Sat 1800, Sun 2400 */}
        <div className="lg:col-span-7">
          <LineTrendChart
            title={t('collector.weekly_trend', 'Weekly Earnings Trend')}
            subtitle="Daily verified payout earnings over current week"
            data={WEEKLY_EARNINGS_DATA}
            prefix="Rs "
            highlightLabel="Sunday Peak"
            highlightValue="Rs 2,400"
            footerLabel="Verified Payout Earnings"
          />
        </div>

        {/* Right Column: Progress Bar & Horizontal Distribution (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Dedicated Progress Bar: 12 of 15 jobs, 80% */}
          <ProgressBar
            title={t('collector.progress_title', 'Daily Target Completion')}
            subtitle="Shift quota progress for Clifton South territory"
            current={12}
            total={15}
            unit="jobs"
          />

          {/* Dedicated Horizontal Bar Chart for Jobs by Material */}
          {/* Required values: PET 6 jobs, Cardboard 4 jobs, Metal 2 jobs */}
          <HorizontalBarChart
            title={t('collector.material_distribution', 'Jobs by Material')}
            subtitle="Completed jobs sorted by recyclable stream"
            items={JOBS_BY_MATERIAL_DATA}
            unit="jobs"
          />

        </div>

      </div>

      {/* ================= 4. NEARBY PICKUP JOBS ================= */}
      {/* Required: distance, material, estimated weight, expected earning, and one primary Accept Job button per job */}
      <div className="bg-theme-surface rounded-3xl border border-theme-border shadow-xs overflow-hidden transition-colors">
        <div className="p-6 border-b border-theme-border/60 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-theme-text tracking-tight flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-theme-primary" />
              <span>{t('collector.nearby_jobs', 'Nearby Available Pickup Jobs')}</span>
            </h2>
            <p className="text-xs text-theme-secondary mt-0.5">
              Instant acceptance • Real-time GPS distance radius • Guaranteed benchmark rates
            </p>
          </div>

          <span className="text-xs font-bold text-theme-primary bg-theme-soft-mint px-3 py-1 rounded-full border border-theme-border">
            {availablePickupsList.length} Jobs in 3km Radius
          </span>
        </div>

        {/* Action Error Notice if API fails */}
        {jobActionError && (
          <div className="p-4 mx-6 my-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{jobActionError}</span>
            </div>
            <button
              onClick={() => setJobActionError(null)}
              className="text-red-500 hover:text-red-700 font-bold ml-4"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        <div className="divide-y divide-theme-border/60">
          {availablePickupsList.map((job) => {
            const isAccepted = acceptedJobIds.includes(job.id) || (job as any).status === 'accepted';
            const isCurrentlyAccepting = acceptingJobId === job.id;

            return (
              <div
                key={job.id}
                className="p-5 sm:p-6 hover:bg-theme-soft-mint/30 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-theme-soft-mint text-theme-primary text-[11px] font-extrabold font-mono border border-theme-border">
                      {job.distance} away
                    </span>
                    <span className="font-extrabold text-theme-text text-sm">
                      {job.material_name}
                    </span>
                    <span className="text-theme-secondary text-xs">• {job.preferred_time}</span>
                    {isAccepted && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold border border-emerald-500/30">
                        {isUrdu ? 'تفویض شدہ' : 'Assigned to You'}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-theme-secondary flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-theme-secondary shrink-0" />
                    <span>{job.street_address}</span>
                  </p>

                  <div className="flex items-center space-x-4 text-xs font-mono pt-1">
                    <span className="text-theme-secondary">
                      Est. Weight: <strong className="text-theme-text">{job.estimated_quantity_kg} kg</strong>
                    </span>
                    <span className="text-theme-text font-medium flex items-center gap-1.5">
                      Est. Payout: <strong className="bg-theme-soft-mint text-theme-primary px-2 py-0.5 rounded border border-theme-border">Rs {job.expected_earning_pkr}</strong>
                    </span>
                  </div>
                </div>

                {/* One Primary "Accept Job" button per job */}
                <div className="shrink-0 flex items-center space-x-3">
                  <button
                    type="button"
                    disabled={isCurrentlyAccepting || isAccepted}
                    onClick={() => handleAcceptJob(job.id)}
                    className={`w-full sm:w-auto font-extrabold px-6 py-3 rounded-xl text-xs transition flex items-center justify-center space-x-2 min-h-[44px] cursor-pointer ${
                      isAccepted
                        ? 'bg-[#134E39] text-[#A7F3D0] border border-[#2FA37A]/40 cursor-default shadow-xs'
                        : 'bg-theme-primary hover:bg-[#146B4D] text-white shadow-md shadow-theme-primary/20 active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed'
                    }`}
                  >
                    {isCurrentlyAccepting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>{isUrdu ? 'قبول کیا جا رہا ہے...' : 'Accepting...'}</span>
                      </>
                    ) : isAccepted ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{isUrdu ? 'قبول شدہ' : 'Accepted'}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t('collector.accept_job', 'Accept Job')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
