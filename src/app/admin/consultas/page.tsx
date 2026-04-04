'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { CalendarDays, FileText, HeartPulse, ArrowRight } from 'lucide-react';
import { db } from '@/lib/firebase';

type Consultation = {
  id: string;
  userId?: string;
  appointmentId?: string;
  reason?: string;
  notes?: string;
  status?: string;
  consultationDate?: { seconds?: number };
};

export default function AdminConsultationsPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadConsultations = async () => {
      if (!db) {
        setError('No se pudo conectar con Firestore.');
        setLoading(false);
        return;
      }

      try {
        const snapshot = await getDocs(query(collection(db, 'consultations'), orderBy('consultationDate', 'desc')));
        setConsultations(
          snapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data(),
          })) as Consultation[],
        );
        setError('');
      } catch {
        setError('No fue posible cargar las consultas.');
      } finally {
        setLoading(false);
      }
    };

    loadConsultations();
  }, []);

  const followUps = consultations.filter((consultation) => consultation.status === 'seguimiento').length;
  const valuations = consultations.filter((consultation) => consultation.status === 'valoracion').length;

  return (
    <div className="space-y-8">
      <section>
        <span className="inline-flex rounded-full border border-cyan-100 bg-white/80 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700 shadow-sm backdrop-blur-sm">
          Consultas
        </span>
        <h1 className="mt-6 text-4xl font-black text-slate-950 sm:text-5xl">Índice clínico de consultas</h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">
          Revisa de forma centralizada todas las consultas creadas desde citas o seguimiento administrativo.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <FileText className="h-7 w-7 text-cyan-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">{loading ? '...' : consultations.length}</p>
          <p className="mt-1 text-sm text-slate-600">Consultas registradas</p>
        </div>
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <HeartPulse className="h-7 w-7 text-blue-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">{loading ? '...' : followUps}</p>
          <p className="mt-1 text-sm text-slate-600">Seguimientos activos</p>
        </div>
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <CalendarDays className="h-7 w-7 text-teal-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">{loading ? '...' : valuations}</p>
          <p className="mt-1 text-sm text-slate-600">Valoraciones registradas</p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <h2 className="text-2xl font-black text-slate-950">Listado general</h2>
        <div className="mt-6 space-y-4">
          {loading && (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-500">
              Cargando consultas...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-3xl border border-red-100 bg-red-50 p-5 text-red-600">{error}</div>
          )}

          {!loading && !error && consultations.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-slate-500">
              Aún no hay consultas registradas.
            </div>
          )}

          {!loading &&
            !error &&
            consultations.map((consultation) => (
              <Link
                key={consultation.id}
                href={`/admin/consultas/${consultation.id}`}
                className="block rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-cyan-200 hover:bg-cyan-50/40"
              >
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <p className="text-lg font-bold text-slate-950">{consultation.reason ?? 'Consulta clínica'}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                      {consultation.notes ?? 'Sin notas clínicas registradas.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                      {consultation.status ?? 'consulta'}
                    </span>
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                      {consultation.consultationDate?.seconds
                        ? new Date(consultation.consultationDate.seconds * 1000).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Sin fecha'}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                      Ver detalle
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
