'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { RecyclerDashboard } from '@/components/RecyclerDashboard';
import { PickupRequest, MaterialRate } from '@/lib/types';
import { getPickups, getMaterialRates } from '@/lib/api';
import { useRealtimeSync } from '@/lib/useRealtimeSync';

export default function RecyclerDashboardPage() {
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [materialRates, setMaterialRates] = useState<MaterialRate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [pData, rData] = await Promise.all([
        getPickups('recycler').catch(() => []),
        getMaterialRates().catch(() => []),
      ]);
      setPickups(pData);
      setMaterialRates(rData);
    } catch (err) {
      console.error('Failed to load recycler dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time synchronization without manual refresh
  useRealtimeSync({
    role: 'recycler',
    onRefresh: fetchData,
  });

  return (
    <ProtectedRoute allowedRole="recycler">
      <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col font-sans transition-colors duration-200">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <RecyclerDashboard
            pickups={pickups}
            materialRates={materialRates}
            onRefresh={fetchData}
          />
        </main>
      </div>
    </ProtectedRoute>
  );
}
