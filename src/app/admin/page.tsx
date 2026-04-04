'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Users, CalendarDays, ShieldCheck, TrendingUp } from 'lucide-react';

export default function Admin() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || role !== 'admin')) {
      router.push('/login');
    }
  }, [user, role, loading, router]);

  if (loading) return <div className="px-6 py-10 text-slate-600">Cargando...</div>;
  if (!user || role !== 'admin') return null;

  return (
    <div className="flex-1 bg-[linear-gradient(180deg,#f8fbff_0%,#eef8fb_46%,#ffffff_100%)] px-4 pb-20 sm:px-6">
      <div className="mx-auto max-w-6xl py-8">
        <span className="inline-flex rounded-full border border-cyan-100 bg-white/80 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700 shadow-sm backdrop-blur-sm">
          Panel de administración
        </span>
        <h1 className="mt-6 text-4xl font-black text-slate-950 sm:text-5xl">Control general del consultorio</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">Supervisa pacientes, citas y actividad del sistema desde un espacio más claro y ordenado.</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm">
            <Users className="h-7 w-7 text-cyan-600" />
            <p className="mt-4 text-lg font-black text-slate-950">Clientes</p>
            <p className="mt-1 text-sm text-slate-600">Visualiza y da seguimiento a usuarios registrados.</p>
          </div>
          <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm">
            <CalendarDays className="h-7 w-7 text-blue-600" />
            <p className="mt-4 text-lg font-black text-slate-950">Citas</p>
            <p className="mt-1 text-sm text-slate-600">Consulta las solicitudes y organización del día.</p>
          </div>
          <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm">
            <ShieldCheck className="h-7 w-7 text-teal-600" />
            <p className="mt-4 text-lg font-black text-slate-950">Gestión segura</p>
            <p className="mt-1 text-sm text-slate-600">Panel protegido para tareas administrativas.</p>
          </div>
          <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm">
            <TrendingUp className="h-7 w-7 text-indigo-600" />
            <p className="mt-4 text-lg font-black text-slate-950">Visión global</p>
            <p className="mt-1 text-sm text-slate-600">Mantén una lectura rápida del estado del sistema.</p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <h2 className="text-2xl font-black text-slate-950">Clientes Registrados</h2>
            <p className="mt-2 text-slate-600">Administra la información y seguimiento de pacientes.</p>
            <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-slate-500">
              Lista de clientes...
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <h2 className="text-2xl font-black text-slate-950">Citas Registradas</h2>
            <p className="mt-2 text-slate-600">Consulta y organiza próximas solicitudes de atención.</p>
            <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-slate-500">
              Lista de citas...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
