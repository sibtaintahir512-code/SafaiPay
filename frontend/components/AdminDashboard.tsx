'use client';

import React, { useState, useEffect } from 'react';
import { PickupRequest, MaterialRate } from '@/lib/types';
import { 
  assignCollector, 
  simulatePayment, 
  retryPayment, 
  updateMaterialRate, 
  getSuspiciousRecords, 
  getDisputes, 
  getAllUsers,
  getLowConfidencePredictions,
  verifyAIPrediction,
  getInventoryItems,
  AIPredictionItem,
  InventoryItem
} from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { VerticalBarChart, BarDataPoint } from '@/components/charts/VerticalBarChart';
import { DonutPercentageChart, DonutSegment } from '@/components/charts/DonutPercentageChart';
import { 
  Shield, 
  Users, 
  AlertTriangle, 
  DollarSign, 
  CheckCircle2, 
  TrendingUp, 
  Scale, 
  FileText, 
  RefreshCw,
  Zap,
  RotateCcw,
  Search,
  Filter,
  UserCheck,
  Truck,
  Layers,
  ArrowRight,
  ShieldAlert,
  Sliders,
  Check,
  Clock,
  Eye,
  AlertOctagon,
  Lock,
  Download
} from 'lucide-react';

interface AdminDashboardProps {
  pickups: PickupRequest[];
  materialRates: MaterialRate[];
  onRefresh: () => void;
}

// Exact monthly recycled volume bar chart data required:
// January 420 kg, February 610 kg, March 780 kg, April 690 kg, May 920 kg, June 1,120 kg
const MONTHLY_VOLUME_DATA: BarDataPoint[] = [
  { label: 'Jan', value: 420 },
  { label: 'Feb', value: 610 },
  { label: 'Mar', value: 780 },
  { label: 'Apr', value: 690 },
  { label: 'May', value: 920 },
  { label: 'Jun', value: 1120, highlight: true },
];

// Exact pickup status donut chart data required:
// Verified 40%, Paid 25%, On the way 20%, Audit 15%
const STATUS_DONUT_DATA: DonutSegment[] = [
  { label: 'Verified', percentage: 40, value: '171 Pickups', color: '#1B7F5C', textColor: '#146B4D' },
  { label: 'Paid', percentage: 25, value: '107 Pickups', color: '#2FA37A', textColor: '#1B7F5C' },
  { label: 'On the way', percentage: 20, value: '86 Pickups', color: '#0F3D3E', textColor: '#0B2F30' },
  { label: 'Audit Required', percentage: 15, value: '64 Pickups', color: '#F2A900', textColor: '#0F3D3E' },
];

