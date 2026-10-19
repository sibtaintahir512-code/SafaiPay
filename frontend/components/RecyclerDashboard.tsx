'use client';

import React, { useState } from 'react';
import { PickupRequest, MaterialRate } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';
import { HorizontalBarChart, HorizontalBarItem } from '@/components/charts/HorizontalBarChart';
import { DonutPercentageChart, DonutSegment } from '@/components/charts/DonutPercentageChart';
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
  Clock
} from 'lucide-react';

interface RecyclerDashboardProps {
  pickups: PickupRequest[];
  materialRates: MaterialRate[];
  onRefresh: () => void;
}

interface MaterialBatch {
  id: string;
  material: string;
  materialCode: string;
  quality: string;
  weightKg: number;
  location: string;
  ratePerKg: number | string;
  totalEstimate: number;
  status: 'Ready for Dispatch' | 'In Transit' | 'Procured';
  hub: string;
  calibrationId: string;
}

// Required batches:
// PET Plastic, Grade A, 680 kg, Karachi, Rs 80/kg
// Cardboard, Dry Sorted, 1,200 kg, Lahore, Rs 35/kg
// Mixed Metal, Verified, 600 kg, Rawalpindi, market rate (Rs 120/kg)
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

// Dedicated Horizontal Stock Chart Data
// Required: PET 680 kg, Cardboard 1,200 kg, Metal 600 kg
const STOCK_DISTRIBUTION_DATA: HorizontalBarItem[] = [
  { label: 'Cardboard', value: 1200, secondaryText: 'Dry Sorted Grade', color: 'from-[#0F3D3E] to-[#12383A]' },
  { label: 'PET Plastic', value: 680, secondaryText: 'Grade A Flakes/Bales', color: 'from-[#1B7F5C] to-[#146B4D]' },
  { label: 'Metal', value: 600, secondaryText: 'Scrap Aluminum & Can Bales', color: 'from-[#F2A900] to-[#D99000]' },
];

