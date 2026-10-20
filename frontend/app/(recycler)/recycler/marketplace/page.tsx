'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  Factory,
  Package,
  Scale,
  MapPin,
  Filter,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Sparkles,
  ShieldCheck,
  Plus,
  AlertTriangle,
  Clock,
  Truck,
  XCircle,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import {
  procureBatch,
  getRecyclerDemands,
  createRecyclerDemand,
  getMarketplaceTransactions,
  getInventoryItems,
  acceptSupplyOffer,
  deliverMarketplaceTransaction,
  completeMarketplaceTransaction,
  disputeMarketplaceTransaction,
  cancelMarketplaceTransaction,
  RecyclerDemand,
  SupplyTransaction,
  InventoryItem
} from '@/lib/api';

interface MaterialBatch {
  id: string;
  batchCode: string;
  materialName: string;
  materialCategory: string;
  totalWeightTons: number;
  qualityGrade: 'Tier A' | 'Tier B';
  purityPercent: number;
  ratePerTonPkr: number;
  hubLocation: string;
  availableSince: string;
  moisturePercent: number;
  certifiedEco: boolean;
}

const MARKETPLACE_BATCHES: MaterialBatch[] = [
  {
    id: 'b-901',
    batchCode: 'BATCH-PET-2026-041',
    materialName: 'Clean Washed Hot-Water PET Flakes',
    materialCategory: 'PET_PLASTIC',
    totalWeightTons: 12.5,
    qualityGrade: 'Tier A',
    purityPercent: 99.1,
    ratePerTonPkr: 92000,
    hubLocation: 'Korangi Industrial Area Hub, Karachi',
    availableSince: 'Yesterday',
    moisturePercent: 0.8,
    certifiedEco: true
  },
  {
    id: 'b-902',
    batchCode: 'BATCH-OCC-2026-088',
    materialName: 'Double-Walled Corrugated Cardboard Bales',
    materialCategory: 'CARDBOARD_OCC',
    totalWeightTons: 24.0,
    qualityGrade: 'Tier A',
    purityPercent: 98.4,
    ratePerTonPkr: 42000,
    hubLocation: 'SITE Area Central Hub, Karachi',
    availableSince: '2 days ago',
    moisturePercent: 4.2,
    certifiedEco: true
  },
  {
    id: 'b-903',
    batchCode: 'BATCH-HDPE-2026-019',
    materialName: 'HDPE Natural Bottle Grade Granules',
    materialCategory: 'HDPE_PLASTIC',
    totalWeightTons: 8.2,
    qualityGrade: 'Tier A',
    purityPercent: 99.4,
    ratePerTonPkr: 115000,
    hubLocation: 'Port Qasim Logistics Hub, Karachi',
    availableSince: 'Today',
    moisturePercent: 0.4,
    certifiedEco: true
  },
  {
    id: 'b-904',
    batchCode: 'BATCH-MET-2026-012',
    materialName: 'Baled Aluminum UBC Beverage Cans',
    materialCategory: 'MIXED_METAL',
    totalWeightTons: 6.0,
    qualityGrade: 'Tier A',
    purityPercent: 97.8,
    ratePerTonPkr: 165000,
    hubLocation: 'North Karachi Industrial Hub, Karachi',
    availableSince: '3 days ago',
    moisturePercent: 0.2,
    certifiedEco: true
  }
];

