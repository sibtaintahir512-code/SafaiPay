'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { CollectorDashboard } from '@/components/CollectorDashboard';
import { PickupRequest, MaterialRate } from '@/lib/types';
import { getPickups, getMaterialRates } from '@/lib/api';

export default function CollectorDashboardPage() {
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [materialRates, setMaterialRates] = useState<MaterialRate[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [pData, rData] = await Promise.all([
        getPickups('collector').catch(() => []),
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
    <ProtectedRoute allowedRole="collector">
      <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col font-sans transition-colors duration-200">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CollectorDashboard
            pickups={pickups}
            materialRates={materialRates}
            onRefresh={fetchData}
          />
        </main>
      </div>
    </ProtectedRoute>
  );
}
