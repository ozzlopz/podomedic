'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Clock3, FileCheck2, Search } from 'lucide-react';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';

type AppointmentEntry = {
  id: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  scheduledAt?: { seconds?: number };
  source?: 'booking' | 'admin';
};

type AppointmentFilter = 'all' | 'upcoming' | 'completed' | 'cancelled' | 'pending';

export default function CustomerAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<AppointmentFilter>('all');

  useEffect(() => {
    const loadAppointments = async () => {
      if (!db || !user) {
        setLoading(false);
        return;
      }

      try {
        const snapshot = await getDocs(
          query(collection(db, 'appointments'), where('userId', '==', user.uid), orderBy('scheduledAt', 'desc')),
        );
        setAppointments(
          snapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data(),
          })) as AppointmentEntry[],
        );
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [user]);

  const upcomingCount = useMemo(
    () =>
      appointments.filter((appointment) => {
        if (!appointment.scheduledAt?.seconds) return false;
        return appointment.scheduledAt.seconds * 1000 >= Date.now();
      }).length,
    [appointments],
  );
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const appointmentTime = appointment.scheduledAt?.seconds ? appointment.scheduledAt.seconds * 1000 : null;
      const matchesFilter =
        filterBy === 'all'
          ? true
          : filterBy === 'upcoming'
            ? Boolean(appointmentTime && appointmentTime >= Date.now())
            : (appointment.status ?? 'pending') === filterBy;

      const searchableText = [
        appointment.source,
        appointment.status,
        appointment.scheduledAt?.seconds
          ? new Date(appointment.scheduledAt.seconds * 1000).toLocaleString('es-MX')
          : '',
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = normalizedSearch ? searchableText.includes(normalizedSearch) : true;

      return matchesFilter && matchesSearch;
    });
  }, [appointments, filterBy, normalizedSearch]);
  const filterChips: Array<{ value: AppointmentFilter; label: string; count: number }> = [
    { value: 'all', label: 'Todas', count: appointments.length },
    { value: 'upcoming', label: 'Próximas', count: upcomingCount },
    {
      value: 'pending',
      label: 'Pendientes',
      count: appointments.filter((appointment) => (appointment.status ?? 'pending') === 'pending').length,
    },
    {
      value: 'completed',
      label: 'Completadas',
      count: appointments.filter((appointment) => appointment.status === 'completed').length,
    },
    {
      value: 'cancelled',
      label: 'Canceladas',
      count: appointments.filter((appointment) => appointment.status === 'cancelled').length,
    },
  ];

  return (
    <div className="space-y-8">
      <section>
        <span className="inline-flex rounded-full border border-cyan-100 bg-white/80 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700 shadow-sm backdrop-blur-sm">
          Mis citas
        </span>
        <h1 className="mt-6 text-4xl font-black text-slate-950 sm:text-5xl">Fechas de tus citas</h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">
          Revisa tus citas programadas y el estado actual de cada una.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <CalendarDays className="h-7 w-7 text-cyan-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">{loading ? '...' : appointments.length}</p>
          <p className="mt-1 text-sm text-slate-600">Citas totales</p>
        </div>
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <Clock3 className="h-7 w-7 text-blue-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">{loading ? '...' : upcomingCount}</p>
          <p className="mt-1 text-sm text-slate-600">Próximas citas</p>
        </div>
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <FileCheck2 className="h-7 w-7 text-teal-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">
            {loading ? '...' : appointments.filter((appointment) => appointment.status === 'completed').length}
          </p>
          <p className="mt-1 text-sm text-slate-600">Citas completadas</p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-950">Listado de citas</h2>
            <p className="mt-2 text-slate-600">Busca por fecha o filtra por estado para ubicar una cita más rápido.</p>
          </div>
          <label className="relative block w-full max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar cita"
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {filterChips.map((chip) => {
            const isActive = filterBy === chip.value;

            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => setFilterBy(chip.value)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-slate-950 text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)]'
                    : 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-cyan-200 hover:text-cyan-700'
                }`}
              >
                <span>{chip.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${isActive ? 'bg-white/15 text-white' : 'bg-white text-slate-500'}`}>
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-500">Cargando citas...</div>
          ) : appointments.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-slate-500">
              Aún no tienes citas registradas.
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-slate-500">
              No encontramos citas que coincidan con tus filtros.
            </div>
          ) : (
            filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-bold text-slate-950">
                      {appointment.scheduledAt?.seconds
                        ? new Date(appointment.scheduledAt.seconds * 1000).toLocaleString('es-MX')
                        : 'Sin fecha registrada'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">Origen: {appointment.source ?? 'booking'}</p>
                  </div>
                  <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                    {appointment.status ?? 'pending'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
        <Link
          href="/booking"
          className="mt-6 inline-flex items-center rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Solicitar otra cita
        </Link>
      </section>
    </div>
  );
}
