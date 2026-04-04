'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { Droplets, HeartPulse, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';

type LevelEntry = {
  id: string;
  metric?: string;
  value?: string;
  unit?: string;
  notes?: string;
  recordedAt?: { seconds?: number };
};

export default function CustomerLevelsHistoryPage() {
  const { user } = useAuth();
  const [levels, setLevels] = useState<LevelEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLevels = async () => {
      if (!db || !user) {
        setLoading(false);
        return;
      }

      try {
        const snapshot = await getDocs(
          query(collection(db, 'health_levels'), where('userId', '==', user.uid), orderBy('recordedAt', 'desc')),
        );
        setLevels(
          snapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data(),
          })) as LevelEntry[],
        );
      } finally {
        setLoading(false);
      }
    };

    loadLevels();
  }, [user]);

  const glucoseValues = levels
    .filter((entry) => entry.metric === 'Glucosa')
    .map((entry) => Number(entry.value))
    .filter((value) => !Number.isNaN(value));

  const glucoseRange = useMemo(() => {
    if (glucoseValues.length === 0) return 'Sin datos';
    return `${Math.min(...glucoseValues)}-${Math.max(...glucoseValues)}`;
  }, [glucoseValues]);

  return (
    <div className="space-y-8">
      <section>
        <span className="inline-flex rounded-full border border-cyan-100 bg-white/80 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700 shadow-sm backdrop-blur-sm">
          Historial de niveles
        </span>
        <h1 className="mt-6 text-4xl font-black text-slate-950 sm:text-5xl">Evolución reciente de tus registros</h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">
          Sigue la variación de tus indicadores con una vista clara alimentada por tus capturas reales.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <TrendingUp className="h-7 w-7 text-cyan-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">{loading ? '...' : levels.length}</p>
          <p className="mt-1 text-sm text-slate-600">Registros acumulados</p>
        </div>
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <Droplets className="h-7 w-7 text-blue-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">{loading ? '...' : glucoseRange}</p>
          <p className="mt-1 text-sm text-slate-600">Rango de glucosa reciente</p>
        </div>
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <HeartPulse className="h-7 w-7 text-teal-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">
            {loading ? '...' : levels[0]?.metric ?? 'Sin datos'}
          </p>
          <p className="mt-1 text-sm text-slate-600">Último indicador capturado</p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <h2 className="text-2xl font-black text-slate-950">Últimos registros</h2>
        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-500">
              Cargando historial...
            </div>
          ) : levels.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-slate-500">
              Aún no tienes registros de niveles.
            </div>
          ) : (
            levels.map((entry) => (
              <div key={entry.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-lg font-bold text-slate-950">{entry.metric}</p>
                    <p className="text-sm text-slate-600">
                      {entry.recordedAt?.seconds
                        ? new Date(entry.recordedAt.seconds * 1000).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'Sin fecha registrada'}
                    </p>
                    {entry.notes && <p className="mt-2 text-sm leading-relaxed text-slate-500">{entry.notes}</p>}
                  </div>
                  <span className="text-sm font-semibold text-cyan-700">
                    {entry.value} {entry.unit}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
