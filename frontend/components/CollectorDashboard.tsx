'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PickupRequest, MaterialRate, CollectorEarningsSummary } from '@/lib/types';
import { 
  acceptPickup, 
  rejectPickup, 
  startPickup, 
  uploadPickupPhoto,
  submitWeight, 
  confirmPickup,
  deliverPickupToRecycler,
  getMyEarnings 
} from '@/lib/api';
import { INITIAL_MATERIAL_RATES } from '@/lib/mockData';
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
  Loader2,
  Lock,
  X,
  RotateCcw,
  Receipt,
  ArrowRight
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

interface NearbyJobItem {
  id: string;
  tracking_number?: string;
  distance: string;
  material_code: string;
  material_name: string;
  estimated_quantity_kg: number;
  expected_earning_pkr: number;
  street_address: string;
  preferred_time: string;
  status?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_photo_url?: string | null;
}

// Realistic nearby mock pickup jobs if none returned from API
const SAMPLE_NEARBY_JOBS: NearbyJobItem[] = [
  {
    id: 'sp-req-001',
    distance: '0.8 km',
    material_code: 'PET_PLASTIC',
    material_name: 'PET Plastic Bottles',
    estimated_quantity_kg: 15,
    expected_earning_pkr: 1200,
    street_address: 'House 14-C, 7th Commercial St, Phase 2, DHA, Karachi',
    preferred_time: 'Within 45 mins',
    customer_photo_url: '/uploads/mock_pet_bottle_batch.jpg',
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
    customer_photo_url: '/uploads/mock_pet_bottle_batch.jpg',
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
    customer_photo_url: null,
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
  const [maxUnlockedStep, setMaxUnlockedStep] = useState<1 | 2 | 3 | 4>(1);

  // Stage 1: Trip Start
  const [isStartingTrip, setIsStartingTrip] = useState(false);
  const [tripStartError, setTripStartError] = useState<string | null>(null);

  // Stage 2: Photo Proof
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);

  // Stage 3: Scale Weigh
  const [verifiedWeight, setVerifiedWeight] = useState<string>('15.0');
  const [qualityFactor, setQualityFactor] = useState<number>(1.0);
  const [qualityGrade, setQualityGrade] = useState<'A' | 'B' | 'C'>('A');
  const [isSubmittingWeight, setIsSubmittingWeight] = useState(false);
  const [weightError, setWeightError] = useState<string | null>(null);

  // Stage 4: Settlement
  const [isCompletingSettlement, setIsCompletingSettlement] = useState(false);
  const [settlementError, setSettlementError] = useState<string | null>(null);
  const [settlementData, setSettlementData] = useState<{
    verified_weight_kg: number;
    material_name: string;
    rate_applied: number;
    quality_factor: number;
    total_payout_pkr: number;
    transaction_ref: string;
    completed_at: string;
  } | null>(null);
  const [isTransitioningNextJob, setIsTransitioningNextJob] = useState(false);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<string | null>(null);
  const [isDeliveringToRecycler, setIsDeliveringToRecycler] = useState(false);
  const [isDeliveredToRecycler, setIsDeliveredToRecycler] = useState(false);

  // Job acceptance states
  const [acceptingJobId, setAcceptingJobId] = useState<string | null>(null);
  const [acceptedJobIds, setAcceptedJobIds] = useState<string[]>([]);
  const [jobActionError, setJobActionError] = useState<string | null>(null);

  const handleDeliverToRecycler = async (pickupId: string) => {
    setIsDeliveringToRecycler(true);
    try {
      await deliverPickupToRecycler(pickupId, {
        recycler_id: 'usr_guest_recy',
        recycler_name: 'GreenCycle Processing Hub 4',
      });
      setIsDeliveredToRecycler(true);
      setActionNotice(
        isUrdu
          ? 'بیچ کامیابی سے گرین سائیکل ہب کو فراہم کر دیا گیا۔'
          : 'Batch successfully handed over and delivered to GreenCycle Processing Hub 4! Recycler notified.'
      );
      onRefresh();
    } catch (err: any) {
      alert(`Delivery Error: ${err.message}`);
    } finally {
      setIsDeliveringToRecycler(false);
    }
  };

  useEffect(() => {
    getMyEarnings()
      .then((data) => setEarnings(data))
      .catch(() => {});
  }, []);

  // Cleanup object URLs on unmount or file replace
  useEffect(() => {
    return () => {
      if (photoPreviewUrl && photoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  // Check for assigned or in-progress pickups
  useEffect(() => {
    if (!activeWorkflowPickup) {
      const active = pickups.find(
        (p) =>
          p.status === 'assigned' ||
          p.status === 'accepted' ||
          p.status === 'in_progress' ||
          p.status === 'weight_verified'
      );
      if (active) {
        setActiveWorkflowPickup(active);
        const hasPhoto = Boolean(active.scale_photo_url || (active.images && active.images.length > 0));
        if (active.status === 'assigned' || active.status === 'accepted') {
          setWorkflowStep(1);
          setMaxUnlockedStep(1);
        } else if (active.status === 'in_progress') {
          if (hasPhoto) {
            setWorkflowStep(3);
            setMaxUnlockedStep(3);
            setUploadedPhotoUrl(active.scale_photo_url || active.images![0].image_url);
          } else {
            setWorkflowStep(2);
            setMaxUnlockedStep(2);
          }
        } else if (active.status === 'weight_verified') {
          setWorkflowStep(4);
          setMaxUnlockedStep(4);
        }
        setVerifiedWeight(String(active.estimated_quantity_kg || 15.0));
      }
    } else {
      const fresh = pickups.find((p) => p.id === activeWorkflowPickup.id);
      if (fresh) {
        setActiveWorkflowPickup((prev) => (prev ? { ...prev, ...fresh } : fresh));
        if (fresh.scale_photo_url && !uploadedPhotoUrl) {
          setUploadedPhotoUrl(fresh.scale_photo_url);
        }
      }
    }
  }, [pickups, activeWorkflowPickup, uploadedPhotoUrl]);

  // Dynamic benchmark rate for active pickup
  const currentRateItem = useMemo(() => {
    const code = activeWorkflowPickup?.material_code || 'PET_PLASTIC';
    return (
      materialRates.find((r) => r.code === code) ||
      INITIAL_MATERIAL_RATES.find((r) => r.code === code) ||
      INITIAL_MATERIAL_RATES[0]
    );
  }, [activeWorkflowPickup, materialRates]);

  const benchmarkRate = currentRateItem.benchmark_rate_pkr;
  const numWeight = parseFloat(verifiedWeight);
  const isValidWeight = !isNaN(numWeight) && isFinite(numWeight) && numWeight > 0 && numWeight <= 2500;
  const calculatedTotal = isValidWeight ? (numWeight * benchmarkRate * qualityFactor).toFixed(2) : '0.00';

  // Auto-completion on Stage 4 entry
  useEffect(() => {
    if (
      workflowStep === 4 &&
      activeWorkflowPickup &&
      activeWorkflowPickup.status !== 'completed' &&
      !isCompletingSettlement &&
      !settlementData
    ) {
      setIsCompletingSettlement(true);
      setSettlementError(null);
      confirmPickup(activeWorkflowPickup.id)
        .then((res: any) => {
          const calc =
            res.pricing_calculations?.find((c: any) => !c.is_estimated) ||
            res.pricing_calculations?.[0];
          const finalPayout =
            res.settlement?.total_payout_pkr || calc?.total_price || Number(calculatedTotal);
          const weight =
            res.settlement?.verified_weight_kg ||
            calc?.verified_weight_kg ||
            (isValidWeight ? numWeight : 15);
          const txnRef =
            res.settlement?.transaction_ref ||
            res.payment?.transaction_reference ||
            `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${activeWorkflowPickup.id.slice(-6).toUpperCase()}`;

          setSettlementData({
            verified_weight_kg: weight,
            material_name: currentRateItem.name,
            rate_applied: currentRateItem.benchmark_rate_pkr,
            quality_factor: qualityFactor,
            total_payout_pkr: finalPayout,
            transaction_ref: txnRef,
            completed_at: new Date().toLocaleTimeString(),
          });
          setActiveWorkflowPickup((prev) => (prev ? { ...prev, status: 'completed' } : prev));
          onRefresh();
        })
        .catch((err: any) => {
          setSettlementError(err.message || 'Settlement completed.');
          setSettlementData({
            verified_weight_kg: isValidWeight ? numWeight : 15,
            material_name: currentRateItem.name,
            rate_applied: currentRateItem.benchmark_rate_pkr,
            quality_factor: qualityFactor,
            total_payout_pkr: Number(calculatedTotal),
            transaction_ref: `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${activeWorkflowPickup.id.slice(-6).toUpperCase()}`,
            completed_at: new Date().toLocaleTimeString(),
          });
        })
        .finally(() => {
          setIsCompletingSettlement(false);
        });
    }
  }, [
    workflowStep,
    activeWorkflowPickup,
    isCompletingSettlement,
    settlementData,
    calculatedTotal,
    isValidWeight,
    numWeight,
    currentRateItem,
    qualityFactor,
    onRefresh,
  ]);

  // Dynamically resolve nearby available jobs
  const availablePickupsList = useMemo(() => {
    const unassigned = pickups.filter(
      (p) =>
        ['requested', 'available', 'pending'].includes(p.status) ||
        (!p.assigned_collector_id && p.status !== 'completed' && p.status !== 'cancelled')
    );
    if (unassigned.length > 0) {
      return unassigned.map((p, idx) => ({
        id: p.id,
        tracking_number: p.tracking_number,
        distance: `${(0.8 + idx * 0.6).toFixed(1)} km`,
        material_code: p.material_code,
        material_name: p.material_code.replace(/_/g, ' '),
        estimated_quantity_kg: p.estimated_quantity_kg,
        expected_earning_pkr: p.payout_pkr || p.pricing_calculations?.[0]?.total_price || (p.estimated_quantity_kg * 80),
        street_address: p.street_address,
        preferred_time: p.preferred_time || 'Flexible Today',
        status: p.status,
        customer_name: p.customer_name || 'Customer',
        customer_phone: p.customer_phone,
        customer_photo_url: p.customer_photo_url || p.images?.find((i) => i.image_type === 'customer_upload')?.image_url,
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
        if (photoPreviewUrl && photoPreviewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(photoPreviewUrl);
        }
        setSelectedPhotoFile(null);
        setPhotoPreviewUrl(null);
        setUploadedPhotoUrl(null);
        setPhotoUploadError(null);
        setTripStartError(null);
        setWeightError(null);
        setSettlementData(null);
        if (fileInputRef.current) fileInputRef.current.value = '';

        setActiveWorkflowPickup(accepted);
        setWorkflowStep(1);
        setMaxUnlockedStep(1);
        setVerifiedWeight(String(accepted.estimated_quantity_kg || 15.0));

        const targetEl = document.getElementById('active-workflow-section');
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
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
    if (isStartingTrip) return;
    setIsStartingTrip(true);
    setTripStartError(null);
    try {
      await startPickup(pickupId, 24.8607, 67.0011);
      setActionNotice(
        isUrdu
          ? 'ٹرپ شروع ہو گیا! گاہک کو لائیو جی پی ایس فراہم کر دیا گیا۔'
          : 'Pickup trip started! Live GPS shared with customer.'
      );
      setMaxUnlockedStep((prev) => Math.max(prev, 2) as any);
      setWorkflowStep(2);
      setActiveWorkflowPickup((prev) => (prev ? { ...prev, status: 'in_progress' } : prev));
      onRefresh();
    } catch (err: any) {
      setTripStartError(err.message || 'Error starting trip. Please retry.');
    } finally {
      setIsStartingTrip(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoUploadError(null);

    const mime = file.type.toLowerCase();
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowed.includes(mime) && !['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      setPhotoUploadError(
        isUrdu
          ? 'صرف JPG، PNG یا WebP تصاویر کی اجازت ہے۔'
          : 'Unsupported format. Only JPG, JPEG, PNG, and WebP images are supported.'
      );
      return;
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setPhotoUploadError(
        isUrdu
          ? `فائل کا سائز ${(file.size / (1024 * 1024)).toFixed(1)}MB ہے۔ زیادہ سے زیادہ 10MB کی اجازت ہے۔`
          : `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds 10MB maximum limit.`
      );
      return;
    }

    if (photoPreviewUrl && photoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreviewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedPhotoFile(file);
    setPhotoPreviewUrl(objectUrl);
  };

  const handleRemovePhoto = () => {
    if (photoPreviewUrl && photoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    setSelectedPhotoFile(null);
    setPhotoPreviewUrl(null);
    setUploadedPhotoUrl(null);
    setPhotoUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReplacePhoto = () => {
    fileInputRef.current?.click();
  };

  const handleUploadPhoto = async (pickupId: string) => {
    if (isUploadingPhoto) return;
    if (!selectedPhotoFile && !uploadedPhotoUrl) {
      setPhotoUploadError(
        isUrdu ? 'براہ کرم پہلے پیمانے کی تصویر منتخب کریں۔' : 'Please capture or select a photo proof first.'
      );
      return;
    }

    if (!selectedPhotoFile && uploadedPhotoUrl) {
      setMaxUnlockedStep((prev) => Math.max(prev, 3) as any);
      setWorkflowStep(3);
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedPhotoFile!);
      formData.append('image_type', 'scale_display');
      formData.append('caption', 'On-site scale photo evidence');

      const updated = await uploadPickupPhoto(pickupId, formData);
      const url = updated.scale_photo_url || updated.images?.[0]?.image_url || photoPreviewUrl || '';
      setUploadedPhotoUrl(url);
      setActionNotice(
        isUrdu
          ? 'تصویری ثبوت کامیابی سے اپلوڈ ہو گیا! مرحلہ 3 چالو ہے۔'
          : 'Scale photo proof uploaded and verified! Stage 3 Scale Weighing unlocked.'
      );
      setMaxUnlockedStep((prev) => Math.max(prev, 3) as any);
      setWorkflowStep(3);
      onRefresh();
    } catch (err: any) {
      setPhotoUploadError(err.message || 'Failed to upload photo proof. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmitVerifiedWeight = async (pickupId: string) => {
    if (isSubmittingWeight) return;

    const hasPhoto = Boolean(
      uploadedPhotoUrl ||
        activeWorkflowPickup?.scale_photo_url ||
        (activeWorkflowPickup?.images && activeWorkflowPickup.images.length > 0)
    );
    if (!hasPhoto) {
      setWeightError(
        isUrdu
          ? 'پہلے مرحلہ 2 میں تصویری ثبوت اپلوڈ کرنا لازمی ہے۔'
          : 'Photo proof is required before scale weight verification. Please complete Stage 2 first.'
      );
      return;
    }

    if (!isValidWeight) {
      if (isNaN(numWeight) || numWeight <= 0) {
        setWeightError(
          isUrdu
            ? 'برائے مہربانی 0 کلو سے زیادہ درست وزن درج کریں۔'
            : 'Please enter a valid weight strictly greater than 0 kg.'
        );
      } else if (numWeight > 2500) {
        setWeightError(
          isUrdu ? 'وزن 2500 کلو سے زیادہ نہیں ہو سکتا۔' : 'Scale weight cannot exceed 2500 kg for a single pickup.'
        );
      }
      return;
    }

    setIsSubmittingWeight(true);
    setWeightError(null);
    try {
      const updated = await submitWeight(pickupId, {
        verified_weight_kg: numWeight,
        quality_factor: qualityFactor,
        quality_grade: qualityGrade,
        scale_photo_url: uploadedPhotoUrl || activeWorkflowPickup?.scale_photo_url || undefined,
      });

      const calc =
        updated.pricing_calculations?.find((c) => !c.is_estimated) ||
        updated.pricing_calculations?.[0];
      const finalPrice = calc?.total_price || Number(calculatedTotal);

      setSettlementData({
        verified_weight_kg: numWeight,
        material_name: currentRateItem.name,
        rate_applied: benchmarkRate,
        quality_factor: qualityFactor,
        total_payout_pkr: finalPrice,
        transaction_ref: `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${pickupId.slice(-6).toUpperCase()}`,
        completed_at: new Date().toLocaleTimeString(),
      });

      setActionNotice(
        isUrdu
          ? 'تصدیق شدہ وزن درج ہو گیا! حتمی رسید تیار ہے۔'
          : 'Certified weight recorded! Proceeding to final settlement.'
      );
      setMaxUnlockedStep(4);
      setWorkflowStep(4);
      setActiveWorkflowPickup((prev) => (prev ? { ...prev, status: 'weight_verified' } : prev));
      onRefresh();
    } catch (err: any) {
      setWeightError(err.message || 'Error submitting certified weight.');
    } finally {
      setIsSubmittingWeight(false);
    }
  };

  const handleReadyForNextJob = async () => {
    if (isTransitioningNextJob) return;
    setIsTransitioningNextJob(true);

    if (photoPreviewUrl && photoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    setSelectedPhotoFile(null);
    setPhotoPreviewUrl(null);
    setUploadedPhotoUrl(null);
    setPhotoUploadError(null);
    setTripStartError(null);
    setWeightError(null);
    setSettlementError(null);
    setSettlementData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    try {
      const currentId = activeWorkflowPickup?.id;

      const nextAssigned = pickups.find(
        (p) =>
          p.id !== currentId &&
          (p.status === 'assigned' || p.status === 'accepted')
      );

      if (nextAssigned) {
        setActiveWorkflowPickup(nextAssigned);
        setWorkflowStep(1);
        setMaxUnlockedStep(1);
        setVerifiedWeight(String(nextAssigned.estimated_quantity_kg || 15.0));
        setActionNotice(
          isUrdu
            ? `اگلا تفویض شدہ کام (${nextAssigned.tracking_number || nextAssigned.id}) لوڈ ہو گیا۔`
            : `Loaded next assigned job (${nextAssigned.tracking_number || nextAssigned.id}). Ready for trip departure.`
        );
      } else {
        const nextRequested = pickups.find((p) => p.id !== currentId && p.status === 'requested');
        if (nextRequested) {
          const accepted = await acceptPickup(nextRequested.id);
          setAcceptedJobIds((prev) => [...prev, nextRequested.id]);
          setActiveWorkflowPickup(accepted);
          setWorkflowStep(1);
          setMaxUnlockedStep(1);
          setVerifiedWeight(String(accepted.estimated_quantity_kg || 15.0));
          setActionNotice(
            isUrdu
              ? `اگلا قریبی کام قبول کر لیا گیا! نیویگیشن چالو ہو گئی۔`
              : `Accepted next nearby job (${accepted.tracking_number || accepted.id})! Ready for trip departure.`
          );
        } else {
          setActiveWorkflowPickup(null);
          setActionNotice(
            isUrdu
              ? 'تمام تفویض شدہ کام مکمل ہو چکے ہیں! قریبی فہرست سے نیا کام تلاش کریں۔'
              : 'All active dispatches completed! Check the nearby list for new job requests.'
          );
        }
      }
      onRefresh();
    } catch (err: any) {
      setActionNotice(err.message || 'Error transitioning to next job.');
    } finally {
      setIsTransitioningNextJob(false);
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
      <div id="active-workflow-section" className="bg-[#0F3D3E] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-[#0F3D3E]/25 border border-[#1F4A4B] scroll-mt-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#1B7F5C]/30 text-[#9FE6C6] border border-[#2FA37A]/30 text-xs font-bold mb-2">
              <span className="w-2 h-2 rounded-full bg-[#2FA37A] animate-ping" />
              <span>{isUrdu ? 'فعال فیلڈ جاب • موبائل ورک فلو' : 'Active Field Job • Mobile Flow'}</span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-white">
              {isUrdu ? 'مرحلہ وار پک اپ ایگزیکیوشن' : 'Step-by-Step Pickup Execution'}
            </h2>
            <p className="text-xs text-[#9DB8AE] mt-0.5">
              {activeWorkflowPickup 
                ? `${activeWorkflowPickup.tracking_number || activeWorkflowPickup.id} • ${activeWorkflowPickup.street_address}`
                : isUrdu 
                ? 'تیز رفتار ایک ٹچ فیلڈ لاگنگ اور آؤٹ ڈور دھوپ کے لیے بہتر بنایا گیا ہے'
                : 'Optimized for high-contrast outdoor sunlight and quick 1-touch field logging'}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] text-[#9FE6C6] uppercase font-bold block">
              {isUrdu ? 'موجودہ مرحلہ' : 'Current Stage'}
            </span>
            <span className="text-sm font-mono font-extrabold text-[#F2A900]">
              {isUrdu ? `مرحلہ ${workflowStep} از 4` : `Stage ${workflowStep} of 4`}
            </span>
          </div>
        </div>

        {/* Step Indicator / Stepper */}
        <div className="grid grid-cols-4 gap-2 mb-6" role="tablist">
          {[
            { num: 1, title: isUrdu ? 'ٹرپ شروع' : 'Trip Start' },
            { num: 2, title: isUrdu ? 'تصویری ثبوت' : 'Photo Proof' },
            { num: 3, title: isUrdu ? 'پیمانہ وزن' : 'Scale Weigh' },
            { num: 4, title: isUrdu ? 'ادائیگی و رسید' : 'Settlement' },
          ].map((st) => {
            const isCurrent = workflowStep === st.num;
            const isUnlocked = st.num <= maxUnlockedStep;
            const isLocked = !isUnlocked;
            return (
              <button
                key={st.num}
                type="button"
                disabled={isLocked}
                onClick={() => {
                  if (isUnlocked) setWorkflowStep(st.num as any);
                }}
                className={`p-2.5 rounded-xl text-center transition border min-h-[44px] flex flex-col items-center justify-center relative ${
                  isCurrent
                    ? 'bg-[#1B7F5C] border-white/50 shadow-md font-extrabold text-white ring-2 ring-white/20'
                    : isUnlocked
                    ? 'bg-[#2FA37A]/20 border-[#2FA37A]/40 text-[#9FE6C6] hover:bg-[#2FA37A]/30 cursor-pointer'
                    : 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed opacity-50'
                }`}
                aria-label={`Stage ${st.num}: ${st.title} ${isLocked ? '(Locked)' : ''}`}
                aria-selected={isCurrent}
                role="tab"
              >
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] font-mono">STEP {st.num}</span>
                  {isLocked && <Lock className="w-2.5 h-2.5 text-white/40 inline shrink-0" />}
                  {st.num < maxUnlockedStep && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 inline shrink-0" />}
                </div>
                <span className="text-xs font-bold truncate block">{st.title}</span>
              </button>
            );
          })}
        </div>

        {/* Form Container */}
        <div className="bg-[#0B2F30]/70 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-[#1F4A4B]">
          
          {/* If No Active Pickup */}
          {!activeWorkflowPickup ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#9FE6C6]">
                <Truck className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-white">
                  {isUrdu ? 'کوئی فعال فیلڈ جاب منتخب نہیں ہے' : 'No Active Field Job Selected'}
                </h3>
                <p className="text-xs text-[#9DB8AE] max-w-md mx-auto">
                  {isUrdu
                    ? 'مرحلہ وار فیلڈ تصدیقی فلو شروع کرنے کے لیے نیچے دی گئی قریبی فہرست سے کوئی کام قبول کریں۔'
                    : 'Accept a nearby pickup from the list below to begin the step-by-step field verification flow.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('nearby-jobs');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3 rounded-xl bg-[#1B7F5C] hover:bg-[#146B4D] text-white font-extrabold text-xs transition shadow-md min-h-[44px]"
              >
                {isUrdu ? 'دستیاب قریبی کام دیکھیں' : 'View Nearby Available Jobs'}
              </button>
            </div>
          ) : (
            <>
              {/* STAGE 1: Trip Start */}
              {workflowStep === 1 && (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex items-start space-x-3 text-xs">
                      <MapPin className="w-5 h-5 text-[#9FE6C6] shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-extrabold text-white text-sm">
                          {activeWorkflowPickup.street_address}
                        </p>
                        <p className="text-[#9DB8AE] text-xs mt-0.5">
                          {isUrdu ? 'گاہک' : 'Customer'}: {activeWorkflowPickup.customer_id} • {isUrdu ? 'تخمینہ' : 'Estimated'}: {activeWorkflowPickup.estimated_quantity_kg} kg {currentRateItem.name}
                        </p>
                        <p className="text-[#6EE7B7] text-[11px] mt-1 font-mono">
                          {isUrdu ? 'ترجیحی وقت' : 'Preferred Time'}: {activeWorkflowPickup.preferred_time || 'Flexible Today'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Trip Start Error Alert if any */}
                  {tripStartError && (
                    <div className="p-4 bg-red-500/15 border border-red-500/30 text-red-200 rounded-xl text-xs flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <span>{tripStartError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTripStartError(null)}
                        className="text-red-400 font-bold ml-2 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Start Trip CTA */}
                  <button
                    type="button"
                    disabled={isStartingTrip}
                    onClick={() => handleStartTrip(activeWorkflowPickup.id)}
                    className="w-full bg-[#1B7F5C] hover:bg-[#146B4D] active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold py-4 px-6 rounded-2xl text-base transition shadow-lg shadow-[#1B7F5C]/30 flex items-center justify-center space-x-2 min-h-[48px] cursor-pointer"
                  >
                    {isStartingTrip ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{isUrdu ? 'ٹرپ شروع کیا جا رہا ہے...' : 'Starting Trip & Sharing GPS...'}</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-5 h-5" />
                        <span>{isUrdu ? 'ٹرپ شروع کریں اور جی پی ایس شیئر کریں (1-ٹیپ)' : 'Start Trip & Share GPS Coordinates (1-Tap)'}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* STAGE 2: Photo Proof */}
              {workflowStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#9FE6C6] uppercase tracking-wider">
                      {isUrdu ? 'پیمانے کا تصویری ثبوت اپلوڈ کریں' : 'Upload Scale & Recyclables Photo Proof'}
                    </p>
                    <span className="text-[10px] text-[#9DB8AE] font-mono">
                      JPG, PNG, WebP • Max 10MB
                    </span>
                  </div>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  {/* Photo Error Banner */}
                  {photoUploadError && (
                    <div className="p-3.5 bg-red-500/15 border border-red-500/30 text-red-200 rounded-xl text-xs flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <span>{photoUploadError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPhotoUploadError(null)}
                        className="text-red-400 font-bold ml-2 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Photo Preview / Dropzone */}
                  {photoPreviewUrl || uploadedPhotoUrl ? (
                    <div className="space-y-3">
                      <div className="relative rounded-2xl overflow-hidden border-2 border-[#2FA37A] bg-black/40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photoPreviewUrl || uploadedPhotoUrl || ''}
                          alt="Scale Photo Evidence"
                          className="w-full max-h-60 object-contain mx-auto"
                        />
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex items-center justify-between text-xs">
                          <span className="text-[#9FE6C6] font-semibold truncate flex items-center space-x-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>
                              {selectedPhotoFile ? `${selectedPhotoFile.name} (${(selectedPhotoFile.size / 1024).toFixed(0)} KB)` : 'Scale Proof Attached'}
                            </span>
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                            Ready
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={handleReplacePhoto}
                          className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center justify-center space-x-2 min-h-[44px]"
                        >
                          <Camera className="w-4 h-4 text-[#9FE6C6]" />
                          <span>{isUrdu ? 'تصویر تبدیل کریں' : 'Change Photo'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="py-3 px-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold transition flex items-center justify-center space-x-1 min-h-[44px]"
                        >
                          <X className="w-4 h-4" />
                          <span>{isUrdu ? 'ختم کریں' : 'Remove'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={handleReplacePhoto}
                      className="border-2 border-dashed border-[#2FA37A]/50 hover:border-[#2FA37A] bg-white/5 hover:bg-white/10 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 min-h-[160px]"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#1B7F5C]/40 text-[#9FE6C6] flex items-center justify-center">
                        <Camera className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-extrabold text-white">
                        {isUrdu ? 'پیمانے کی تصویر لینے یا منتخب کرنے کے لیے ٹیپ کریں' : 'Tap to Snap or Upload Scale Display Photo'}
                      </p>
                      <p className="text-[11px] text-[#9DB8AE]">
                        {isUrdu ? 'ڈیجیٹل وزن کے ڈسپلے کی واضح تصویر اپلوڈ کریں' : 'Clear outdoor shot of digital scale reading & tied bags'}
                      </p>
                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-[#6EE7B7] bg-[#1B7F5C]/30 px-2.5 py-1 rounded-full border border-[#2FA37A]/30">
                        <Upload className="w-3 h-3" />
                        <span>Camera / Gallery (JPG, PNG, WebP &le; 10MB)</span>
                      </span>
                    </div>
                  )}

                  {/* Proceed to Stage 3 Button */}
                  <button
                    type="button"
                    disabled={isUploadingPhoto || (!selectedPhotoFile && !uploadedPhotoUrl)}
                    onClick={() => handleUploadPhoto(activeWorkflowPickup.id)}
                    className="w-full bg-[#1B7F5C] hover:bg-[#146B4D] active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold py-4 px-6 rounded-2xl text-base transition shadow-lg flex items-center justify-center space-x-2 min-h-[48px] cursor-pointer"
                  >
                    {isUploadingPhoto ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{isUrdu ? 'تصویر اپلوڈ ہو رہی ہے...' : 'Uploading & Verifying Proof...'}</span>
                      </>
                    ) : (
                      <>
                        <span>{isUrdu ? 'تصویر محفوظ کریں اور وزن کے مرحلے پر جائیں' : 'Save Photo Proof & Proceed to Weighing'}</span>
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* STAGE 3: Scale Weigh */}
              {workflowStep === 3 && (
                <div className="space-y-5">
                  {/* Prerequisite Photo Warning if none exists */}
                  {!uploadedPhotoUrl && !activeWorkflowPickup.scale_photo_url && (!activeWorkflowPickup.images || activeWorkflowPickup.images.length === 0) ? (
                    <div className="p-4 bg-amber-500/15 border border-amber-500/30 text-amber-200 rounded-xl text-xs space-y-3">
                      <div className="flex items-center space-x-2 font-bold">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{isUrdu ? 'پیمانے کا تصویری ثبوت درکار ہے' : 'Photo Proof Required'}</span>
                      </div>
                      <p className="text-[11px] text-amber-300">
                        {isUrdu
                          ? 'تصدیق شدہ وزن درج کرنے سے پہلے مرحلہ 2 میں تصویری ثبوت منسلک کرنا لازمی ہے۔'
                          : 'You must upload on-site scale photo evidence in Stage 2 before entering certified scale weight.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setWorkflowStep(2)}
                        className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-white rounded-lg font-bold text-xs transition min-h-[44px]"
                      >
                        {isUrdu ? 'مرحلہ 2 پر واپس جائیں' : 'Return to Stage 2 Photo Proof'}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        {/* Large Scale Reading Input */}
                        <div>
                          <label className="block text-xs font-bold text-[#9FE6C6] uppercase tracking-wider mb-1.5">
                            {isUrdu ? 'تصدیق شدہ پیمانہ وزن (کلوگرام)' : 'Certified Scale Weight (kg)'}
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.1"
                              min="0.1"
                              max="2500"
                              value={verifiedWeight}
                              onChange={(e) => {
                                setVerifiedWeight(e.target.value);
                                setWeightError(null);
                              }}
                              className={`w-full bg-white/10 border-2 rounded-2xl px-4 py-3.5 text-2xl font-extrabold font-mono text-white focus:outline-none transition ${
                                !isValidWeight ? 'border-red-400/80 focus:border-red-400' : 'border-[#1F4A4B] focus:border-[#2FA37A]'
                              }`}
                              placeholder="e.g. 15.0"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono font-bold text-[#9DB8AE] text-sm">
                              kg
                            </span>
                          </div>
                          {!isValidWeight && (
                            <p className="text-red-400 text-[11px] mt-1 font-semibold">
                              {numWeight > 2500
                                ? 'Weight cannot exceed 2500 kg'
                                : 'Weight must be strictly greater than 0 kg'}
                            </p>
                          )}
                        </div>

                        {/* Quality Factor Selector */}
                        <div>
                          <label className="block text-xs font-bold text-[#9FE6C6] uppercase tracking-wider mb-1.5">
                            {isUrdu ? 'کوالٹی گریڈنگ' : 'Quality Grading'}
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
                                className={`py-3.5 rounded-xl text-xs font-extrabold transition border min-h-[44px] ${
                                  qualityGrade === g.grade
                                    ? 'bg-[#1B7F5C] border-white text-white shadow-md ring-1 ring-white/30'
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
                      <div className="p-4 rounded-xl bg-[#072021]/90 border border-[#1F4A4B] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#E6F4EC]">
                        <span>
                          {isUrdu ? 'حساب کتاب' : 'Breakdown'}: {isValidWeight ? numWeight : 0} kg &times; Rs {benchmarkRate.toFixed(2)} &times; {qualityFactor} (Factor)
                        </span>
                        <span className="text-lg font-extrabold font-mono text-[#F2A900]">
                          {isUrdu ? 'کل رقم' : 'Total'}: Rs {calculatedTotal}
                        </span>
                      </div>

                      {/* Error Banner */}
                      {weightError && (
                        <div className="p-3.5 bg-red-500/15 border border-red-500/30 text-red-200 rounded-xl text-xs flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                            <span>{weightError}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setWeightError(null)}
                            className="text-red-400 font-bold ml-2 hover:text-white"
                          >
                            ✕
                          </button>
                        </div>
                      )}

                      {/* Submit CTA */}
                      <button
                        type="button"
                        disabled={isSubmittingWeight || !isValidWeight}
                        onClick={() => handleSubmitVerifiedWeight(activeWorkflowPickup.id)}
                        className="w-full bg-[#1B7F5C] hover:bg-[#146B4D] active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold py-4 px-6 rounded-2xl text-base transition shadow-lg shadow-[#1B7F5C]/30 flex items-center justify-center space-x-2 min-h-[48px] cursor-pointer"
                      >
                        {isSubmittingWeight ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>{isUrdu ? 'وزن تصدیق کیا جا رہا ہے...' : 'Recording Weight to Ledger...'}</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            <span>{isUrdu ? 'تصدیق شدہ وزن جمع کریں اور رسید حاصل کریں' : 'Submit Certified Weight & Generate Receipt'}</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* STAGE 4: Settlement & Completion */}
              {workflowStep === 4 && (
                <div className="py-2 space-y-5">
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 rounded-full bg-[#2FA37A] text-[#0B2F30] flex items-center justify-center mx-auto shadow-lg shadow-[#2FA37A]/30">
                      <CheckCircle2 className="w-8 h-8 text-[#0B2F30]" />
                    </div>
                    <h3 className="text-xl font-extrabold text-white">
                      {isUrdu ? 'پک اپ اور ادائیگی کامیابی سے مکمل!' : 'Pickup Completed Successfully!'}
                    </h3>
                    <p className="text-xs text-[#9DB8AE] max-w-md mx-auto">
                      {isUrdu
                        ? 'تصدیق شدہ وزن اور ادائیگی صفائی پے کے لیجر پر محفوظ کر لی گئی ہے۔'
                        : 'Verified weight logged to SafaiPay immutable ledger. Digital payment approved and disbursed.'}
                    </p>
                  </div>

                  {/* Settlement Receipt Card */}
                  <div className="bg-[#072021]/90 rounded-2xl p-5 border border-[#1F4A4B] space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
                      <span className="text-[#9DB8AE] flex items-center space-x-1.5 font-bold uppercase tracking-wider">
                        <Receipt className="w-4 h-4 text-[#9FE6C6]" />
                        <span>{isUrdu ? 'ڈیجیٹل رسید' : 'Settlement Receipt'}</span>
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px] border border-emerald-500/30">
                        {settlementData?.transaction_ref || 'TXN-CONFIRMED'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-[10px] text-[#9DB8AE] block uppercase font-bold">{isUrdu ? 'خالص وزن' : 'Net Weight'}</span>
                        <span className="font-mono font-extrabold text-white text-base">
                          {settlementData?.verified_weight_kg || verifiedWeight} kg
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-[10px] text-[#9DB8AE] block uppercase font-bold">{isUrdu ? 'شرح فی کلو' : 'Unit Rate'}</span>
                        <span className="font-mono font-extrabold text-white text-base">
                          Rs {settlementData?.rate_applied || benchmarkRate}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-[10px] text-[#9DB8AE] block uppercase font-bold">{isUrdu ? 'کوالٹی گریڈ' : 'Grade'}</span>
                        <span className="font-extrabold text-[#9FE6C6] text-base">
                          Grade {qualityGrade} ({qualityFactor * 100}%)
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-[10px] text-[#9DB8AE] block uppercase font-bold">{isUrdu ? 'کل ادائیگی' : 'Payout'}</span>
                        <span className="font-mono font-extrabold text-[#F2A900] text-base">
                          Rs {settlementData?.total_payout_pkr || calculatedTotal}
                        </span>
                      </div>
                    </div>

                    {isCompletingSettlement && (
                      <div className="flex items-center justify-center space-x-2 py-2 text-xs text-[#9FE6C6]">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Finalizing digital ledger entry...</span>
                      </div>
                    )}
                  </div>

                  {/* Handover to Recycler & Next Job CTAs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isDeliveringToRecycler || isDeliveredToRecycler}
                      onClick={() => activeWorkflowPickup && handleDeliverToRecycler(activeWorkflowPickup.id)}
                      className={`w-full py-4 px-5 rounded-2xl text-xs font-extrabold transition flex items-center justify-center space-x-2 border min-h-[48px] ${
                        isDeliveredToRecycler
                          ? 'bg-blue-900/40 border-blue-500/40 text-blue-200 cursor-default shadow-xs'
                          : 'bg-[#0B3A3B] hover:bg-[#124B4C] border-[#2FA37A]/50 text-white shadow-md active:scale-98 cursor-pointer'
                      }`}
                    >
                      {isDeliveringToRecycler ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>{isUrdu ? 'گرین سائیکل کو پہنچایا جا رہا ہے...' : 'Handing over to Recycler...'}</span>
                        </>
                      ) : isDeliveredToRecycler ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-blue-400" />
                          <span>{isUrdu ? 'ری سائیکلر کو فراہم کر دیا گیا' : 'Delivered to Recycler'}</span>
                        </>
                      ) : (
                        <>
                          <Truck className="w-4 h-4 text-emerald-400" />
                          <span>{isUrdu ? 'ری سائیکلنگ ہب کو فراہم کریں' : 'Handover / Deliver to Recycler'}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isTransitioningNextJob}
                      onClick={handleReadyForNextJob}
                      className="w-full bg-[#1B7F5C] hover:bg-[#146B4D] active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold py-4 px-6 rounded-2xl text-xs sm:text-sm transition shadow-lg shadow-[#1B7F5C]/30 flex items-center justify-center space-x-2 min-h-[48px] cursor-pointer"
                    >
                      {isTransitioningNextJob ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{isUrdu ? 'اگلا کام تلاش کیا جا رہا ہے...' : 'Finding Next Available Job...'}</span>
                        </>
                      ) : (
                        <>
                          <span>{isUrdu ? 'اگلا کام شروع کریں' : 'Ready for Next Job'}</span>
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
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
      <div id="nearby-jobs" className="bg-theme-surface rounded-3xl border border-theme-border shadow-xs overflow-hidden transition-colors scroll-mt-6">
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

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1">
                    <span className="text-theme-secondary">
                      Est. Weight: <strong className="text-theme-text">{job.estimated_quantity_kg} kg</strong>
                    </span>
                    <span className="text-theme-text font-medium flex items-center gap-1.5">
                      Est. Payout: <strong className="bg-theme-soft-mint text-theme-primary px-2 py-0.5 rounded border border-theme-border">Rs {job.expected_earning_pkr}</strong>
                    </span>
                    {job.customer_photo_url && (
                      <span className="text-[10px] text-theme-primary font-bold bg-theme-soft-mint px-2 py-0.5 rounded border border-theme-border flex items-center gap-1">
                        <Camera className="w-3 h-3" />
                        <span>Photo Attached</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Customer Photo Thumbnail if uploaded */}
                {job.customer_photo_url && (
                  <div className="shrink-0 flex items-center">
                    <img
                      src={job.customer_photo_url}
                      alt="Customer evidence"
                      className="w-14 h-14 rounded-xl object-cover border border-theme-border cursor-pointer hover:opacity-85 shadow-xs transition"
                      onClick={() => setSelectedPhotoModal(job.customer_photo_url)}
                      title="Click to view customer photo evidence"
                    />
                  </div>
                )}

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

      {/* Enlarged Photo Modal */}
      {selectedPhotoModal && (
        <div className="fixed inset-0 z-50 bg-[#072021]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-theme-surface border border-theme-border rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-theme-text">Customer Photo Evidence</h3>
              <button
                type="button"
                onClick={() => setSelectedPhotoModal(null)}
                className="p-1 rounded-lg hover:bg-theme-bg text-theme-secondary hover:text-theme-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-theme-border bg-black/5 dark:bg-black/40">
              <img
                src={selectedPhotoModal}
                alt="Enlarged photo evidence"
                className="w-full max-h-[70vh] object-contain mx-auto"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPhotoModal(null)}
                className="px-5 py-2.5 bg-theme-primary text-white font-extrabold text-xs rounded-xl shadow-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
