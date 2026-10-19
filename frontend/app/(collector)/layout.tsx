'use client';

import React from 'react';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function CollectorLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={['collector']}>{children}</RoleGuard>;
}
