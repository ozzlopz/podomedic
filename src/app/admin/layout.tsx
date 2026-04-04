'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || role !== 'admin')) {
      router.replace('/login');
    }
  }, [loading, role, router, user]);

  if (loading) {
    return <div className="px-6 py-10 text-slate-600">Cargando...</div>;
  }

  if (!user || role !== 'admin') {
    return null;
  }

  return <DashboardShell role="admin">{children}</DashboardShell>;
}