export default function RecyclerMarketplacePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isUrdu } = useLanguage();

  const [activeTab, setActiveTab] = useState<'demands' | 'inventory' | 'transactions' | 'batches'>('demands');

  // Wholesale batches state
  const [batches] = useState<MaterialBatch[]>(MARKETPLACE_BATCHES);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBatch, setSelectedBatch] = useState<MaterialBatch | null>(null);
  const [requested, setRequested] = useState<boolean>(false);

  // Phase 4 Demands & Marketplace state
  const [demands, setDemands] = useState<RecyclerDemand[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<SupplyTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDemandModal, setShowDemandModal] = useState(false);
  const [submittingDemand, setSubmittingDemand] = useState(false);

  // New demand form
  const [materialType, setMaterialType] = useState('PET plastic');
  const [requiredQuantity, setRequiredQuantity] = useState(2500);
  const [minimumQuality, setMinimumQuality] = useState('Tier A');
  const [location, setLocation] = useState('Korangi Industrial Area, Karachi');
  const [offeredPrice, setOfferedPrice] = useState(85);
  const [deadline, setDeadline] = useState('2026-11-20');

  // Transaction dispute modal
  const [disputeTxnId, setDisputeTxnId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');

  // Transaction cancel modal
  const [cancelTxnId, setCancelTxnId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Top banner message
  const [bannerMessage, setBannerMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Load marketplace data
  const loadMarketplaceData = async () => {
    setIsLoading(true);
    try {
      const [dList, invList, txList] = await Promise.all([
        getRecyclerDemands(),
        getInventoryItems(),
        getMarketplaceTransactions()
      ]);
      setDemands(dList);
      setInventory(invList);
      setTransactions(txList);
    } catch (err) {
      console.error('Failed to load marketplace data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  const handleCreateDemand = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingDemand(true);
    try {
      await createRecyclerDemand({
        material_type: materialType,
        required_quantity_kg: Number(requiredQuantity),
        minimum_quality: minimumQuality,
        location: location,
        offered_price_per_kg: Number(offeredPrice),
        deadline: new Date(deadline).toISOString()
      });
      setShowDemandModal(false);
      setBannerMessage({ type: 'success', text: 'Demand post successfully published to marketplace.' });
      await loadMarketplaceData();
    } catch (err: any) {
      setBannerMessage({ type: 'error', text: err.message || 'Failed to create demand post.' });
    } finally {
      setSubmittingDemand(false);
    }
  };

  const handleDeliverTransaction = async (txnId: string) => {
    try {
      await deliverMarketplaceTransaction(txnId, 'https://safaipay.org/proof/gatepass_verified.jpg');
      setBannerMessage({ type: 'success', text: 'Transaction marked as Delivered.' });
      await loadMarketplaceData();
    } catch (err: any) {
      setBannerMessage({ type: 'error', text: err.message || 'Failed to update transaction.' });
    }
  };

  const handleCompleteTransaction = async (txnId: string) => {
    try {
      await completeMarketplaceTransaction(txnId);
      setBannerMessage({ type: 'success', text: 'Transaction completed and funds settled.' });
      await loadMarketplaceData();
    } catch (err: any) {
      setBannerMessage({ type: 'error', text: err.message || 'Failed to complete transaction.' });
    }
  };

  const handleDisputeTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeTxnId || !disputeReason) return;
    try {
      await disputeMarketplaceTransaction(disputeTxnId, disputeReason);
      setDisputeTxnId(null);
      setDisputeReason('');
      setBannerMessage({ type: 'info', text: 'Dispute submitted for operations arbitration.' });
      await loadMarketplaceData();
    } catch (err: any) {
      setBannerMessage({ type: 'error', text: err.message || 'Failed to raise dispute.' });
    }
  };

  const handleConfirmCancelTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTxnId || !cancelReason.trim()) return;
    try {
      await cancelMarketplaceTransaction(cancelTxnId, cancelReason.trim());
      setCancelTxnId(null);
      setCancelReason('');
      setBannerMessage({ type: 'info', text: 'Transaction has been cancelled.' });
      await loadMarketplaceData();
    } catch (err: any) {
      setBannerMessage({ type: 'error', text: err.message || 'Failed to cancel transaction.' });
    }
  };

  const handleRequestProcurement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBatch) {
      try {
        await procureBatch(selectedBatch.id, `Feedstock Lot: ${selectedBatch.materialName}`);
      } catch {}
    }
    setRequested(true);
    setTimeout(() => {
      setRequested(false);
      setSelectedBatch(null);
      router.push('/recycler/batch-requests');
    }, 1200);
  };

  const filteredBatches = batches.filter((b) => {
    if (selectedCategory === 'all') return true;
    return b.materialCategory.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  return (
    <ProtectedRoute allowedRole={['recycler', 'admin']}>
      <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col font-sans transition-colors duration-200">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
                <Link href="/recycler/dashboard" className="hover:text-purple-600 transition">
                  {isUrdu ? 'ڈیش بورڈ' : 'Dashboard'}
                </Link>
                <span>/</span>
                <span className="text-purple-700 font-bold">{isUrdu ? 'مارکیٹ پلیس' : 'Marketplace'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {isUrdu ? 'ری سائیکلر ڈیمانڈ اور میٹریل مارکیٹ پلیس' : 'Recycler Marketplace & Demand Portal'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {isUrdu
                  ? 'صنعتی ضروریات کے لیے نئی ڈیمانڈ پوسٹ کریں اور تصدیق شدہ سپلائی پیشکشیں قبول کریں۔'
                  : 'Post industrial material demand, receive verified collector supply offers, and trace supply chain lifecycle.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDemandModal(true)}
                className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md shadow-purple-600/20 transition"
              >
                <Plus className="w-4 h-4" />
                <span>{isUrdu ? 'نئی ڈیمانڈ پوسٹ کریں' : '+ Post Material Demand'}</span>
              </button>

              <Link
                href="/recycler/batch-requests"
                className="inline-flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm transition shadow-xs"
              >
                <FileCheck2 className="w-4 h-4 text-purple-600" />
                <span>{isUrdu ? 'آرڈرز' : 'Orders'}</span>
              </Link>
            </div>
          </div>

          {bannerMessage && (
            <div className={`mb-6 p-4 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs ${
              bannerMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : bannerMessage.type === 'error'
                ? 'bg-red-50 border border-red-200 text-red-900'
                : 'bg-purple-50 border border-purple-200 text-purple-900'
            }`}>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bannerMessage.text}</span>
              </div>
              <button
                onClick={() => setBannerMessage(null)}
                className="font-bold opacity-70 hover:opacity-100 ml-4"
              >
                ✕
              </button>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex space-x-2 border-b border-slate-200 mb-6 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('demands')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'demands'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{isUrdu ? 'صنعتی ڈیمانڈز' : 'Open Recycler Demands'} ({demands.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'transactions'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>{isUrdu ? 'سپلائی ٹرانزیکشنز' : 'Supply Transactions'} ({transactions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'inventory'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>{isUrdu ? 'تصدیق شدہ گودام انوینٹری' : 'Warehouse Inventory'} ({inventory.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('batches')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'batches'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Factory className="w-4 h-4" />
              <span>{isUrdu ? 'تھوک بیچز' : 'B2B Wholesale Batches'}</span>
            </button>
          </div>

          {/* TAB 1: RECYCLER DEMANDS */}
          {activeTab === 'demands' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {demands.map((demand) => (
                  <div
                    key={demand.id}
                    className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {demand.material_type}
                        </span>
                        <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {demand.minimum_quality} Min
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 mb-1">{demand.recycler_name || 'Industrial Recycler Demand'}</h3>
                      <p className="text-xs text-slate-500 mb-4 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{demand.location}</span>
                      </p>

                      <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl mb-4 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[11px] uppercase font-bold">Required Qty</span>
                          <strong className="text-slate-900 font-mono text-base">{demand.required_quantity_kg.toLocaleString()} kg</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px] uppercase font-bold">Offered Price</span>
                          <strong className="text-emerald-700 font-mono text-base">Rs {demand.offered_price_per_kg}/kg</strong>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs text-slate-500">
                        <div className="flex justify-between">
                          <span>Total Budget:</span>
                          <strong className="font-mono text-slate-900">Rs {demand.total_budget_pkr.toLocaleString()}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Deadline:</span>
                          <span className="font-mono text-slate-700">{new Date(demand.deadline).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <span className="font-bold text-purple-700 uppercase text-[11px]">{demand.status}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">
                        {demand.offers_count || 0} supply offers received
                      </span>
                      <button
                        onClick={() => {
                          setBannerMessage({
                            type: 'info',
                            text: `Offers submitted for demand #${demand.id}. Recyclers can review and accept via API or Collector dashboard.`
                          });
                        }}
                        className="text-xs font-bold text-purple-600 hover:text-purple-700"
                      >
                        View Offers &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {demands.length === 0 && !isLoading && (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-700">No Active Demand Posts</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                    Click &ldquo;+ Post Material Demand&rdquo; above to publish your feedstock requirements to regional collection hubs.
                  </p>
                  <button
                    onClick={() => setShowDemandModal(true)}
                    className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs"
                  >
                    Create First Demand
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SUPPLY TRANSACTIONS */}
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-purple-600" />
                    <span>Active Supply Chain Transactions & Fulfillments</span>
                  </h2>
                  <span className="text-xs text-slate-500">
                    Lifecycle: Available &rarr; Offer Submitted &rarr; Accepted &rarr; Delivered &rarr; Completed
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {transactions.map((txn) => (
                    <div key={txn.id} className="p-5 hover:bg-slate-50/50 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            {txn.id}
                          </span>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            txn.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                            txn.status === 'DELIVERED' ? 'bg-blue-100 text-blue-800' :
                            txn.status === 'ACCEPTED' ? 'bg-purple-100 text-purple-800' :
                            txn.status === 'DISPUTED' ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {txn.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {txn.quantity_kg.toLocaleString()} kg {txn.material_type} &bull; Rs {txn.total_amount_pkr.toLocaleString()}
                        </h4>
                        <p className="text-xs text-slate-500">
                          Collector: <strong>{txn.collector_name || 'Verified Aggregation Center'}</strong> &bull; Recycler: <strong>{txn.recycler_name || 'Industrial Plant'}</strong>
                        </p>
                        {txn.dispute_reason && (
                          <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-1">
                            Dispute Reason: {txn.dispute_reason}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {txn.status === 'ACCEPTED' && (
                          <button
                            onClick={() => handleDeliverTransaction(txn.id)}
                            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
                          >
                            Mark Delivered
                          </button>
                        )}

                        {txn.status === 'DELIVERED' && (
                          <button
                            onClick={() => handleCompleteTransaction(txn.id)}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm & Complete</span>
                          </button>
                        )}

                        {['ACCEPTED', 'DELIVERED'].includes(txn.status) && (
                          <>
                            <button
                              onClick={() => {
                                setDisputeTxnId(txn.id);
                                setDisputeReason('');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-xs"
                            >
                              Raise Dispute
                            </button>
                            <button
                              onClick={() => {
                                setCancelTxnId(txn.id);
                                setCancelReason('');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}

                  {transactions.length === 0 && (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No active transactions found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WAREHOUSE INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Package className="w-5 h-5 text-purple-600" />
                      <span>Calibrated Hub Inventory (Completed Pickups)</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Items created from physically weighed pickups with duplicate sale prevention enforced.
                    </p>
                  </div>
                  <span className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-bold border border-purple-200">
                    Single-Sale Protected
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {inventory.map((item) => (
                    <div key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            {item.id}
                          </span>
                          <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                            {item.quality_grade || 'Tier A'} (Factor: {item.quality_factor})
                          </span>
                          <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded font-mono font-bold">
                            {item.status}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900">
                          {item.verified_weight_kg.toLocaleString()} kg &bull; {item.material_type}
                        </h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.location}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          Scale Verified Weight
                        </span>
                      </div>
                    </div>
                  ))}

                  {inventory.length === 0 && (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No inventory records found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WHOLESALE BATCHES (EXISTING) */}
          {activeTab === 'batches' && (
            <div className="space-y-6">
              {/* Filter Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
                  <Filter className="w-4 h-4 text-slate-400 mr-1" />
                  {[
                    { id: 'all', label: isUrdu ? 'تمام خام مال' : 'All Materials' },
                    { id: 'pet', label: isUrdu ? 'پی ای ٹی فلییکس' : 'PET Flakes' },
                    { id: 'cardboard', label: isUrdu ? 'او سی سی گتا' : 'OCC Cardboard' },
                    { id: 'hdpe', label: isUrdu ? 'ایچ ڈی پی ای' : 'HDPE Polymer' },
                    { id: 'metal', label: isUrdu ? 'ایلومینیم اور میٹل' : 'Metals' },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => setSelectedCategory(btn.id)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                        selectedCategory === btn.id
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {filteredBatches.length} industrial lots available
                </div>
              </div>

              {/* Batches Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredBatches.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white rounded-3xl border border-slate-200 hover:border-purple-300 transition shadow-xs hover:shadow-md p-6 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {b.batchCode}
                        </span>
                        <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {b.qualityGrade} ({b.purityPercent}% Pure)
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 mb-2">{b.materialName}</h3>

                      <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl my-4 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[11px] uppercase font-bold">Total Net Weight</span>
                          <strong className="text-slate-900 font-mono text-base">{b.totalWeightTons} Metric Tons</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px] uppercase font-bold">Rate Per Ton</span>
                          <strong className="text-emerald-700 font-mono text-base">Rs {b.ratePerTonPkr.toLocaleString()}</strong>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{b.hubLocation}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Scale className="w-3.5 h-3.5 text-slate-400" />
                          <span>Moisture: <strong>{b.moisturePercent}%</strong> | Sorted & Baled</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-5 border-t border-slate-100 flex items-center justify-between mt-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Lot Value</span>
                        <span className="text-lg font-black text-slate-900 font-mono">
                          Rs {(b.totalWeightTons * b.ratePerTonPkr).toLocaleString()}
                        </span>
                      </div>

                      <button
                        onClick={() => setSelectedBatch(b)}
                        className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-sm shadow-purple-600/20"
                      >
                        <span>Request Procurement</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Environmental & Non-Banking Regulatory Disclaimer */}
          <div className="mt-12 bg-white rounded-3xl border border-slate-200 p-6 text-xs text-slate-500 space-y-2">
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Circular Economy Marketplace Compliance & Regulatory Notice</span>
            </div>
            <p>
              SafaiPay is a clean-tech platform facilitating verified reverse logistics and recyclable material circularity between households, collection aggregators, and industrial recyclers.
              SafaiPay does not operate as a licensed bank, deposit-taking institution, lender, or insurer. All digital records represent physical inventory and calibrated weighbridge settlements.
            </p>
          </div>

          {/* Demand Creation Modal */}
          {showDemandModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
                <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900">
                    Post Recycler Material Demand
                  </h3>
                  <button
                    onClick={() => setShowDemandModal(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateDemand} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Material Stream</label>
                    <select
                      value={materialType}
                      onChange={(e) => setMaterialType(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    >
                      <option value="PET plastic">PET plastic (Beverage bottles, clear flakes)</option>
                      <option value="cardboard">Cardboard (OCC corrugated packaging)</option>
                      <option value="other/unknown">Other / Mixed Polymer</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Required Quantity (kg)</label>
                      <input
                        type="number"
                        min="50"
                        step="10"
                        value={requiredQuantity}
                        onChange={(e) => setRequiredQuantity(Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-purple-600 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Offered Price (PKR / kg)</label>
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        value={offeredPrice}
                        onChange={(e) => setOfferedPrice(Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-purple-600 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Minimum Quality Grade</label>
                      <select
                        value={minimumQuality}
                        onChange={(e) => setMinimumQuality(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none"
                      >
                        <option value="Tier A">Tier A (&gt;95% Purity)</option>
                        <option value="Tier B">Tier B (Standard Purity)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Fulfillment Deadline</label>
                      <input
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Delivery Destination / Warehouse</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., Korangi Industrial Area Plot 24, Karachi"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="bg-purple-50 p-3.5 rounded-xl border border-purple-200 flex justify-between items-center">
                    <span className="text-purple-900 font-bold">Estimated Total Budget:</span>
                    <strong className="text-base font-black text-purple-700 font-mono">
                      Rs {(requiredQuantity * offeredPrice).toLocaleString()}
                    </strong>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowDemandModal(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingDemand}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition shadow-md shadow-purple-600/20 disabled:opacity-50"
                    >
                      {submittingDemand ? 'Publishing...' : 'Publish Demand Post'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Dispute Modal */}
          {disputeTxnId && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
                <h3 className="text-base font-bold text-slate-900 mb-2">Raise Weighbridge / Quality Dispute</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Flag discrepancies in tare/gross weight, contamination level, or dispatch schedule for mediation.
                </p>
                <form onSubmit={handleDisputeTransaction} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Dispute Reason & Details</label>
                    <textarea
                      rows={3}
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      placeholder="e.g., Gross weight on weighbridge receipt is 65kg below manifested amount."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setDisputeTxnId(null)}
                      className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs"
                    >
                      Submit Dispute
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Cancel Transaction Modal */}
          {cancelTxnId && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
                <h3 className="text-base font-bold text-slate-900 mb-2">Cancel Supply Transaction</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Please provide a documented reason for cancelling this supply transaction for operations audit records.
                </p>
                <form onSubmit={handleConfirmCancelTransaction} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cancellation Reason</label>
                    <textarea
                      rows={3}
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="e.g., Procurement order superseded or duplicate dispatch created."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setCancelTxnId(null)}
                      className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-xs"
                    >
                      Confirm Cancellation
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Procurement Modal */}
          {selectedBatch && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
                <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {selectedBatch.batchCode}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">
                      Procurement Purchase Order Request
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedBatch(null)}
                    className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
                  >
                    ✕
                  </button>
                </div>

                {requested ? (
                  <div className="py-8 text-center space-y-2">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                    <h4 className="text-base font-bold text-emerald-950">Purchase Order Submitted!</h4>
                    <p className="text-xs text-slate-500">Dispatch logistics and weighbridge gate-pass scheduled.</p>
                  </div>
                ) : (
                  <form onSubmit={handleRequestProcurement} className="space-y-4 text-xs">
                    <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Feedstock Lot:</span>
                        <strong className="text-slate-900">{selectedBatch.materialName}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Batch Quantity:</span>
                        <strong className="font-mono text-slate-900">{selectedBatch.totalWeightTons} Tons</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pickup Hub:</span>
                        <span className="text-slate-800">{selectedBatch.hubLocation}</span>
                      </div>
                    </div>

                    <div className="bg-purple-50/80 border border-purple-100 rounded-xl p-3.5 space-y-1">
                      <div className="flex justify-between text-purple-900 font-bold">
                        <span>Total Invoice Amount:</span>
                        <span className="font-mono text-sm">
                          Rs {(selectedBatch.totalWeightTons * selectedBatch.ratePerTonPkr).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-700">
                        Includes certified chain-of-custody documentation & digital weighbridge receipt.
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setSelectedBatch(null)}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition shadow-md shadow-purple-600/20"
                      >
                        Confirm Purchase Order
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
