'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Mail, FileText, UserRound, CalendarClock } from 'lucide-react';

export default function Customer() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || role !== 'customer')) {
      router.push('/login');
    }
  }, [user, role, loading, router]);

  if (loading) return <div className="px-6 py-10 text-slate-600">Cargando...</div>;
  if (!user || role !== 'customer') return null;

  return (
    <div className="flex-1 bg-[linear-gradient(180deg,#f8fbff_0%,#eef8fb_46%,#ffffff_100%)] px-4 pb-20 sm:px-6">
      <div className="mx-auto max-w-6xl py-8">
        <span className="inline-flex rounded-full border border-cyan-100 bg-white/80 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700 shadow-sm backdrop-blur-sm">
          Mi perfil
        </span>
        <h1 className="mt-6 text-4xl font-black text-slate-950 sm:text-5xl">Tu espacio personal en PodoMedic</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">Consulta tu información y mantén visible el historial de tu atención podológica.</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm">
            <UserRound className="h-7 w-7 text-cyan-600" />
            <p className="mt-4 text-lg font-black text-slate-950">Perfil</p>
            <p className="mt-1 text-sm text-slate-600">Tu información básica en un solo lugar.</p>
          </div>
          <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm">
            <CalendarClock className="h-7 w-7 text-blue-600" />
            <p className="mt-4 text-lg font-black text-slate-950">Seguimiento</p>
            <p className="mt-1 text-sm text-slate-600">Visualiza tu progreso y próximas referencias.</p>
          </div>
          <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm">
            <FileText className="h-7 w-7 text-teal-600" />
            <p className="mt-4 text-lg font-black text-slate-950">Historial</p>
            <p className="mt-1 text-sm text-slate-600">Mantén a la vista tus consultas y notas.</p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="rounded-[2rem] border border-cyan-100 bg-slate-950 p-8 text-white shadow-[0_28px_80px_rgba(15,23,42,0.18)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">Información personal</p>
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
              <Mail className="h-5 w-5 text-cyan-300" />
              <p className="mt-4 text-sm uppercase tracking-[0.2em] text-white/45">Correo</p>
              <p className="mt-2 text-lg font-semibold text-white">{user.email}</p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <h2 className="text-2xl font-black text-slate-950">Historial de Consultas</h2>
            <p className="mt-2 text-slate-600">Aquí podrás revisar el seguimiento y referencias de tu atención.</p>
            <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-slate-500">
              Historial...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
