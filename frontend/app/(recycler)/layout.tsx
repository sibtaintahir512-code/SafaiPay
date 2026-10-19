'use client';

import React from 'react';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function RecyclerLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={['recycler']}>{children}</RoleGuard>;
}
