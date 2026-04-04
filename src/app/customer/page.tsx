'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { CalendarClock, CalendarDays, FileText, Mail, TrendingUp, UserRound } from 'lucide-react';
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
  status?: string;
  consultationDate?: { seconds?: number };
};

type AppointmentEntry = {
  id: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  scheduledAt?: { seconds?: number };
};

export default function Customer() {
  const { user, profile } = useAuth();
  const [levels, setLevels] = useState<LevelEntry[]>([]);
  const [consultations, setConsultations] = useState<ConsultationEntry[]>([]);
  const [appointments, setAppointments] = useState<AppointmentEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      if (!db || !user) {
        setLoading(false);
        return;
      }

      try {
        const [levelsSnapshot, consultationsSnapshot, appointmentsSnapshot] = await Promise.all([
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
          getDocs(
            query(
              collection(db, 'appointments'),
              where('userId', '==', user.uid),
              orderBy('scheduledAt', 'asc'),
              limit(4),
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
        setAppointments(
          appointmentsSnapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data(),
          })) as AppointmentEntry[],
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user]);

  const lastLevel = levels[0];
  const nextAppointment = appointments.find((appointment) => {
    if (!appointment.scheduledAt?.seconds) return false;
    return appointment.scheduledAt.seconds * 1000 >= Date.now();
  });
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ');

  const nextAppointmentDate =
    nextAppointment?.scheduledAt?.seconds
      ? new Date(nextAppointment.scheduledAt.seconds * 1000).toLocaleString('es-MX')
      : 'Sin citas próximas';

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
          Consulta tus próximas fechas, revisa tu historial disponible y mantén a la mano tu información personal.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/customer/citas"
          className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-cyan-200"
        >
          <CalendarDays className="h-7 w-7 text-cyan-600" />
          <p className="mt-4 text-lg font-black text-slate-950">{loading ? '...' : appointments.length}</p>
          <p className="mt-1 text-sm text-slate-600">Citas visibles en tu cuenta.</p>
        </Link>
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
          <p className="mt-1 text-sm text-slate-600">Fechas de consultas registradas para ti.</p>
        </Link>
        <Link
          href="/customer/perfil"
          className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-cyan-200"
        >
          <UserRound className="h-7 w-7 text-indigo-600" />
          <p className="mt-4 text-lg font-black text-slate-950">Mi perfil</p>
          <p className="mt-1 text-sm text-slate-600">Revisa tu nombre, correo y teléfono registrados.</p>
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
              <p className="mt-4 text-sm uppercase tracking-[0.2em] text-white/45">Próxima cita</p>
              <p className="mt-2 text-lg font-semibold text-white">{nextAppointmentDate}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <h2 className="text-2xl font-black text-slate-950">Último registro de niveles</h2>
            <p className="mt-2 text-slate-600">Aquí solo mostramos la fecha de tu última captura, sin resumir datos clínicos.</p>
            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-lg font-bold text-slate-950">
                {lastLevel?.recordedAt?.seconds
                  ? new Date(lastLevel.recordedAt.seconds * 1000).toLocaleString('es-MX')
                  : 'Sin registros todavía'}
              </p>
              <p className="mt-2 text-sm text-slate-500">Si quieres revisar el detalle completo, entra a tu historial de niveles.</p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-950">Fechas de consultas</h2>
                <p className="mt-2 text-slate-600">Visualiza únicamente las fechas registradas de tus consultas.</p>
              </div>
              <Link href="/customer/historial-consultas" className="text-sm font-semibold text-cyan-700 hover:text-cyan-600">
                Ver historial
              </Link>
            </div>
            <div className="mt-6 space-y-4">
              {consultations.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-slate-500">
                  Aún no hay consultas registradas para tu cuenta.
                </div>
              ) : (
                consultations.map((consultation) => (
                  <Link
                    key={consultation.id}
                    href={`/customer/historial-consultas/${consultation.id}`}
                    className="block rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-cyan-200 hover:bg-cyan-50/40"
                  >
                    <p className="text-lg font-bold text-slate-950">Consulta registrada</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {consultation.consultationDate?.seconds
                        ? new Date(consultation.consultationDate.seconds * 1000).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'Sin fecha registrada'}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">Abre el detalle para ver el estado y la fecha completa.</p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
