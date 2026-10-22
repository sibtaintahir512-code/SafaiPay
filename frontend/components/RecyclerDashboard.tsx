'use client';

import React, { useState, useMemo, useRef } from 'react';
import { PickupRequest, MaterialRate } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';
import { HorizontalBarChart, HorizontalBarItem } from '@/components/charts/HorizontalBarChart';
import { DonutPercentageChart, DonutSegment } from '@/components/charts/DonutPercentageChart';
import { processRecyclerBatch, uploadFile } from '@/lib/api';
import { 
  Factory, 
  PackageCheck, 
  ShoppingCart, 
  RefreshCw, 
  CheckCircle2, 
  Search, 
  Filter, 
  MapPin, 
  ShieldCheck, 
  Truck, 
  Scale, 
  ArrowRight,
  Layers,
  FileText,
  BadgeCheck,
  TrendingUp,
  Clock,
  Camera,
  Upload,
  X,
  Loader2,
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface RecyclerDashboardProps {
  pickups: PickupRequest[];
  materialRates: MaterialRate[];
  onRefresh: () => void;
}

interface MaterialBatch {
  id: string;
  pickupId?: string;
  material: string;
  materialCode: string;
  quality: string;
  weightKg: number;
  location: string;
  ratePerKg: number | string;
  totalEstimate: number;
  status: 'Ready for Dispatch' | 'In Transit' | 'Procured' | 'Processing' | 'Completed';
  hub: string;
  calibrationId: string;
  customerPhotoUrl?: string | null;
  scalePhotoUrl?: string | null;
  recyclerPhotoUrl?: string | null;
  rawStatus?: string;
  collectorName?: string;
  customerName?: string;
}

const SAMPLE_BATCHES: MaterialBatch[] = [
  {
    id: 'BATCH-PET-680',
    material: 'PET Plastic',
    materialCode: 'PET_PLASTIC',
    quality: 'Grade A',
    weightKg: 680,
    location: 'Karachi',
    ratePerKg: 80,
    totalEstimate: 54400,
    status: 'Ready for Dispatch',
    hub: 'Clifton Aggregation Hub #4',
    calibrationId: 'SP-CAL-PET680',
  },
  {
    id: 'BATCH-CRD-1200',
    material: 'Cardboard',
    materialCode: 'CARDBOARD_OCC',
    quality: 'Dry Sorted',
    weightKg: 1200,
    location: 'Lahore',
    ratePerKg: 35,
    totalEstimate: 42000,
    status: 'Ready for Dispatch',
    hub: 'Gulberg Sorting Yard #2',
    calibrationId: 'SP-CAL-CRD1200',
  },
  {
    id: 'BATCH-MTL-600',
    material: 'Mixed Metal',
    materialCode: 'MIXED_METAL',
    quality: 'Verified',
    weightKg: 600,
    location: 'Rawalpindi',
    ratePerKg: 'Market Rate (Rs 120/kg)',
    totalEstimate: 72000,
    status: 'Ready for Dispatch',
    hub: 'I-9 Industrial Hub #1',
    calibrationId: 'SP-CAL-MTL600',
  },
  {
    id: 'BATCH-GLS-450',
    material: 'Glass Containers',
    materialCode: 'GLASS_BOTTLES',
    quality: 'Color Sorted',
    weightKg: 450,
    location: 'Karachi',
    ratePerKg: 25,
    totalEstimate: 11250,
    status: 'Ready for Dispatch',
    hub: 'Korangi Industrial Zone',
    calibrationId: 'SP-CAL-GLS450',
  },
];

const STOCK_DISTRIBUTION_DATA: HorizontalBarItem[] = [
  { label: 'Cardboard', value: 1200, secondaryText: 'Dry Sorted Grade', color: 'from-[#0F3D3E] to-[#12383A]' },
  { label: 'PET Plastic', value: 680, secondaryText: 'Grade A Flakes/Bales', color: 'from-[#1B7F5C] to-[#146B4D]' },
  { label: 'Metal', value: 600, secondaryText: 'Scrap Aluminum & Can Bales', color: 'from-[#F2A900] to-[#D99000]' },
];

const QUALITY_DONUT_DATA: DonutSegment[] = [
  { label: 'Grade A', percentage: 55, value: '1,364 kg', color: '#1B7F5C', textColor: '#146B4D' },
  { label: 'Dry Sorted', percentage: 30, value: '744 kg', color: '#2FA37A', textColor: '#1B7F5C' },
  { label: 'Other', percentage: 15, value: '372 kg', color: '#F2A900', textColor: '#0F3D3E' },
];

export const RecyclerDashboard: React.FC<RecyclerDashboardProps> = ({
  pickups,
  materialRates,
  onRefresh,
}) => {
  const { t, isUrdu } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMaterial, setFilterMaterial] = useState('ALL');
  const [filterLocation, setFilterLocation] = useState('ALL');
  const [selectedBatchForOrder, setSelectedBatchForOrder] = useState<MaterialBatch | null>(null);
  const [orderConfirmationNotice, setOrderConfirmationNotice] = useState<string | null>(null);
  const [selectedTraceabilityBatch, setSelectedTraceabilityBatch] = useState<MaterialBatch | null>(null);
  const [selectedEnlargedImage, setSelectedEnlargedImage] = useState<string | null>(null);

  // Recycler Processing Modal State
  const [processingJob, setProcessingJob] = useState<PickupRequest | null>(null);
  const [recycledWeightInput, setRecycledWeightInput] = useState<string>('');
  const [processingNotesInput, setProcessingNotesInput] = useState<string>('Sorted, granulated, and certified as high-purity recycled flakes.');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [isSubmittingProcessing, setIsSubmittingProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const proofFileInputRef = useRef<HTMLInputElement | null>(null);

  // Filter pickups relevant to recycling
  const relevantRecyclingJobs = useMemo(() => {
    return pickups.filter((p) =>
      ['picked_up', 'delivered_to_recycler', 'processing', 'completed'].includes(p.status)
    );
  }, [pickups]);

  // Combine real jobs with catalog batches for marketplace table
  const allBatches = useMemo(() => {
    const fromPickups: MaterialBatch[] = relevantRecyclingJobs.map((p) => {
      const calc = p.pricing_calculations?.[0];
      const weight = p.recycled_weight_kg || p.verified_weight_kg || p.estimated_quantity_kg || 15;
      const rate = calc?.material_rate_applied || 80;
      const matName = p.material_code.replace(/_/g, ' ');

      return {
        id: p.tracking_number || p.id,
        pickupId: p.id,
        material: matName,
        materialCode: p.material_code,
        quality: p.status === 'completed' ? 'Certified Recycled' : p.status === 'processing' ? 'Processing Yield' : 'Grade A Digital',
        weightKg: weight,
        location: p.city || 'Karachi',
        ratePerKg: rate,
        totalEstimate: weight * (typeof rate === 'number' ? rate : 80),
        status: p.status === 'completed' ? 'Completed' : p.status === 'processing' ? 'Processing' : 'In Transit',
        hub: p.street_address ? p.street_address.split(',')[0] : 'PECHS Hub',
        calibrationId: `SP-CAL-${p.id.slice(-6).toUpperCase()}`,
        customerPhotoUrl: p.customer_photo_url || p.images?.find((i) => i.image_type === 'customer_upload')?.image_url,
        scalePhotoUrl: p.scale_photo_url || p.images?.find((i) => i.image_type === 'scale_display' || i.image_type === 'collector_proof')?.image_url,
        recyclerPhotoUrl: p.recycler_photo_url || p.images?.find((i) => i.image_type === 'recycler_proof')?.image_url,
        rawStatus: p.status,
        collectorName: p.collector_name || 'Tariq Mehmood',
        customerName: p.customer_name || 'Amina Khan',
      };
    });

    return [...fromPickups, ...SAMPLE_BATCHES];
  }, [relevantRecyclingJobs]);

  const filteredBatches = allBatches.filter((b) => {
    const matchesSearch =
      b.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMaterial = filterMaterial === 'ALL' || b.materialCode === filterMaterial;
    const matchesLocation = filterLocation === 'ALL' || b.location === filterLocation;
    return matchesSearch && matchesMaterial && matchesLocation;
  });

  const handleStartProcessing = async (jobId: string) => {
    try {
      await processRecyclerBatch(jobId, { action: 'start_processing' });
      setOrderConfirmationNotice('Intake confirmed: Batch marked as In Processing. Facility wash & sorting cycle initiated.');
      onRefresh();
    } catch (err: any) {
      alert(`Processing Error: ${err.message}`);
    }
  };

  const handleOpenCompleteModal = (job: PickupRequest) => {
    setProcessingJob(job);
    setRecycledWeightInput(String(job.verified_weight_kg || job.estimated_quantity_kg || ''));
    setProcessingNotesInput('Washed, granulated, and certified as high-purity recycled flakes.');
    setProofFile(null);
    setProofPreviewUrl(null);
    setProcessingError(null);
  };

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    const url = URL.createObjectURL(file);
    setProofPreviewUrl(url);
  };

  const handleFinalizeRecycling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processingJob) return;

    const numWeight = Number(recycledWeightInput);
    if (isNaN(numWeight) || numWeight <= 0) {
      setProcessingError('Please enter a valid recycled output weight greater than 0 kg.');
      return;
    }

    setIsSubmittingProcessing(true);
    setProcessingError(null);

    try {
      let uploadedProofUrl: string | undefined = undefined;
      if (proofFile) {
        const formData = new FormData();
        formData.append('file', proofFile);
        formData.append('image_type', 'recycler_proof');
        formData.append('job_id', processingJob.id);
        const uploadRes = await uploadFile(formData);
        uploadedProofUrl = uploadRes.file_url;
      }

      await processRecyclerBatch(processingJob.id, {
        action: 'complete',
        recycled_weight_kg: numWeight,
        notes: processingNotesInput,
        proof_url: uploadedProofUrl,
      });

      setOrderConfirmationNotice(
        `Batch ${processingJob.tracking_number || processingJob.id} certified and completed! Output weight: ${numWeight} kg logged to circular registry.`
      );
      setProcessingJob(null);
      onRefresh();
    } catch (err: any) {
      setProcessingError(err.message || 'Failed to complete recycling processing.');
    } finally {
      setIsSubmittingProcessing(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 font-sans">
      
      {/* ================= 1. RECYCLER HEADER BANNER ================= */}
      <div className="bg-[#0F3D3E] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-[#0F3D3E]/20 border border-[#1F4A4B] relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#1B7F5C]/30 backdrop-blur-md border border-[#2FA37A]/30 text-xs font-semibold text-[#9FE6C6]">
              <ShieldCheck className="w-4 h-4 text-[#2FA37A]" />
              <span>Certified B2B Off-Taker & Recycling Plant Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {t('recycler.market_title', 'Verified Material Marketplace & Processing')}
            </h1>
            <p className="text-[#9DB8AE] text-sm max-w-2xl leading-relaxed">
              {t('recycler.market_sub', 'Procure pre-sorted, digitally weighed post-consumer recyclables directly from municipal informal waste supply chains with complete provenance.')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#0B2F30]/70 border border-[#1F4A4B] rounded-2xl p-4 text-center">
              <span className="text-[10px] text-[#9FE6C6] uppercase font-bold block">Certified Stock Ready</span>
              <span className="text-2xl font-extrabold font-mono text-[#6EE7B7]">
                {(2480 + relevantRecyclingJobs.reduce((acc, p) => acc + (p.verified_weight_kg || p.estimated_quantity_kg || 0), 0)).toLocaleString()} kg
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Alert */}
      {orderConfirmationNotice && (
        <div className="p-4 bg-[#E6F4EC] border border-[#D5E6DD] text-[#0F3D3E] rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#1B7F5C] shrink-0" />
            <span>{orderConfirmationNotice}</span>
          </div>
          <button onClick={() => setOrderConfirmationNotice(null)} className="text-[#1B7F5C] font-bold ml-4 hover:text-[#146B4D]">
            ✕
          </button>
        </div>
      )}

      {/* ================= 2. LIVE INTAKE & PROCESSING QUEUE ================= */}
      {relevantRecyclingJobs.length > 0 && (
        <div className="bg-theme-surface rounded-3xl border border-theme-border shadow-xs overflow-hidden transition-colors">
          <div className="p-6 border-b border-theme-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-bold mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Real-Time Facility Intake Queue</span>
              </div>
              <h2 className="text-base font-extrabold text-theme-text tracking-tight">
                Collected & Delivered Batches for Processing
              </h2>
              <p className="text-xs text-theme-secondary mt-0.5">
                Verify customer & collector photo proofs, inspect digital scale weights, and certify recycling yield.
              </p>
            </div>

            <span className="text-xs font-mono font-bold text-theme-primary bg-theme-soft-mint px-3 py-1 rounded-full border border-theme-border">
              {relevantRecyclingJobs.length} Active Batches
            </span>
          </div>

          <div className="divide-y divide-theme-border/60">
            {relevantRecyclingJobs.map((job) => {
              const custPhoto = job.customer_photo_url || job.images?.find((i) => i.image_type === 'customer_upload')?.image_url;
              const scalePhoto = job.scale_photo_url || job.images?.find((i) => i.image_type === 'scale_display' || i.image_type === 'collector_proof')?.image_url;
              const recyPhoto = job.recycler_photo_url || job.images?.find((i) => i.image_type === 'recycler_proof')?.image_url;
              const isCompleted = job.status === 'completed';
              const isProcessing = job.status === 'processing';

              return (
                <div key={job.id} className="p-6 hover:bg-theme-soft-mint/20 transition flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  
                  {/* Left: Job Meta & Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-extrabold text-sm text-theme-text">
                        {job.tracking_number || `#${job.id.slice(0, 8)}`}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-theme-soft-mint text-theme-primary text-xs font-bold border border-theme-border">
                        {job.material_code.replace(/_/g, ' ')}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase border ${
                        isCompleted
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : isProcessing
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                          : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
                      }`}>
                        {job.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-theme-secondary flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{job.street_address}, {job.city}</span>
                      <span className="text-theme-border">•</span>
                      <span>Collector: <strong>{job.collector_name || 'Tariq Mehmood'}</strong></span>
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1">
                      <span className="text-theme-secondary">
                        Customer Est: <strong className="text-theme-text">{job.estimated_quantity_kg} kg</strong>
                      </span>
                      <span className="text-theme-text">
                        Scale Certified: <strong className="text-theme-primary bg-theme-soft-mint px-2 py-0.5 rounded border border-theme-border">
                          {job.verified_weight_kg || job.estimated_quantity_kg} kg
                        </strong>
                      </span>
                      {job.recycled_weight_kg && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          Recycled Output: {job.recycled_weight_kg} kg
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle: Photos Side-by-Side */}
                  <div className="flex items-center gap-3">
                    {custPhoto && (
                      <div className="text-center space-y-1">
                        <img
                          src={custPhoto}
                          alt="Customer waste"
                          className="w-16 h-16 rounded-xl object-cover border border-theme-border cursor-pointer hover:opacity-85 shadow-xs transition"
                          onClick={() => setSelectedEnlargedImage(custPhoto)}
                          title="Click to view Customer Photo"
                        />
                        <span className="text-[10px] text-theme-secondary block font-bold">Customer</span>
                      </div>
                    )}

                    {scalePhoto && (
                      <div className="text-center space-y-1">
                        <img
                          src={scalePhoto}
                          alt="Collector scale"
                          className="w-16 h-16 rounded-xl object-cover border border-theme-border cursor-pointer hover:opacity-85 shadow-xs transition"
                          onClick={() => setSelectedEnlargedImage(scalePhoto)}
                          title="Click to view Collector Scale Photo"
                        />
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold">Scale Proof</span>
                      </div>
                    )}

                    {recyPhoto && (
                      <div className="text-center space-y-1">
                        <img
                          src={recyPhoto}
                          alt="Recycler output"
                          className="w-16 h-16 rounded-xl object-cover border border-theme-border cursor-pointer hover:opacity-85 shadow-xs transition"
                          onClick={() => setSelectedEnlargedImage(recyPhoto)}
                          title="Click to view Recycler Certified Proof"
                        />
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 block font-bold">Plant Proof</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="shrink-0 flex items-center gap-2">
                    {job.status === 'picked_up' || job.status === 'delivered_to_recycler' ? (
                      <button
                        type="button"
                        onClick={() => handleStartProcessing(job.id)}
                        className="bg-[#0B3A3B] hover:bg-[#124B4C] text-white border border-[#2FA37A]/50 font-extrabold px-5 py-2.5 rounded-xl text-xs transition shadow-sm active:scale-98 flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Start Processing</span>
                      </button>
                    ) : isProcessing ? (
                      <button
                        type="button"
                        onClick={() => handleOpenCompleteModal(job)}
                        className="bg-theme-primary hover:bg-[#146B4D] text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition shadow-md shadow-theme-primary/20 active:scale-98 flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Complete & Certify</span>
                      </button>
                    ) : (
                      <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                        <BadgeCheck className="w-4 h-4 text-emerald-500" />
                        <span>Certified Circular</span>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= 3. DEDICATED CHARTS SECTION ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Dedicated Horizontal Stock Chart (7 cols) */}
        <div className="lg:col-span-7">
          <HorizontalBarChart
            title={t('recycler.stock_title', 'Certified Stock by Material')}
            subtitle="Current warehouse inventory ready for immediate industrial procurement"
            items={STOCK_DISTRIBUTION_DATA}
            unit="kg"
            totalLabel="Available Volume"
            totalValue="2,480 kg"
          />
        </div>

        {/* Dedicated Quality Donut Chart (5 cols) */}
        <div className="lg:col-span-5">
          <DonutPercentageChart
            title={t('recycler.quality_title', 'Stock Quality Breakdown')}
            subtitle="Automated sensor and visual inspection purity grade distribution"
            segments={QUALITY_DONUT_DATA}
            centerLabel="Total Lot"
            centerValue="2,480 kg"
          />
        </div>

      </div>

      {/* ================= 4. VERIFIED MATERIAL MARKETPLACE & FILTERS ================= */}
      <div className="bg-theme-surface rounded-3xl border border-theme-border shadow-xs overflow-hidden transition-colors">
        
        <div className="p-6 border-b border-theme-border/60 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-extrabold text-theme-text tracking-tight flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-theme-primary" />
                <span>Verified Recyclable Material Batches</span>
              </h2>
              <p className="text-xs text-theme-secondary mt-0.5">
                Every batch certified with digital scale readings & tamper-evident QR provenance
              </p>
            </div>
            
            <span className="text-xs font-mono font-bold text-theme-primary bg-theme-soft-mint px-3 py-1 rounded-full border border-theme-border">
              {filteredBatches.length} Verified Batches Available
            </span>
          </div>

          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
            
            {/* Search Input */}
            <div className="sm:col-span-6 relative">
              <input
                type="text"
                placeholder="Search by material, lot ID, or hub location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-theme-bg border border-theme-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-theme-text focus:outline-none focus:border-theme-primary focus:bg-theme-surface"
              />
              <Search className="w-4 h-4 text-theme-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Material Filter */}
            <div className="sm:col-span-3">
              <select
                value={filterMaterial}
                onChange={(e) => setFilterMaterial(e.target.value)}
                className="w-full bg-theme-bg border border-theme-border rounded-xl px-3 py-2.5 text-xs text-theme-text font-bold focus:outline-none focus:border-theme-primary"
              >
                <option value="ALL">All Material Streams</option>
                <option value="PET_PLASTIC">PET Plastic</option>
                <option value="CARDBOARD_OCC">Cardboard</option>
                <option value="MIXED_METAL">Mixed Metal</option>
                <option value="GLASS_BOTTLES">Glass</option>
              </select>
            </div>

            {/* Location Filter */}
            <div className="sm:col-span-3">
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="w-full bg-theme-bg border border-theme-border rounded-xl px-3 py-2.5 text-xs text-theme-text font-bold focus:outline-none focus:border-theme-primary"
              >
                <option value="ALL">All Hub Locations</option>
                <option value="Karachi">Karachi Hubs</option>
                <option value="Lahore">Lahore Hubs</option>
                <option value="Rawalpindi">Rawalpindi Hubs</option>
              </select>
            </div>

          </div>
        </div>

        {/* Material Batch Cards / Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-theme-soft-mint/40 text-theme-secondary border-b border-theme-border uppercase tracking-wider font-bold text-[10px]">
              <tr>
                <th className="px-6 py-4">Batch Lot ID</th>
                <th className="px-6 py-4">Material Stream</th>
                <th className="px-6 py-4">Quality Grade</th>
                <th className="px-6 py-4">Certified Weight</th>
                <th className="px-6 py-4">Hub Location</th>
                <th className="px-6 py-4">Pricing Rate</th>
                <th className="px-6 py-4">Traceability</th>
                <th className="px-6 py-4 text-right">Procurement Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border/60">
              {filteredBatches.map((batch) => (
                <tr key={batch.id} className="hover:bg-theme-soft-mint/30 transition">
                  <td className="px-6 py-4 font-mono font-bold text-theme-text">
                    {batch.id}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-theme-text block">{batch.material}</span>
                    <span className="text-[11px] text-theme-secondary">{batch.hub}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-theme-soft-mint text-theme-primary border border-theme-border">
                      {batch.quality}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-extrabold text-theme-text text-sm">
                    {batch.weightKg.toLocaleString()} kg
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center space-x-1 text-theme-text font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-theme-secondary" />
                      <span>{batch.location}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-theme-text">
                    {typeof batch.ratePerKg === 'number' ? `Rs ${batch.ratePerKg}/kg` : batch.ratePerKg}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedTraceabilityBatch(batch)}
                      className="text-theme-primary hover:underline font-bold flex items-center space-x-1 text-xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-theme-primary" />
                      <span>Trace Log</span>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {batch.pickupId ? (
                      <button
                        onClick={() => {
                          const matching = relevantRecyclingJobs.find((p) => p.id === batch.pickupId);
                          if (matching) handleOpenCompleteModal(matching);
                        }}
                        className="bg-theme-primary hover:bg-[#146B4D] text-white font-extrabold px-4 py-2 rounded-xl text-xs transition shadow-sm shadow-theme-primary/20 active:scale-98"
                      >
                        Process Batch
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedBatchForOrder(batch)}
                        className="bg-theme-primary hover:bg-[#146B4D] text-white font-extrabold px-4 py-2 rounded-xl text-xs transition shadow-sm shadow-theme-primary/20 active:scale-98"
                      >
                        {t('recycler.request_batch', 'Request Batch')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* ================= MODAL: COMPLETE RECYCLING & CERTIFY ================= */}
      {processingJob && (
        <div className="fixed inset-0 z-50 bg-[#072021]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-theme-surface border border-theme-border rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-theme-border">
              <div>
                <h3 className="text-base font-extrabold text-theme-text flex items-center gap-2">
                  <Factory className="w-5 h-5 text-theme-primary" />
                  <span>Certify Recycled Batch</span>
                </h3>
                <p className="text-xs text-theme-secondary mt-0.5">
                  Batch #{processingJob.tracking_number || processingJob.id} • {processingJob.material_code.replace(/_/g, ' ')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProcessingJob(null)}
                className="p-1 rounded-lg hover:bg-theme-bg text-theme-secondary hover:text-theme-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {processingError && (
              <div className="p-3 bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{processingError}</span>
              </div>
            )}

            <form onSubmit={handleFinalizeRecycling} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-theme-secondary mb-1">
                  1. Certified Output Recycled Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={recycledWeightInput}
                  onChange={(e) => setRecycledWeightInput(e.target.value)}
                  placeholder="e.g. 50.2"
                  className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-xs font-mono font-bold text-theme-text focus:outline-none focus:border-theme-primary"
                />
                <p className="text-[11px] text-theme-secondary mt-1">
                  Input collected scale weight was: {processingJob.verified_weight_kg || processingJob.estimated_quantity_kg} kg
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-theme-secondary mb-1">
                  2. Processing / Quality Notes
                </label>
                <textarea
                  rows={2}
                  value={processingNotesInput}
                  onChange={(e) => setProcessingNotesInput(e.target.value)}
                  className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-theme-secondary mb-1">
                  3. Plant Processing Proof Photo (Optional)
                </label>
                <input
                  ref={proofFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleProofFileChange}
                />

                {proofPreviewUrl ? (
                  <div className="flex items-center gap-3 p-3 bg-theme-bg rounded-xl border border-theme-border">
                    <img src={proofPreviewUrl} alt="Proof preview" className="w-14 h-14 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-theme-text truncate">{proofFile?.name}</p>
                      <p className="text-[10px] text-theme-secondary">Attached for certification</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setProofFile(null);
                        setProofPreviewUrl(null);
                      }}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => proofFileInputRef.current?.click()}
                    className="border-2 border-dashed border-theme-border hover:border-theme-primary/50 bg-theme-bg rounded-xl p-4 text-center cursor-pointer transition"
                  >
                    <Camera className="w-6 h-6 text-theme-primary mx-auto mb-1" />
                    <p className="text-xs font-bold text-theme-text">Upload facility processing evidence</p>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setProcessingJob(null)}
                  className="flex-1 py-3 rounded-xl border border-theme-border text-xs font-bold text-theme-secondary hover:bg-theme-bg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProcessing}
                  className="flex-1 bg-theme-primary hover:bg-[#146B4D] text-white font-extrabold py-3 rounded-xl text-xs transition shadow-md shadow-theme-primary/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmittingProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Certifying...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Complete & Issue Certificate</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: TRACEABILITY LOG ================= */}
      {selectedTraceabilityBatch && (
        <div className="fixed inset-0 z-50 bg-[#072021]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-theme-surface border border-theme-border rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-theme-border">
              <div>
                <h3 className="text-sm font-extrabold text-theme-text flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-theme-primary" />
                  <span>Provenance & Traceability Ledger</span>
                </h3>
                <p className="text-xs font-mono text-theme-secondary">{selectedTraceabilityBatch.calibrationId}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTraceabilityBatch(null)}
                className="p-1 rounded-lg hover:bg-theme-bg text-theme-secondary hover:text-theme-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-theme-bg rounded-xl border border-theme-border space-y-1">
                <span className="text-[10px] text-theme-secondary uppercase font-bold block">Material Stream</span>
                <p className="font-bold text-theme-text">{selectedTraceabilityBatch.material} ({selectedTraceabilityBatch.weightKg} kg)</p>
                <p className="text-theme-secondary">{selectedTraceabilityBatch.hub}, {selectedTraceabilityBatch.location}</p>
              </div>

              <div className="space-y-2 border-l-2 border-theme-primary/40 pl-3">
                <div>
                  <span className="text-[10px] text-theme-primary font-bold block">Stage 1: Collection</span>
                  <p className="text-theme-text">Aggregated from municipal informal waste pickers with certified digital scales.</p>
                </div>
                <div>
                  <span className="text-[10px] text-theme-primary font-bold block">Stage 2: Verification</span>
                  <p className="text-theme-text">Purity grade {selectedTraceabilityBatch.quality} certified with photo evidence.</p>
                </div>
                <div>
                  <span className="text-[10px] text-theme-primary font-bold block">Stage 3: Off-Take Ready</span>
                  <p className="text-theme-text">Assigned to certified recycling facility under SafaiPay ESG traceability standard.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedTraceabilityBatch(null)}
                className="px-5 py-2.5 bg-theme-primary text-white font-extrabold text-xs rounded-xl"
              >
                Close Trace Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ENLARGED PHOTO ================= */}
      {selectedEnlargedImage && (
        <div className="fixed inset-0 z-50 bg-[#072021]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-theme-surface border border-theme-border rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-theme-text">Physical Verification Photo</h3>
              <button
                type="button"
                onClick={() => setSelectedEnlargedImage(null)}
                className="p-1 rounded-lg hover:bg-theme-bg text-theme-secondary hover:text-theme-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-theme-border bg-black/5 dark:bg-black/40">
              <img
                src={selectedEnlargedImage}
                alt="Enlarged verification"
                className="w-full max-h-[70vh] object-contain mx-auto"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEnlargedImage(null)}
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
