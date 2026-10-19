'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { RecyclerDashboard } from '@/components/RecyclerDashboard';
import { PickupRequest, MaterialRate } from '@/lib/types';
import { getPickups, getMaterialRates } from '@/lib/api';

export default function RecyclerDashboardPage() {
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [materialRates, setMaterialRates] = useState<MaterialRate[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [pData, rData] = await Promise.all([
        getPickups('recycler').catch(() => []),
        getMaterialRates().catch(() => []),
      ]);
      setPickups(pData);
      setMaterialRates(rData);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <ProtectedRoute allowedRole="recycler">
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
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
