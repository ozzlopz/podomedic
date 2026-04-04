'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { CalendarClock, FileText, Mail, TrendingUp, UserRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';

type LevelEntry = {
  id: string;
  metric?: string;
  value?: string;
  unit?: string;
  recordedAt?: { seconds?: number };
};

type ConsultationEntry = {
  id: string;
  reason?: string;
  notes?: string;
  consultationDate?: { seconds?: number };
};

export default function Customer() {
  const { user, profile } = useAuth();
  const [levels, setLevels] = useState<LevelEntry[]>([]);
  const [consultations, setConsultations] = useState<ConsultationEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      if (!db || !user) {
        setLoading(false);
        return;
      }

      try {
        const [levelsSnapshot, consultationsSnapshot] = await Promise.all([
          getDocs(
            query(
              collection(db, 'health_levels'),
              where('userId', '==', user.uid),
              orderBy('recordedAt', 'desc'),
              limit(5),
            ),
          ),
          getDocs(
            query(
              collection(db, 'consultations'),
              where('userId', '==', user.uid),
              orderBy('consultationDate', 'desc'),
              limit(3),
            ),
          ),
        ]);

        setLevels(
          levelsSnapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data(),
          })) as LevelEntry[],
        );
        setConsultations(
          consultationsSnapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data(),
          })) as ConsultationEntry[],
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user]);

  const lastLevel = levels[0];
  const lastConsultation = consultations[0];
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ');

  const latestLevelLabel = useMemo(() => {
    if (!lastLevel?.metric || !lastLevel?.value) return 'Sin registros todavía';
    return `${lastLevel.metric}: ${lastLevel.value}${lastLevel.unit ? ` ${lastLevel.unit}` : ''}`;
  }, [lastLevel]);

  const latestConsultationDate =
    lastConsultation?.consultationDate?.seconds
      ? new Date(lastConsultation.consultationDate.seconds * 1000).toLocaleDateString('es-MX', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : 'Sin consultas registradas';

  return (
    <div className="space-y-8">
      <section>
        <span className="inline-flex rounded-full border border-cyan-100 bg-white/80 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700 shadow-sm backdrop-blur-sm">
          Dashboard paciente
        </span>
        <h1 className="mt-6 text-4xl font-black text-slate-950 sm:text-5xl">
          {fullName ? `Bienvenido, ${fullName}` : 'Tu espacio personal en PodoMedic'}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          Consulta tu seguimiento real, revisa tus consultas recientes y mantén a la mano tus niveles registrados.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/customer/registrar-niveles"
          className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-cyan-200"
        >
          <UserRound className="h-7 w-7 text-cyan-600" />
          <p className="mt-4 text-lg font-black text-slate-950">Registrar niveles</p>
          <p className="mt-1 text-sm text-slate-600">Captura glucosa, presión, peso y otros indicadores.</p>
        </Link>
        <Link
          href="/customer/historial-niveles"
          className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-cyan-200"
        >
          <TrendingUp className="h-7 w-7 text-blue-600" />
          <p className="mt-4 text-lg font-black text-slate-950">{loading ? '...' : levels.length}</p>
          <p className="mt-1 text-sm text-slate-600">Registros recientes de niveles.</p>
        </Link>
        <Link
          href="/customer/historial-consultas"
          className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-cyan-200"
        >
          <FileText className="h-7 w-7 text-teal-600" />
          <p className="mt-4 text-lg font-black text-slate-950">{loading ? '...' : consultations.length}</p>
          <p className="mt-1 text-sm text-slate-600">Consultas registradas visibles para ti.</p>
        </Link>
      </section>

      <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-[2rem] border border-cyan-100 bg-slate-950 p-8 text-white shadow-[0_28px_80px_rgba(15,23,42,0.18)]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">Información personal</p>
          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <Mail className="h-5 w-5 text-cyan-300" />
              <p className="mt-4 text-sm uppercase tracking-[0.2em] text-white/45">Correo</p>
              <p className="mt-2 text-lg font-semibold text-white">{user?.email ?? 'Sin correo registrado'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <CalendarClock className="h-5 w-5 text-cyan-300" />
              <p className="mt-4 text-sm uppercase tracking-[0.2em] text-white/45">Última consulta</p>
              <p className="mt-2 text-lg font-semibold text-white">{latestConsultationDate}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <h2 className="text-2xl font-black text-slate-950">Último nivel registrado</h2>
            <p className="mt-2 text-slate-600">Consulta rápido el registro más reciente capturado desde tu panel.</p>
            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-lg font-bold text-slate-950">{latestLevelLabel}</p>
              <p className="mt-2 text-sm text-slate-500">
                {lastLevel?.recordedAt?.seconds
                  ? new Date(lastLevel.recordedAt.seconds * 1000).toLocaleString('es-MX')
                  : 'Cuando registres datos aquí aparecerá tu última captura.'}
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <h2 className="text-2xl font-black text-slate-950">Consultas recientes</h2>
            <div className="mt-6 space-y-4">
              {consultations.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-slate-500">
                  Aún no hay consultas registradas para tu cuenta.
                </div>
              ) : (
                consultations.map((consultation) => (
                  <div key={consultation.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-lg font-bold text-slate-950">{consultation.reason ?? 'Consulta médica'}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {consultation.consultationDate?.seconds
                        ? new Date(consultation.consultationDate.seconds * 1000).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'Sin fecha registrada'}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      {consultation.notes ?? 'Sin notas clínicas registradas.'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
