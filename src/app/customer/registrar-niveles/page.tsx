'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp, where } from 'firebase/firestore';
import { Activity, Droplets, Scale } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';

const metricOptions = [
  { value: 'Glucosa', unit: 'mg/dL', icon: Droplets },
  { value: 'Presión', unit: 'mmHg', icon: Activity },
  { value: 'Peso', unit: 'kg', icon: Scale },
] as const;

type RecentLevel = {
  id: string;
  metric?: string;
  value?: string;
  unit?: string;
  recordedAt?: { seconds?: number };
};

export default function CustomerRegisterLevelsPage() {
  const { user } = useAuth();
  const [recentLevels, setRecentLevels] = useState<RecentLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    metric: 'Glucosa',
    value: '',
    unit: 'mg/dL',
    notes: '',
    recordedAt: new Date().toISOString().slice(0, 16),
  });

  const loadRecentLevels = useCallback(async () => {
    if (!db || !user) {
      setLoading(false);
      return;
    }

    try {
      const snapshot = await getDocs(
        query(
          collection(db, 'health_levels'),
          where('userId', '==', user.uid),
          orderBy('recordedAt', 'desc'),
          limit(3),
        ),
      );

      setRecentLevels(
        snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        })) as RecentLevel[],
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadRecentLevels();
  }, [loadRecentLevels]);

  const selectedMetric = metricOptions.find((option) => option.value === form.metric) ?? metricOptions[0];

  const handleMetricChange = (metric: string, unit: string) => {
    setForm((current) => ({
      ...current,
      metric,
      unit,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!db || !user) {
      setError('No se pudo conectar con Firestore.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await addDoc(collection(db, 'health_levels'), {
        userId: user.uid,
        metric: form.metric,
        value: form.value,
        unit: form.unit,
        notes: form.notes,
        recordedAt: new Date(form.recordedAt),
        createdAt: serverTimestamp(),
      });

      setSuccess('Nivel registrado correctamente.');
      setForm({
        metric: form.metric,
        value: '',
        unit: selectedMetric.unit,
        notes: '',
        recordedAt: new Date().toISOString().slice(0, 16),
      });
      await loadRecentLevels();
    } catch {
      setError('No fue posible guardar tu registro.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <span className="inline-flex rounded-full border border-cyan-100 bg-white/80 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700 shadow-sm backdrop-blur-sm">
          Registrar niveles
        </span>
        <h1 className="mt-6 text-4xl font-black text-slate-950 sm:text-5xl">Captura tus niveles de seguimiento</h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">
          Registra tus indicadores importantes para que tu seguimiento clínico se mantenga actualizado.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {metricOptions.map(({ value, unit, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => handleMetricChange(value, unit)}
            className={`rounded-[2rem] border p-6 text-left shadow-[0_18px_60px_rgba(15,23,42,0.06)] transition ${
              form.metric === value
                ? 'border-cyan-200 bg-cyan-50/80'
                : 'border-white/70 bg-white/80 hover:border-cyan-200 hover:bg-cyan-50/40'
            }`}
          >
            <Icon className="h-7 w-7 text-cyan-600" />
            <p className="mt-4 text-2xl font-black text-slate-950">{value}</p>
            <p className="mt-1 text-sm text-slate-600">Unidad sugerida: {unit}</p>
          </button>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]"
        >
          <h2 className="text-2xl font-black text-slate-950">Formulario de captura</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Indicador</span>
              <input
                value={form.metric}
                readOnly
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-900"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Valor</span>
              <input
                required
                value={form.value}
                onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                placeholder="Ej. 98"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Unidad</span>
              <input
                value={form.unit}
                onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Fecha y hora</span>
              <input
                type="datetime-local"
                required
                value={form.recordedAt}
                onChange={(event) => setForm((current) => ({ ...current, recordedAt: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              />
            </label>
          </div>

          <label className="mt-4 block">
            <span className="text-sm font-semibold text-slate-700">Notas</span>
            <textarea
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              rows={4}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              placeholder="Observaciones opcionales..."
            />
          </label>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Guardando registro...' : 'Guardar nivel'}
          </button>
        </form>

        <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <h2 className="text-2xl font-black text-slate-950">Tus últimas capturas</h2>
          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-500">
                Cargando registros...
              </div>
            ) : recentLevels.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-slate-500">
                Aún no has registrado niveles.
              </div>
            ) : (
              recentLevels.map((entry) => (
                <div key={entry.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-lg font-bold text-slate-950">
                    {entry.metric}: {entry.value} {entry.unit}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {entry.recordedAt?.seconds
                      ? new Date(entry.recordedAt.seconds * 1000).toLocaleString('es-MX')
                      : 'Sin fecha registrada'}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </section>
    </div>
  );
}