// Dedicated Quality Donut Chart Data
// Required: Grade A 55%, Dry Sorted 30%, Other 15%
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

  const filteredBatches = SAMPLE_BATCHES.filter((b) => {
    const matchesSearch = b.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMaterial = filterMaterial === 'ALL' || b.materialCode === filterMaterial;
    const matchesLocation = filterLocation === 'ALL' || b.location === filterLocation;
    return matchesSearch && matchesMaterial && matchesLocation;
  });

  const handleRequestBatch = (batch: MaterialBatch) => {
    setSelectedBatchForOrder(batch);
  };

  const handleConfirmBatchOrder = () => {
    if (!selectedBatchForOrder) return;
    setOrderConfirmationNotice(
      `Purchase Order #${selectedBatchForOrder.id} confirmed! SafaiPay Logistics dispatch assigned to ${selectedBatchForOrder.hub}.`
    );
    setSelectedBatchForOrder(null);
  };

  return (
    <div className="space-y-8 pb-12 font-sans">
      
      {/* ================= 1. RECYCLER HEADER BANNER ================= */}
      <div className="bg-[#0F3D3E] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-[#0F3D3E]/20 border border-[#1F4A4B] relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#1B7F5C]/30 backdrop-blur-md border border-[#2FA37A]/30 text-xs font-semibold text-[#9FE6C6]">
              <ShieldCheck className="w-4 h-4 text-[#2FA37A]" />
              <span>Certified B2B Off-Taker Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {t('recycler.market_title', 'Verified Material Marketplace')}
            </h1>
            <p className="text-[#9DB8AE] text-sm max-w-2xl leading-relaxed">
              {t('recycler.market_sub', 'Procure pre-sorted, digitally weighed post-consumer recyclables directly from municipal informal waste supply chains with complete provenance.')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#0B2F30]/70 border border-[#1F4A4B] rounded-2xl p-4 text-center">
              <span className="text-[10px] text-[#9FE6C6] uppercase font-bold block">Certified Stock Ready</span>
              <span className="text-2xl font-extrabold font-mono text-[#6EE7B7]">2,480 kg</span>
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

      {/* ================= 2. DEDICATED CHARTS SECTION ================= */}
      {/* Strict Layout Rule: Dedicated card for stock distribution horizontal chart, dedicated card for quality donut chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Dedicated Horizontal Stock Chart (7 cols) */}
        {/* Required: PET 680 kg, Cardboard 1,200 kg, Metal 600 kg */}
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
        {/* Required: Grade A 55%, Dry Sorted 30%, Other 15% */}
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

      {/* ================= 3. VERIFIED MATERIAL MARKETPLACE & FILTERS ================= */}
      {/* Required: Search & filters for material, quality, location, price, weight */}
      <div className="bg-white rounded-3xl border border-[#D5E6DD] shadow-xs overflow-hidden">
        
        <div className="p-6 border-b border-[#D5E6DD]/60 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-extrabold text-[#0F3D3E] tracking-tight flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1B7F5C]" />
                <span>Verified Recyclable Material Batches</span>
              </h2>
              <p className="text-xs text-[#5B6B66] mt-0.5">
                Every batch certified with digital scale readings & tamper-evident QR provenance
              </p>
            </div>
            
            <span className="text-xs font-mono font-bold text-[#146B4D] bg-[#E6F4EC] px-3 py-1 rounded-full border border-[#D5E6DD]">
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
                className="w-full bg-[#F4FAF7] border border-[#D5E6DD] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#0F3D3E] focus:outline-none focus:border-[#1B7F5C] focus:bg-white"
              />
              <Search className="w-4 h-4 text-[#5B6B66] absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Material Filter */}
            <div className="sm:col-span-3">
              <select
                value={filterMaterial}
                onChange={(e) => setFilterMaterial(e.target.value)}
                className="w-full bg-[#F4FAF7] border border-[#D5E6DD] rounded-xl px-3 py-2.5 text-xs text-[#0F3D3E] font-bold focus:outline-none focus:border-[#1B7F5C]"
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
                className="w-full bg-[#F4FAF7] border border-[#D5E6DD] rounded-xl px-3 py-2.5 text-xs text-[#0F3D3E] font-bold focus:outline-none focus:border-[#1B7F5C]"
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
        {/* Required items explicitly present:
            - PET Plastic, Grade A, 680 kg, Karachi, Rs 80/kg
            - Cardboard, Dry Sorted, 1,200 kg, Lahore, Rs 35/kg
            - Mixed Metal, Verified, 600 kg, Rawalpindi, market rate */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#E6F4EC] text-[#0F3D3E] border-b border-[#D5E6DD] uppercase tracking-wider font-bold text-[10px]">
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
            <tbody className="divide-y divide-[#D5E6DD]/60">
              {filteredBatches.map((batch) => (
                <tr key={batch.id} className="hover:bg-[#E6F4EC]/40 transition">
                  <td className="px-6 py-4 font-mono font-bold text-[#0F3D3E]">
                    {batch.id}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-[#0F3D3E] block">{batch.material}</span>
                    <span className="text-[11px] text-[#5B6B66]">{batch.hub}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E6F4EC] text-[#146B4D] border border-[#D5E6DD]">
                      {batch.quality}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-extrabold text-[#0F3D3E] text-sm">
                    {batch.weightKg.toLocaleString()} kg
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center space-x-1 text-[#0F3D3E] font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-[#5B6B66]" />
                      <span>{batch.location}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-[#0F3D3E]">
                    {typeof batch.ratePerKg === 'number' ? `Rs ${batch.ratePerKg}/kg` : batch.ratePerKg}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedTraceabilityBatch(batch)}
                      className="text-[#1B7F5C] hover:text-[#146B4D] font-bold underline flex items-center space-x-1 text-xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#2FA37A]" />
                      <span>Trace Log</span>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {/* One clear "Request Batch" action */}
                    <button
                      onClick={() => handleRequestBatch(batch)}
                      className="bg-[#1B7F5C] hover:bg-[#146B4D] text-white font-extrabold px-4 py-2 rounded-xl text-xs transition shadow-sm shadow-[#1B7F5C]/20 active:scale-98"
                    >
                      {t('recycler.request_batch', 'Request Batch')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* ================= 4. DISPATCH STATUS & TRACEABILITY ================= */}
      <div className="bg-white rounded-3xl border border-[#D5E6DD] p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#D5E6DD]/60">
          <div>
            <h2 className="text-sm font-extrabold text-[#0F3D3E] tracking-tight flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2FA37A]" />
              <span>{t('recycler.traceability_title', 'Dispatch Status & Digital Supply Chain Traceability')}</span>
            </h2>
            <p className="text-xs text-[#5B6B66] mt-0.5">
              Certified Chain-of-Custody (CoC) guarantees genuine post-consumer municipal waste origin
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E6F4EC] text-[#146B4D] border border-[#D5E6DD]">
            ESG Audit Compliant
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#F4FAF7] rounded-2xl border border-[#D5E6DD] space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#0F3D3E]">
              <Truck className="w-4 h-4 text-[#1B7F5C]" />
              <span>Dedicated Logistics Fleets</span>
            </div>
            <p className="text-xs text-[#5B6B66] leading-snug">
              B2B bulk transport with real-time GPS telemetry and tamper-evident sealed containers.
            </p>
          </div>

          <div className="p-4 bg-[#F4FAF7] rounded-2xl border border-[#D5E6DD] space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#0F3D3E]">
              <Scale className="w-4 h-4 text-[#2FA37A]" />
              <span>Dual Weighbridge Calibration</span>
            </div>
            <p className="text-xs text-[#5B6B66] leading-snug">
              Origin sensor scale readings matched with destination industrial weighbridges within ±0.5%.
            </p>
          </div>

          <div className="p-4 bg-[#F4FAF7] rounded-2xl border border-[#D5E6DD] space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#0F3D3E]">
              <BadgeCheck className="w-4 h-4 text-[#0F3D3E]" />
              <span>Immutable Chain Certificate</span>
            </div>
            <p className="text-xs text-[#5B6B66] leading-snug">
              Verifiable proof of circularity for EPR (Extended Producer Responsibility) regulatory compliance.
            </p>
          </div>
        </div>
      </div>

      {/* ================= ORDER BATCH MODAL ================= */}
      {selectedBatchForOrder && (
        <div className="fixed inset-0 z-50 bg-[#0F3D3E]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#D5E6DD] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#D5E6DD]/60">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[#E6F4EC] text-[#146B4D] flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#0F3D3E] text-sm">B2B Material Order</h3>
                  <p className="text-[10px] font-mono text-[#5B6B66]">Lot: {selectedBatchForOrder.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBatchForOrder(null)}
                className="text-[#5B6B66] hover:text-[#0F3D3E] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 bg-[#F4FAF7] rounded-2xl p-4 text-xs border border-[#D5E6DD]">
              <div className="flex justify-between">
                <span className="text-[#5B6B66]">Material Stream:</span>
                <span className="font-bold text-[#0F3D3E]">{selectedBatchForOrder.material}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5B6B66]">Certified Weight:</span>
                <span className="font-mono font-bold text-[#0F3D3E]">{selectedBatchForOrder.weightKg} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5B6B66]">Quality Standard:</span>
                <span className="font-bold text-[#146B4D]">{selectedBatchForOrder.quality}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5B6B66]">Hub Origin:</span>
                <span className="font-medium text-[#0F3D3E]">{selectedBatchForOrder.hub} ({selectedBatchForOrder.location})</span>
              </div>
              <div className="pt-2 border-t border-[#D5E6DD] flex justify-between text-sm font-extrabold text-[#0F3D3E]">
                <span>Estimated Invoice:</span>
                <span className="font-mono bg-[#E6F4EC] text-[#146B4D] px-2 py-0.5 rounded border border-[#D5E6DD]">Rs {selectedBatchForOrder.totalEstimate.toLocaleString()}</span>
              </div>
            </div>

            <p className="text-[11px] text-[#5B6B66]">
              By confirming, you lock this batch for priority collection and dispatch. SafaiPay logistics team will coordinate gate pass & delivery timeline.
            </p>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBatchForOrder(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#D5E6DD] text-xs font-bold text-[#5B6B66] hover:bg-[#F4FAF7]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchOrder}
                className="flex-1 bg-[#1B7F5C] hover:bg-[#146B4D] text-white font-extrabold py-2.5 rounded-xl text-xs transition shadow-md shadow-[#1B7F5C]/30"
              >
                Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TRACEABILITY PROVENANCE MODAL ================= */}
      {selectedTraceabilityBatch && (
        <div className="fixed inset-0 z-50 bg-[#0F3D3E]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#D5E6DD] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#D5E6DD]/60">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-[#2FA37A]" />
                <h3 className="font-extrabold text-[#0F3D3E] text-sm">Chain-of-Custody Provenance</h3>
              </div>
              <button
                onClick={() => setSelectedTraceabilityBatch(null)}
                className="text-[#5B6B66] hover:text-[#0F3D3E] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-[#5B6B66]">
              <p><strong>Batch ID:</strong> <span className="text-[#0F3D3E]">{selectedTraceabilityBatch.id}</span></p>
              <p><strong>Origin Scale Certificate:</strong> <span className="text-[#0F3D3E]">{selectedTraceabilityBatch.calibrationId}</span></p>
              <p><strong>Aggregation Hub:</strong> <span className="text-[#0F3D3E]">{selectedTraceabilityBatch.hub}</span></p>
              <p><strong>Verification Standard:</strong> Digital hanging sensor calibration audited Oct 2026</p>
              <div className="p-3 bg-[#E6F4EC] text-[#146B4D] rounded-xl text-[11px] font-medium border border-[#D5E6DD]">
                ✓ 100% verified informal waste collector doorstep diversion. No landfill contamination.
              </div>
            </div>

            <button
              onClick={() => setSelectedTraceabilityBatch(null)}
              className="w-full bg-[#0F3D3E] hover:bg-[#0B2F30] text-white font-bold py-2.5 rounded-xl text-xs transition"
            >
              Close Record
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
