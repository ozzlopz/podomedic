'use client';

import { useEffect, useState } from 'react';
import { CalendarCheck2, FileText, Stethoscope } from 'lucide-react';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';

type ConsultationEntry = {
  id: string;
  reason?: string;
  notes?: string;
  status?: string;
  consultationDate?: { seconds?: number };
};

export default function CustomerConsultationsHistoryPage() {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<ConsultationEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConsultations = async () => {
      if (!db || !user) {
        setLoading(false);
        return;
      }

      try {
        const snapshot = await getDocs(
          query(collection(db, 'consultations'), where('userId', '==', user.uid), orderBy('consultationDate', 'desc')),
        );
        setConsultations(
          snapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data(),
          })) as ConsultationEntry[],
        );
      } finally {
        setLoading(false);
      }
    };

    loadConsultations();
  }, [user]);

  return (
    <div className="space-y-8">
      <section>
        <span className="inline-flex rounded-full border border-cyan-100 bg-white/80 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700 shadow-sm backdrop-blur-sm">
          Historial de consultas
        </span>
        <h1 className="mt-6 text-4xl font-black text-slate-950 sm:text-5xl">Resumen de tu atención clínica</h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">
          Consulta tus visitas anteriores, motivos de atención y notas clínicas registradas en tu expediente.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <CalendarCheck2 className="h-7 w-7 text-cyan-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">{loading ? '...' : consultations.length}</p>
          <p className="mt-1 text-sm text-slate-600">Consultas registradas</p>
        </div>
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <Stethoscope className="h-7 w-7 text-blue-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">
            {loading ? '...' : consultations.filter((consultation) => consultation.status === 'seguimiento').length}
          </p>
          <p className="mt-1 text-sm text-slate-600">Seguimientos marcados</p>
        </div>
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <FileText className="h-7 w-7 text-teal-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">
            {loading ? '...' : consultations[0]?.reason ?? 'Sin datos'}
          </p>
          <p className="mt-1 text-sm text-slate-600">Último motivo de consulta</p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <h2 className="text-2xl font-black text-slate-950">Consultas recientes</h2>
        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-500">
              Cargando historial...
            </div>
          ) : consultations.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-slate-500">
              Aún no hay consultas registradas para tu cuenta.
            </div>
          ) : (
            consultations.map((consultation) => (
              <div key={consultation.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-lg font-bold text-slate-950">{consultation.reason ?? 'Consulta médica'}</p>
                    <p className="text-sm text-slate-600">
                      {consultation.consultationDate?.seconds
                        ? new Date(consultation.consultationDate.seconds * 1000).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'Sin fecha registrada'}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                      {consultation.notes ?? 'Sin notas clínicas registradas.'}
                    </p>
                  </div>
                  <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                    {consultation.status ?? 'consulta'}
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
