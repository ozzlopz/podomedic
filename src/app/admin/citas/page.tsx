'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { ArrowRight, BadgeCheck, CalendarDays, Clock3, PlusCircle } from 'lucide-react';
import { db, functions } from '@/lib/firebase';

type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

type Appointment = {
  id: string;
  userId?: string;
  patientName?: string;
  patientEmail?: string;
  reason?: string;
  status?: AppointmentStatus;
  source?: 'booking' | 'admin';
  scheduledAt?: { seconds?: number };
};

type Patient = {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
};

const initialForm = {
  patientId: '',
  date: '',
  time: '',
  reason: '',
  notes: '',
  status: 'confirmed' as AppointmentStatus,
};

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [form, setForm] = useState(initialForm);

  const loadAppointments = async () => {
    if (!db) {
      setError('No se pudo conectar con Firestore.');
      setLoading(false);
      return;
    }

    try {
      const [appointmentsSnapshot, patientsSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'appointments'), orderBy('scheduledAt', 'desc'))),
        getDocs(query(collection(db, 'users'), where('role', '==', 'customer'))),
      ]);

      setAppointments(
        appointmentsSnapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        })) as Appointment[],
      );
      setPatients(
        (patientsSnapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        })) as Patient[]).sort((left, right) =>
          `${left.first_name ?? ''} ${left.last_name ?? ''}`.localeCompare(
            `${right.first_name ?? ''} ${right.last_name ?? ''}`,
            'es',
          ),
        ),
      );
      setError('');
    } catch {
      setError('No fue posible cargar la agenda del consultorio.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleCreateAppointment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!functions) {
      setSubmitError('No se pudo conectar con Firebase Functions.');
      return;
    }

    const selectedPatient = patients.find((patient) => patient.id === form.patientId);

    if (!selectedPatient) {
      setSubmitError('Selecciona un paciente válido.');
      return;
    }

    setCreating(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      const createAppointment = httpsCallable(functions, 'createAdminAppointment');
      await createAppointment({
        patientId: selectedPatient.id,
        patientName: [selectedPatient.first_name, selectedPatient.last_name].filter(Boolean).join(' '),
        patientEmail: selectedPatient.email ?? '',
        date: form.date,
        time: form.time,
        reason: form.reason,
        notes: form.notes,
        status: form.status,
      });

      setSubmitSuccess('Cita creada correctamente.');
      setForm(initialForm);
      await loadAppointments();
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : 'No fue posible crear la cita.';
      setSubmitError(message);
    } finally {
      setCreating(false);
    }
  };

  const todayAppointments = appointments.filter((appointment) => {
    if (!appointment.scheduledAt?.seconds) return false;
    const appointmentDate = new Date(appointment.scheduledAt.seconds * 1000);
    const today = new Date();
    return (
      appointmentDate.getFullYear() === today.getFullYear() &&
      appointmentDate.getMonth() === today.getMonth() &&
      appointmentDate.getDate() === today.getDate()
    );
  }).length;

  const pendingAppointments = appointments.filter((appointment) => appointment.status === 'pending').length;
  const confirmedAppointments = appointments.filter((appointment) => appointment.status === 'confirmed').length;

  return (
    <div className="space-y-8">
      <section>
        <span className="inline-flex rounded-full border border-cyan-100 bg-white/80 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700 shadow-sm backdrop-blur-sm">
          Citas
        </span>
        <h1 className="mt-6 text-4xl font-black text-slate-950 sm:text-5xl">Agenda del consultorio</h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">
          Visualiza solicitudes del sitio, crea citas manuales y mantén el control del flujo clínico.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <CalendarDays className="h-7 w-7 text-cyan-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">{loading ? '...' : todayAppointments}</p>
          <p className="mt-1 text-sm text-slate-600">Citas programadas hoy</p>
        </div>
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <Clock3 className="h-7 w-7 text-blue-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">{loading ? '...' : pendingAppointments}</p>
          <p className="mt-1 text-sm text-slate-600">Pendientes de confirmar</p>
        </div>
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <BadgeCheck className="h-7 w-7 text-teal-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">{loading ? '...' : confirmedAppointments}</p>
          <p className="mt-1 text-sm text-slate-600">Confirmadas</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <h2 className="text-2xl font-black text-slate-950">Agenda general</h2>
          <div className="mt-6 space-y-4">
            {loading && (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-500">
                Cargando citas...
              </div>
            )}

            {!loading && error && (
              <div className="rounded-3xl border border-red-100 bg-red-50 p-5 text-red-600">{error}</div>
            )}

            {!loading && !error && appointments.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-slate-500">
                Aún no hay citas registradas.
              </div>
            )}

            {!loading &&
              !error &&
              appointments.map((appointment) => (
                <Link
                  key={appointment.id}
                  href={`/admin/citas/${appointment.id}`}
                  className="block rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-cyan-200 hover:bg-cyan-50/40"
                >
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <p className="text-lg font-bold text-slate-950">{appointment.patientName ?? 'Paciente sin nombre'}</p>
                      <p className="text-sm text-slate-600">{appointment.reason ?? 'Sin motivo registrado'}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">
                        {appointment.patientEmail ?? 'Sin correo'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                        {appointment.scheduledAt?.seconds
                          ? new Date(appointment.scheduledAt.seconds * 1000).toLocaleString('es-MX')
                          : 'Sin fecha'}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                          appointment.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : appointment.status === 'completed'
                              ? 'bg-cyan-100 text-cyan-700'
                              : appointment.status === 'cancelled'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {appointment.status ?? 'pending'}
                      </span>
                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">
                        {appointment.source ?? 'admin'}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                        Ver detalle
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>

        <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-950">Nueva cita</h2>
              <p className="mt-2 text-slate-600">
                Crea una cita manual y átalas al paciente correcto desde el back office.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateAppointment} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Paciente</span>
              <select
                required
                value={form.patientId}
                onChange={(event) => setForm((current) => ({ ...current, patientId: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              >
                <option value="">Selecciona un paciente</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {[patient.first_name, patient.last_name].filter(Boolean).join(' ') || patient.email}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Fecha</span>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Hora</span>
                <input
                  type="time"
                  required
                  value={form.time}
                  onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Motivo</span>
              <input
                required
                value={form.reason}
                onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                placeholder="Ej. Control general"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Estado inicial</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as AppointmentStatus,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                >
                  <option value="confirmed">Confirmada</option>
                  <option value="pending">Pendiente</option>
                  <option value="completed">Completada</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Notas</span>
                <input
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  placeholder="Observaciones opcionales"
                />
              </label>
            </div>

            {submitError && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {submitError}
              </div>
            )}

            {submitSuccess && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {submitSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={creating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PlusCircle className="h-4 w-4" />
              {creating ? 'Creando cita...' : 'Crear cita'}
            </button>
          </form>
        </section>
      </section>
    </div>
  );
}
