'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, CalendarDays, FileText } from 'lucide-react';
import { db } from '@/lib/firebase';

type ConsultationEntry = {
  status?: string;
  consultationDate?: { seconds?: number };
};

export default function CustomerConsultationDetailPage() {
  const params = useParams<{ consultationId: string }>();
  const [consultation, setConsultation] = useState<ConsultationEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConsultation = async () => {
      if (!db) {
        setLoading(false);
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, 'consultations', params.consultationId));

        if (snapshot.exists()) {
          setConsultation(snapshot.data() as ConsultationEntry);
        }
      } finally {
        setLoading(false);
      }
    };

    loadConsultation();
  }, [params.consultationId]);

  return (
    <div className="space-y-8">
      <section>
        <Link
          href="/customer/historial-consultas"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a consultas
        </Link>
        <h1 className="mt-6 text-4xl font-black text-slate-950 sm:text-5xl">Detalle de consulta</h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">
          Esta vista solo muestra la fecha y el estado de la consulta registrada.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <CalendarDays className="h-7 w-7 text-cyan-600" />
          <p className="mt-4 text-sm uppercase tracking-[0.14em] text-slate-500">Fecha</p>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {loading
              ? 'Cargando...'
              : consultation?.consultationDate?.seconds
                ? new Date(consultation.consultationDate.seconds * 1000).toLocaleString('es-MX')
                : 'Sin fecha registrada'}
          </p>
        </div>
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <FileText className="h-7 w-7 text-blue-600" />
          <p className="mt-4 text-sm uppercase tracking-[0.14em] text-slate-500">Estado</p>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {loading ? 'Cargando...' : consultation?.status ?? 'consulta'}
          </p>
        </div>
      </section>
    </div>
  );
}
