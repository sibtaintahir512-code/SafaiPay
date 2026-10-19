'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { AdminDashboard } from '@/components/AdminDashboard';
import { PickupRequest, MaterialRate } from '@/lib/types';
import { getPickups, getMaterialRates } from '@/lib/api';

export default function AdminDashboardPage() {
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [materialRates, setMaterialRates] = useState<MaterialRate[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [pData, rData] = await Promise.all([
        getPickups('admin').catch(() => []),
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
    <ProtectedRoute allowedRole="admin">
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AdminDashboard
            pickups={pickups}
            materialRates={materialRates}
            onRefresh={fetchData}
          />
        </main>
      </div>
    </ProtectedRoute>
  );
}
