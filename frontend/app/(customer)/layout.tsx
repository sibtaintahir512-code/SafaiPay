'use client';

import React from 'react';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={['customer']}>{children}</RoleGuard>;
}