// Sample Audit Logs
const AUDIT_LOG_RECORDS = [
  { id: 'LOG-8812', timestamp: '10 mins ago', user: 'Admin (System)', action: 'Dispatched collector #C-104 to DHA Phase 2', ip: '192.168.1.1' },
  { id: 'LOG-8811', timestamp: '34 mins ago', user: 'Collector (Tariq M.)', action: 'Certified digital scale reading 14.8 kg logged', ip: '10.0.4.12' },
  { id: 'LOG-8810', timestamp: '1 hour ago', user: 'Admin (System)', action: 'Benchmark scrap rate updated for PET_PLASTIC to Rs 80/kg', ip: '192.168.1.1' },
  { id: 'LOG-8809', timestamp: '2 hours ago', user: 'Customer (Farhan S.)', action: 'Accepted verified scale reading and confirmed payout', ip: '172.16.0.8' },
  { id: 'LOG-8808', timestamp: '4 hours ago', user: 'Risk Engine', action: 'Flagged weight discrepancy dispute #SP-DISP-09', ip: '10.0.0.1' },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  pickups,
  materialRates,
  onRefresh,
}) => {
  const { t, isUrdu } = useLanguage();

  const [collectors, setCollectors] = useState<any[]>([]);
  const [suspicious, setSuspicious] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  
  // Required Tabs: Operations, Dispatch, Pricing, Payments, Fraud Alerts, Reports, AI Governance
  const [activeTab, setActiveTab] = useState<
    'operations' | 'dispatch' | 'pricing' | 'payments' | 'fraud_alerts' | 'reports' | 'ai_governance'
  >('operations');

  // Phase 4: AI Governance & Review states
  const [lowConfidencePredictions, setLowConfidencePredictions] = useState<AIPredictionItem[]>([]);
  const [warehouseInventory, setWarehouseInventory] = useState<InventoryItem[]>([]);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifiedMaterialChoice, setVerifiedMaterialChoice] = useState<string>('PET plastic');
  const [verificationNote, setVerificationNote] = useState<string>('Supervisor verified high-density plastic');

  // Confirmation dialog state for dangerous actions
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    isDangerous?: boolean;
    onConfirm: () => Promise<void>;
  } | null>(null);

  // Rate Update state
  const [targetMaterial, setTargetMaterial] = useState<string>('PET_PLASTIC');
  const [newRate, setNewRate] = useState<number>(80);
  const [rateNote, setRateNote] = useState('Market adjustment based on scrap export prices');
  const [isUpdatingRate, setIsUpdatingRate] = useState(false);
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  // Operations filter & search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    getAllUsers('collector').then(setCollectors).catch(() => {});
    getSuspiciousRecords().then(setSuspicious).catch(() => {});
    getDisputes().then(setDisputes).catch(() => {});
    getLowConfidencePredictions().then(setLowConfidencePredictions).catch(() => {});
    getInventoryItems().then(setWarehouseInventory).catch(() => {});
  }, []);

  const handleVerifyPrediction = async (id: string) => {
    try {
      await verifyAIPrediction(id, verifiedMaterialChoice, verificationNote);
      setActionAlert(`Prediction #${id} successfully verified as ${verifiedMaterialChoice}`);
      setVerifyingId(null);
      getLowConfidencePredictions().then(setLowConfidencePredictions).catch(() => {});
    } catch (err: any) {
      setActionAlert(err.message || 'Verification failed');
    }
  };

  const handleExecuteRateUpdate = async () => {
    setConfirmDialog({
      isOpen: true,
      title: `Update Benchmark Scrap Rate for ${targetMaterial}?`,
      description: `This will update the real-time index rate to Rs ${newRate}/kg across all newly scheduled pickups across Pakistan. This action is permanently logged to the audit trail.`,
      confirmText: 'Yes, Apply New Rate',
      isDangerous: true,
      onConfirm: async () => {
        setIsUpdatingRate(true);
        try {
          await updateMaterialRate(targetMaterial, Number(newRate), rateNote);
          setActionAlert(`Successfully updated benchmark rate for ${targetMaterial} to Rs ${newRate}/kg!`);
          onRefresh();
        } catch (err: any) {
          alert(`Error updating rate: ${err.message}`);
        } finally {
          setIsUpdatingRate(false);
          setConfirmDialog(null);
        }
      },
    });
  };

  const handleAssignCollectorAction = async (pickupId: string, collectorId: string) => {
    try {
      await assignCollector(pickupId, collectorId);
      setActionAlert(`Collector assigned to pickup #${pickupId.slice(0, 8)}.`);
      onRefresh();
    } catch (err: any) {
      alert(`Assignment Error: ${err.message}`);
    }
  };

  const handleSimulatePayment = async (pickupId: string, fail = false) => {
    try {
      await simulatePayment(pickupId, fail);
      setActionAlert(fail ? 'Payment simulation marked as FAILED.' : 'Payment settlement marked as COMPLETED.');
      onRefresh();
    } catch (err: any) {
      alert(`Payment Error: ${err.message}`);
    }
  };

  const filteredPickups = pickups.filter((p) => {
    const matchesSearch = p.street_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.material_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 pb-12 font-sans">
      
      {/* ================= 1. FRAUD ALERT BANNER ================= */}
      {/* Required: Clearly show “2 alerts require review” */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md">
                Fraud Engine Alert
              </span>
              <span className="text-xs text-amber-700 font-semibold">• High Priority</span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-amber-950 mt-0.5">
              2 alerts require review
            </h2>
            <p className="text-xs text-amber-800 leading-snug">
              Unusual scale weight variance (+14.2 kg over historical household average) detected in Clifton Hub #4.
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('fraud_alerts')}
          className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition shadow-md shadow-amber-600/30 shrink-0"
        >
          Review 2 Alerts Now
        </button>
      </div>

      {/* Action Notification Alert */}
      {actionAlert && (
        <div className="p-4 bg-[#E6F4EC] border border-[#D5E6DD] text-[#0F3D3E] rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#1B7F5C] shrink-0" />
            <span>{actionAlert}</span>
          </div>
          <button onClick={() => setActionAlert(null)} className="text-[#1B7F5C] font-bold ml-4 hover:text-[#146B4D]">
            ✕
          </button>
        </div>
      )}

      {/* ================= 2. TOP KPI METRICS CARDS ================= */}
      {/* Required: 428 total pickups, 8,420 kg material recycled, Rs 312,000 collector earnings, 2 fraud alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Metric 1: 428 total pickups */}
        <div className="bg-white rounded-2xl border border-[#D5E6DD] p-5 shadow-xs hover:shadow-sm transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#5B6B66]">
              {t('admin.total_pickups', 'Total Pickups')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#E6F4EC] text-[#146B4D] flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-[#0F3D3E] tracking-tight">
            428
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] text-[#146B4D] font-bold mt-2">
            <span>+14.8% this month</span>
            <span className="text-[#5B6B66] font-normal">• 98.2% completion</span>
          </div>
        </div>

        {/* Metric 2: 8,420 kg material recycled */}
        <div className="bg-white rounded-2xl border border-[#D5E6DD] p-5 shadow-xs hover:shadow-sm transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#5B6B66]">
              {t('admin.total_recycled', 'Material Recycled')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#E6F4EC] text-[#146B4D] flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-[#1B7F5C] tracking-tight">
            8,420 kg
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] text-[#146B4D] font-bold mt-2">
            <span>100% verified scale readings</span>
          </div>
        </div>

        {/* Metric 3: Rs 312,000 collector earnings */}
        <div className="bg-white rounded-2xl border border-[#D5E6DD] p-5 shadow-xs hover:shadow-sm transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#5B6B66]">
              {t('admin.collector_earnings', 'Collector Earnings')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#E6F4EC] text-[#146B4D] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-[#0F3D3E] tracking-tight">
            Rs 312,000
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] text-[#146B4D] font-bold mt-2">
            <span>Disbursed via digital wallet</span>
          </div>
        </div>

        {/* Metric 4: 2 fraud alerts */}
        <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-xs hover:shadow-sm transition bg-amber-50/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
              {t('admin.fraud_alerts', 'Fraud Alerts')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-amber-800 tracking-tight">
            2
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] text-amber-800 font-bold mt-2">
            <span>Requires administrative audit</span>
          </div>
        </div>

      </div>

      {/* ================= 3. DEDICATED CHARTS SECTION ================= */}
      {/* Strict Layout Rule: Dedicated card for monthly volume bar chart, dedicated card for pickup status donut chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Dedicated Monthly Recycled Volume Bar Chart (7 cols) */}
        {/* Required: Jan 420 kg, Feb 610 kg, Mar 780 kg, Apr 690 kg, May 920 kg, Jun 1,120 kg */}
        <div className="lg:col-span-7">
          <VerticalBarChart
            title={t('admin.monthly_volume', 'Monthly Recycled Volume')}
            subtitle="Historical volume trajectory across all municipal zones (kg)"
            data={MONTHLY_VOLUME_DATA}
            unit="kg"
            totalLabel="Cumulative Total"
            totalValue="4,540 kg"
          />
        </div>

        {/* Dedicated Pickup Status Donut Chart (5 cols) */}
        {/* Required: Verified 40%, Paid 25%, On the way 20%, Audit 15% */}
        <div className="lg:col-span-5">
          <DonutPercentageChart
            title={t('admin.status_breakdown', 'Pickup Lifecycle Distribution')}
            subtitle="Real-time operational status across all active dispatches"
            segments={STATUS_DONUT_DATA}
            centerLabel="Active Total"
            centerValue="428 Total"
          />
        </div>

      </div>

      {/* ================= 4. NAVIGATION TABS ================= */}
      {/* Required Tabs: Operations, Dispatch, Pricing, Payments, Fraud Alerts, Reports */}
      <div className="bg-white rounded-3xl border border-[#D5E6DD] shadow-xs overflow-hidden">
        
        <div className="border-b border-[#D5E6DD]/60 px-6 pt-4">
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto pb-4 scrollbar-none">
            {[
              { id: 'operations', label: 'Operations' },
              { id: 'dispatch', label: 'Dispatch & Fleet' },
              { id: 'pricing', label: 'Pricing Indices' },
              { id: 'payments', label: 'Payments' },
              { id: 'fraud_alerts', label: 'Fraud Alerts (2)' },
              { id: 'reports', label: 'Reports & Audit' },
              { id: 'ai_governance', label: `AI Review Queue (${lowConfidencePredictions.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#1B7F5C] text-white shadow-xs font-extrabold'
                    : 'text-[#5B6B66] hover:bg-[#E6F4EC] hover:text-[#0F3D3E]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: OPERATIONS (Readable Pickup Operations Table) */}
        {activeTab === 'operations' && (
          <div>
            <div className="p-6 border-b border-[#D5E6DD]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-[#0F3D3E]">
                  Pickup Operations Ledger
                </h3>
                <p className="text-xs text-[#5B6B66] mt-0.5">
                  Complete real-time log of customer bookings, scale verifications, and collector dispatches
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="Filter by ID or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#F4FAF7] border border-[#D5E6DD] rounded-xl px-3 py-1.5 text-xs text-[#0F3D3E] focus:outline-none focus:border-[#1B7F5C]"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#F4FAF7] border border-[#D5E6DD] rounded-xl px-3 py-1.5 text-xs text-[#0F3D3E] font-bold focus:outline-none focus:border-[#1B7F5C]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="requested">Requested</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="weight_verified">Weight Verified</option>
                  <option value="payment_completed">Payment Completed</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#E6F4EC] text-[#0F3D3E] border-b border-[#D5E6DD] uppercase tracking-wider font-bold text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5">ID</th>
                    <th className="px-6 py-3.5">Material</th>
                    <th className="px-6 py-3.5">Customer & Address</th>
                    <th className="px-6 py-3.5">Weight (Verified)</th>
                    <th className="px-6 py-3.5">Settlement (PKR)</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D5E6DD]/60">
                  {filteredPickups.map((p) => {
                    const calc = p.pricing_calculations?.[0];
                    const weight = calc ? calc.verified_weight_kg : p.estimated_quantity_kg;
                    const price = calc ? calc.total_price : p.estimated_quantity_kg * 80;

                    return (
                      <tr key={p.id} className="hover:bg-[#E6F4EC]/40 transition">
                        <td className="px-6 py-4 font-mono font-bold text-[#0F3D3E]">
                          #{p.id.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4 font-bold text-[#0F3D3E]">
                          {p.material_code}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[#0F3D3E] font-semibold block">{p.street_address}</span>
                          <span className="text-[11px] text-[#5B6B66]">Karachi South Hub</span>
                        </td>
                        <td className="px-6 py-4 font-mono font-extrabold text-[#146B4D]">
                          {weight} kg
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-[#0F3D3E]">
                          <span className="bg-[#E6F4EC] text-[#146B4D] px-2 py-0.5 rounded border border-[#D5E6DD] font-bold">
                            Rs {price.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E6F4EC] text-[#146B4D] border border-[#D5E6DD]">
                            {p.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {p.status === 'requested' && (
                            <button
                              onClick={() => {
                                const collector = collectors[0]?.id || 'col-demo';
                                handleAssignCollectorAction(p.id, collector);
                              }}
                              className="px-3 py-1 bg-[#1B7F5C] hover:bg-[#146B4D] text-white font-bold rounded-lg text-xs"
                            >
                              Assign Collector
                            </button>
                          )}
                          {p.status === 'payment_pending' && (
                            <button
                              onClick={() => handleSimulatePayment(p.id)}
                              className="px-3 py-1 bg-[#2FA37A] hover:bg-[#1B7F5C] text-white font-bold rounded-lg text-xs"
                            >
                              Disburse Payout
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: DISPATCH */}
        {activeTab === 'dispatch' && (
          <div className="p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-[#0F3D3E]">Active Field Collector Fleets</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'Tariq Mehmood', hub: 'Clifton Hub #4', vehicle: 'Motorized Loader #KHI-901', status: 'In Transit', rating: '4.9 ★' },
                { name: 'Rashid Ali', hub: 'DHA Phase 2 Hub', vehicle: 'Eco Rickshaw #KHI-412', status: 'At Doorstep Weighing', rating: '4.8 ★' },
                { name: 'Zahid Khan', hub: 'Gulshan Depot', vehicle: 'Mini Flatbed #KHI-118', status: 'Available for Dispatch', rating: '5.0 ★' },
              ].map((f, i) => (
                <div key={i} className="p-4 bg-[#F4FAF7] rounded-2xl border border-[#D5E6DD] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#0F3D3E] text-xs">{f.name}</span>
                    <span className="text-[10px] font-bold bg-[#E6F4EC] text-[#146B4D] px-2 py-0.5 rounded-full border border-[#D5E6DD]">{f.status}</span>
                  </div>
                  <p className="text-[11px] text-[#5B6B66]">{f.vehicle} • {f.hub}</p>
                  <p className="text-xs font-mono font-bold text-[#146B4D]">Rating: {f.rating}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PRICING (Material Rate Updates with Confirmation Dialog) */}
        {activeTab === 'pricing' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-extrabold text-[#0F3D3E]">Benchmark Scrap Price Management</h3>
              <p className="text-xs text-[#5B6B66] mt-0.5">
                Update market pricing rates. Changes apply to all future automated customer calculations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {materialRates.map((m) => (
                <div key={m.code} className="p-4 bg-[#F4FAF7] rounded-2xl border border-[#D5E6DD] space-y-1">
                  <span className="text-xs font-bold text-[#0F3D3E] block">{m.code}</span>
                  <div className="text-2xl font-extrabold font-mono text-[#0F3D3E]">
                    Rs {m.benchmark_rate_pkr}/kg
                  </div>
                  <span className="text-[10px] text-[#5B6B66]">Effective rate across pilot hub</span>
                </div>
              ))}
            </div>

            {/* Price Edit Box with Confirmation requirement */}
            <div className="p-5 bg-[#F4FAF7] rounded-2xl border border-[#D5E6DD] space-y-4 max-w-xl">
              <h4 className="text-xs font-extrabold text-[#0F3D3E] uppercase tracking-wider">
                Adjust Material Benchmark Rate
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#5B6B66] block mb-1">Target Stream</label>
                  <select
                    value={targetMaterial}
                    onChange={(e) => setTargetMaterial(e.target.value)}
                    className="w-full bg-white border border-[#D5E6DD] rounded-xl px-3 py-2 text-xs font-bold text-[#0F3D3E]"
                  >
                    <option value="PET_PLASTIC">PET Plastic</option>
                    <option value="CARDBOARD_OCC">Cardboard</option>
                    <option value="MIXED_METAL">Mixed Metal</option>
                    <option value="GLASS_BOTTLES">Glass</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#5B6B66] block mb-1">New Rate (PKR/kg)</label>
                  <input
                    type="number"
                    value={newRate}
                    onChange={(e) => setNewRate(Number(e.target.value))}
                    className="w-full bg-white border border-[#D5E6DD] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#0F3D3E]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#5B6B66] block mb-1">Audit Trail Rationale</label>
                <input
                  type="text"
                  value={rateNote}
                  onChange={(e) => setRateNote(e.target.value)}
                  className="w-full bg-white border border-[#D5E6DD] rounded-xl px-3 py-2 text-xs text-[#0F3D3E]"
                />
              </div>

              <button
                type="button"
                onClick={handleExecuteRateUpdate}
                disabled={isUpdatingRate}
                className="bg-[#1B7F5C] hover:bg-[#146B4D] text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition shadow-md shadow-[#1B7F5C]/25 flex items-center space-x-1.5"
              >
                <span>Update Benchmark Rate</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: PAYMENTS */}
        {activeTab === 'payments' && (
          <div className="p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-[#0F3D3E]">Disbursed Digital Settlements</h3>
            <p className="text-xs text-[#5B6B66]">Total disbursements: Rs 312,000 across 428 certified pickups.</p>
            <div className="p-4 bg-[#E6F4EC] rounded-2xl border border-[#D5E6DD] text-xs text-[#0F3D3E] flex justify-between items-center">
              <span>All automated wallet batch settlements successfully reconciled. Zero failed charges.</span>
              <span className="font-bold font-mono text-[#146B4D]">100% SLA</span>
            </div>
          </div>
        )}

        {/* TAB 5: FRAUD ALERTS (2 Alerts Requiring Review) */}
        {activeTab === 'fraud_alerts' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-amber-950">
                  Suspicious Records & Fraud Alerts (2)
                </h3>
                <p className="text-xs text-amber-800">
                  Automated heuristics flag abnormal scale variances and repeat cancellations.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-500 text-white">
                Action Required
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-extrabold text-amber-900">Alert #FR-2026-01: Scale Discrepancy</span>
                    <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded">High Risk</span>
                  </div>
                  <p className="text-xs text-[#5B6B66]">
                    Pickup #SP-8812 recorded 48.5 kg PET Plastic vs customer estimated 10 kg (+385% variance).
                  </p>
                  <span className="text-[10px] text-[#5B6B66] font-mono">Collector ID: #COL-104 • Clifton Hub 4</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      alert('Certified scale photo retrieved. Image exhibits legitimate commercial bundle.');
                    }}
                    className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 font-bold rounded-xl text-xs hover:bg-amber-100"
                  >
                    Inspect Photo
                  </button>
                  <button
                    onClick={() => {
                      setActionAlert('Alert #FR-2026-01 resolved. Weight verified as legitimate bulk bale.');
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-xs"
                  >
                    Clear Alert
                  </button>
                </div>
              </div>

              <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-extrabold text-amber-900">Alert #FR-2026-02: Rapid Rate Arbitrage</span>
                    <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded">Moderate</span>
                  </div>
                  <p className="text-xs text-[#5B6B66]">
                    Multiple micro-pickups scheduled within 20 mins from same IP address.
                  </p>
                  <span className="text-[10px] text-[#5B6B66] font-mono">Location: DHA Phase 2 Commercial St</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setActionAlert('Alert #FR-2026-02 reviewed and marked as trusted vendor test.');
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-xs"
                  >
                    Clear Alert
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: REPORTS & AUDIT LOGS */}
        {activeTab === 'reports' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-[#0F3D3E]">
                  {t('admin.audit_title', 'Operations Audit Log')}
                </h3>
                <p className="text-xs text-[#5B6B66] mt-0.5">
                  Cryptographically verified system events, rate updates, and administrator overrides
                </p>
              </div>
              <button
                onClick={() => alert('Exporting encrypted ESG compliance CSV audit report...')}
                className="px-3.5 py-1.5 bg-[#E6F4EC] text-[#146B4D] font-bold text-xs rounded-xl border border-[#D5E6DD] hover:bg-[#D5E6DD]/60 flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Audit CSV</span>
              </button>
            </div>

            <div className="divide-y divide-[#D5E6DD]/60 text-xs">
              {AUDIT_LOG_RECORDS.map((log) => (
                <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="space-y-0.5">
                    <span className="font-bold text-[#0F3D3E]">{log.action}</span>
                    <p className="text-[11px] text-[#5B6B66]">
                      Operator: <strong className="text-[#0F3D3E]">{log.user}</strong> • IP: {log.ip}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[#146B4D] font-bold text-[11px] block">{log.id}</span>
                    <span className="text-[10px] text-[#5B6B66]">{log.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: AI GOVERNANCE & LOW-CONFIDENCE REVIEW QUEUE */}
        {activeTab === 'ai_governance' && (
          <div className="p-6 space-y-6">
            {/* Model Metadata & Metrics Card */}
            <div className="bg-[#F4FAF7] border border-[#D5E6DD] rounded-2xl p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold bg-[#146B4D] text-white px-2 py-0.5 rounded">
                    Active Model: demo-v1
                  </span>
                  <span className="text-xs font-bold text-[#0F3D3E]">
                    MobileNetV3-Small-FineTuned (Demo Interface)
                  </span>
                </div>
                <span className="text-xs text-[#5B6B66]">
                  Target: Karachi Informal Aggregation Hubs (Korangi, Shershah, SITE)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-[#D5E6DD]">
                  <span className="text-[#5B6B66] text-[11px] block">Baseline Accuracy</span>
                  <strong className="text-[#146B4D] font-mono text-base">91.2%</strong>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#D5E6DD]">
                  <span className="text-[#5B6B66] text-[11px] block">Precision</span>
                  <strong className="text-[#146B4D] font-mono text-base">90.5%</strong>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#D5E6DD]">
                  <span className="text-[#5B6B66] text-[11px] block">Recall</span>
                  <strong className="text-[#146B4D] font-mono text-base">89.8%</strong>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#D5E6DD]">
                  <span className="text-[#5B6B66] text-[11px] block">F1-Score</span>
                  <strong className="text-[#146B4D] font-mono text-base">90.1%</strong>
                </div>
              </div>

              <p className="text-[11px] text-[#5B6B66] leading-relaxed">
                <strong>Safety Fallback Notice:</strong> Pre-screenings with confidence &lt;70% or categorized as &apos;other/unknown&apos; are automatically held in this supervisor queue for human-in-the-loop verification before final digital weighing and customer payout.
              </p>
            </div>

            {/* Low-Confidence Human Verification Queue */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-[#0F3D3E]">
                    Low-Confidence Review Queue ({lowConfidencePredictions.length})
                  </h4>
                  <p className="text-xs text-[#5B6B66]">
                    Inspect flagged predictions and apply human-in-the-loop verification
                  </p>
                </div>
              </div>

              <div className="divide-y divide-[#D5E6DD]/60 border border-[#D5E6DD] rounded-2xl overflow-hidden bg-white">
                {lowConfidencePredictions.map((pred) => (
                  <div key={pred.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#F4FAF7]/50">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-[#146B4D] bg-[#E6F4EC] px-2 py-0.5 rounded">
                          {pred.id}
                        </span>
                        <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                          Confidence: {Math.round(pred.confidence * 100)}% (Low)
                        </span>
                        <span className="text-xs bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded">
                          AI: {pred.material}
                        </span>
                      </div>
                      <p className="text-xs text-[#5B6B66]">
                        Uploaded {new Date(pred.created_at).toLocaleTimeString()} &bull; Version: <strong>{pred.model_version}</strong>
                      </p>
                      {pred.verified_material && (
                        <p className="text-xs text-[#146B4D] font-semibold">
                          Verified As: {pred.verified_material}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {verifyingId === pred.id ? (
                        <div className="flex items-center gap-2 bg-[#E6F4EC] p-2 rounded-xl border border-[#D5E6DD]">
                          <select
                            value={verifiedMaterialChoice}
                            onChange={(e) => setVerifiedMaterialChoice(e.target.value)}
                            className="text-xs font-bold bg-white border border-[#D5E6DD] rounded-lg px-2 py-1"
                          >
                            <option value="PET plastic">PET plastic</option>
                            <option value="cardboard">Cardboard</option>
                            <option value="other/unknown">Other / Non-Recyclable</option>
                          </select>
                          <button
                            onClick={() => handleVerifyPrediction(pred.id)}
                            className="px-3 py-1 bg-[#146B4D] hover:bg-[#0F3D3E] text-white text-xs font-bold rounded-lg shadow-xs"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setVerifyingId(null)}
                            className="px-2 py-1 text-slate-500 text-xs font-bold"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setVerifyingId(pred.id);
                            setVerifiedMaterialChoice('PET plastic');
                          }}
                          className="px-3.5 py-1.5 bg-[#146B4D] hover:bg-[#0F3D3E] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify Material</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {lowConfidencePredictions.length === 0 && (
                  <div className="p-8 text-center text-xs text-[#5B6B66]">
                    No pending low-confidence predictions in review queue. All pre-screenings meet threshold.
                  </div>
                )}
              </div>
            </div>

            {/* Warehouse Calibrated Inventory Monitor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-[#0F3D3E]">
                    Calibrated Warehouse Inventory ({warehouseInventory.length} lots)
                  </h4>
                  <p className="text-xs text-[#5B6B66]">
                    Completed physical pickups auto-transferred to inventory with single-sale duplicate protection
                  </p>
                </div>
              </div>

              <div className="divide-y divide-[#D5E6DD]/60 border border-[#D5E6DD] rounded-2xl overflow-hidden bg-white">
                {warehouseInventory.map((item) => (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-[#146B4D]">{item.id}</span>
                        <span className="font-bold text-[#0F3D3E]">{item.verified_weight_kg} kg {item.material_type}</span>
                        <span className="bg-[#E6F4EC] text-[#146B4D] font-bold px-2 py-0.5 rounded">
                          Quality: {item.quality_grade || 'Tier A'} ({item.quality_factor})
                        </span>
                      </div>
                      <p className="text-[#5B6B66]">
                        Hub: <strong>{item.location}</strong> &bull; Status: <strong className="uppercase">{item.status}</strong>
                      </p>
                    </div>

                    <span className="font-mono text-[11px] font-bold text-[#146B4D] bg-[#E6F4EC] px-2.5 py-1 rounded-full border border-[#D5E6DD]">
                      Single Sale Protected
                    </span>
                  </div>
                ))}

                {warehouseInventory.length === 0 && (
                  <div className="p-6 text-center text-xs text-[#5B6B66]">
                    No inventory lots recorded yet. Complete verified customer pickups to populate aggregation hub inventory.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ================= CONFIRMATION DIALOG (FOR DANGEROUS ACTIONS) ================= */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F3D3E]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#D5E6DD] space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center">
                <AlertOctagon className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="font-extrabold text-[#0F3D3E] text-base">
                {confirmDialog.title}
              </h3>
            </div>

            <p className="text-xs text-[#5B6B66] leading-relaxed">
              {confirmDialog.description}
            </p>

            <div className="flex items-center space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#D5E6DD] text-xs font-bold text-[#5B6B66] hover:bg-[#F4FAF7]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-2.5 rounded-xl text-xs transition shadow-md shadow-rose-600/30"
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
