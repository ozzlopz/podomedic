'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { collection, doc, getDoc, getDocs, orderBy, query, setDoc, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { ArrowRight, BadgeCheck, CalendarDays, Clock3, Lock, PlusCircle, Unlock } from 'lucide-react';
import { db, functions } from '@/lib/firebase';
import { addMinutesToTime, defaultWeeklySchedule, extractScheduledDateAndTime, getAvailableSlotsForDay, mergeWeeklySchedule, type TimeRange, type WeeklySchedule } from '@/lib/booking';

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
  scheduledDate?: string;
  scheduledTime?: string;
};

type Patient = {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
};

type AppointmentBlock = {
  id: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  time?: string;
  reason?: string;
};

const dayLabelsByKey: Record<string, string> = {
  '0': 'Domingo',
  '1': 'Lunes',
  '2': 'Martes',
  '3': 'Miércoles',
  '4': 'Jueves',
  '5': 'Viernes',
  '6': 'Sábado',
};

const initialForm = {
  patientId: '',
  date: '',
  time: '',
  reason: '',
  notes: '',
  status: 'confirmed' as AppointmentStatus,
};

const initialBlockForm = {
  date: '',
  startTime: '',
  endTime: '',
  reason: '',
};

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [blocks, setBlocks] = useState<AppointmentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [removingBlockId, setRemovingBlockId] = useState('');
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [blockError, setBlockError] = useState('');
  const [blockSuccess, setBlockSuccess] = useState('');
  const [schedule, setSchedule] = useState<WeeklySchedule>(defaultWeeklySchedule);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleSuccess, setScheduleSuccess] = useState('');
  const [form, setForm] = useState(initialForm);
  const [blockForm, setBlockForm] = useState(initialBlockForm);

  const loadAppointments = async () => {
    if (!db) {
      setError('No se pudo conectar con Firestore.');
      setLoading(false);
      return;
    }

    try {
      const [appointmentsSnapshot, patientsSnapshot, blocksSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'appointments'), orderBy('scheduledAt', 'desc'))),
        getDocs(query(collection(db, 'users'), where('role', '==', 'customer'))),
        getDocs(collection(db, 'appointment_blocks')),
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
      setBlocks(
        (blocksSnapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        })) as AppointmentBlock[]).sort((left, right) =>
          `${left.date ?? ''} ${left.startTime ?? left.time ?? ''}`.localeCompare(
            `${right.date ?? ''} ${right.startTime ?? right.time ?? ''}`,
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

  const loadSchedule = async () => {
    if (!db) {
      setScheduleLoading(false);
      return;
    }

    try {
      const scheduleSnapshot = await getDoc(doc(db, 'booking_settings', 'schedule'));
      setSchedule(mergeWeeklySchedule((scheduleSnapshot.data()?.days as Partial<WeeklySchedule> | undefined) ?? undefined));
      setScheduleError('');
    } catch {
      setScheduleError('No fue posible cargar el horario semanal.');
    } finally {
      setScheduleLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    loadSchedule();
  }, []);

  const getExclusionRangesForDate = useCallback((dateValue: string): TimeRange[] => {
    const appointmentRanges = appointments.flatMap<TimeRange>((appointment) => {
      const scheduled = extractScheduledDateAndTime(appointment);

      if (scheduled.date !== dateValue || (appointment.status ?? 'pending') === 'cancelled' || !scheduled.time) {
        return [];
      }

      return [{
        startTime: scheduled.time,
        endTime: addMinutesToTime(scheduled.time, 90),
      }];
    });

    const blockRanges = blocks.flatMap<TimeRange>((block) => {
      if (block.date !== dateValue) {
        return [];
      }

      const startTime = block.startTime ?? block.time;
      const endTime = block.endTime ?? (block.time ? addMinutesToTime(block.time, 90) : '');

      return startTime && endTime ? [{ startTime, endTime }] : [];
    });

    return [...appointmentRanges, ...blockRanges];
  }, [appointments, blocks]);

  const appointmentSlots = useMemo(
    () =>
      form.date
        ? getAvailableSlotsForDay(new Date(`${form.date}T00:00:00`).getDay(), getExclusionRangesForDate(form.date), schedule)
        : [],
    [form.date, getExclusionRangesForDate, schedule],
  );
  const blockPreviewSlots = useMemo(
    () =>
      blockForm.date
        ? getAvailableSlotsForDay(new Date(`${blockForm.date}T00:00:00`).getDay(), getExclusionRangesForDate(blockForm.date), schedule)
        : [],
    [blockForm.date, getExclusionRangesForDate, schedule],
  );

  useEffect(() => {
    if (form.time && !appointmentSlots.includes(form.time)) {
      setForm((current) => ({ ...current, time: '' }));
    }
  }, [appointmentSlots, form.time]);

  useEffect(() => {
    if (blockForm.startTime && !blockPreviewSlots.includes(blockForm.startTime)) {
      setBlockForm((current) => ({ ...current, startTime: '' }));
    }
  }, [blockForm.startTime, blockPreviewSlots]);

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

  const handleCreateBlock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!functions) {
      setBlockError('No se pudo conectar con Firebase Functions.');
      return;
    }

    setBlocking(true);
    setBlockError('');
    setBlockSuccess('');

    try {
      const createAppointmentBlock = httpsCallable(functions, 'createAppointmentBlock');
      await createAppointmentBlock(blockForm);
      setBlockSuccess('Horario bloqueado correctamente.');
      setBlockForm(initialBlockForm);
      await loadAppointments();
    } catch (createBlockError) {
      const message =
        createBlockError instanceof Error ? createBlockError.message : 'No fue posible bloquear el horario.';
      setBlockError(message);
    } finally {
      setBlocking(false);
    }
  };

  const handleRemoveBlock = async (blockId: string) => {
    if (!functions) {
      setBlockError('No se pudo conectar con Firebase Functions.');
      return;
    }

    setRemovingBlockId(blockId);
    setBlockError('');
    setBlockSuccess('');

    try {
      const removeAppointmentBlock = httpsCallable(functions, 'removeAppointmentBlock');
      await removeAppointmentBlock({ blockId });
      setBlockSuccess('Horario desbloqueado correctamente.');
      await loadAppointments();
    } catch (removeBlockError) {
      const message =
        removeBlockError instanceof Error ? removeBlockError.message : 'No fue posible desbloquear el horario.';
      setBlockError(message);
    } finally {
      setRemovingBlockId('');
    }
  };

  const handleSaveSchedule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!db) {
      setScheduleError('No se pudo conectar con Firestore.');
      return;
    }

    const hasInvalidDay = Object.values(schedule).some(
      (dayConfig) => dayConfig.enabled && dayConfig.openTime >= dayConfig.closeTime,
    );

    if (hasInvalidDay) {
      setScheduleError('Cada día activo debe tener una hora de apertura anterior a la de cierre.');
      setScheduleSuccess('');
      return;
    }

    setSavingSchedule(true);
    setScheduleError('');
    setScheduleSuccess('');

    try {
      await setDoc(
        doc(db, 'booking_settings', 'schedule'),
        {
          days: schedule,
          updatedAt: new Date(),
        },
        { merge: true },
      );
      setScheduleSuccess('Horario semanal actualizado correctamente.');
    } catch {
      setScheduleError('No fue posible guardar el horario semanal.');
    } finally {
      setSavingSchedule(false);
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

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <PlusCircle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-950">Nueva cita</h2>
                <p className="mt-2 text-slate-600">
                  Crea una cita manual con bloques de 90 minutos y solo en horarios realmente disponibles.
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

              <div>
                <span className="text-sm font-semibold text-slate-700">Bloque horario</span>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {appointmentSlots.length > 0 ? (
                    appointmentSlots.map((slot) => {
                      const isSelected = form.time === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setForm((current) => ({ ...current, time: slot }))}
                          className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                            isSelected
                              ? 'border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-950/15'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })
                  ) : (
                    <div className="col-span-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                      Selecciona una fecha laborable para ver los bloques disponibles.
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs text-slate-500">Cada cita ocupa 90 minutos.</p>
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
                disabled={creating || !form.time}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PlusCircle className="h-4 w-4" />
                {creating ? 'Creando cita...' : 'Crear cita'}
              </button>
            </form>
          </section>

          <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-950">Bloquear horarios</h2>
                <p className="mt-2 text-slate-600">
                  Usa esta sección para cerrar horas específicas cuando no quieras que aparezcan en el booking público.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateBlock} className="mt-8 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Fecha a bloquear</span>
                <input
                  type="date"
                  required
                  value={blockForm.date}
                  onChange={(event) => setBlockForm((current) => ({ ...current, date: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                />
              </label>

              <div>
                <span className="text-sm font-semibold text-slate-700">Huecos actuales del día</span>
                <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  {blockForm.date ? (
                    blockPreviewSlots.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {blockPreviewSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() =>
                              setBlockForm((current) => ({
                                ...current,
                                startTime: slot,
                                endTime: current.endTime && current.endTime > slot ? current.endTime : addMinutesToTime(slot, 90),
                              }))
                            }
                            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    ) : (
                      'No quedan huecos configurables en esa fecha.'
                    )
                  ) : (
                    'Selecciona una fecha para ver los huecos disponibles antes de bloquear.'
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Inicio del bloqueo</span>
                  <input
                    type="time"
                    required
                    value={blockForm.startTime}
                    onChange={(event) => setBlockForm((current) => ({ ...current, startTime: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Fin del bloqueo</span>
                  <input
                    type="time"
                    required
                    value={blockForm.endTime}
                    onChange={(event) => setBlockForm((current) => ({ ...current, endTime: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Motivo del bloqueo</span>
                <input
                  value={blockForm.reason}
                  onChange={(event) => setBlockForm((current) => ({ ...current, reason: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  placeholder="Ej. Reunión, descanso, capacitación"
                />
              </label>

              {blockError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {blockError}
                </div>
              )}

              {blockSuccess && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {blockSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={blocking || !blockForm.startTime || !blockForm.endTime}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Lock className="h-4 w-4" />
                {blocking ? 'Bloqueando horario...' : 'Bloquear horario'}
              </button>
            </form>

            <div className="mt-8 space-y-3">
              <h3 className="text-lg font-bold text-slate-950">Horarios bloqueados</h3>
              {blocks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No hay horarios bloqueados por ahora.
                </div>
              ) : (
                blocks.map((block) => (
                  <div
                    key={block.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-950">
                        {block.date ?? 'Sin fecha'} · {block.startTime ?? block.time ?? 'Sin inicio'} - {block.endTime ?? (block.time ? addMinutesToTime(block.time, 90) : 'Sin fin')}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">{block.reason || 'Sin motivo especificado'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveBlock(block.id)}
                      disabled={removingBlockId === block.id}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Unlock className="h-4 w-4" />
                      {removingBlockId === block.id ? 'Desbloqueando...' : 'Desbloquear'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <h2 className="text-2xl font-black text-slate-950">Horario semanal</h2>
            <p className="mt-2 text-slate-600">
              Ajusta apertura y cierre por día. Si activas domingo, el booking público también podrá ofrecer citas ese día.
            </p>

            <form onSubmit={handleSaveSchedule} className="mt-8 space-y-4">
              {Object.entries(schedule).map(([dayKey, dayConfig]) => (
                <div
                  key={dayKey}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={dayConfig.enabled}
                      onChange={(event) =>
                        setSchedule((current) => ({
                          ...current,
                          [dayKey]: {
                            ...current[dayKey],
                            enabled: event.target.checked,
                          },
                        }))
                      }
                      className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="font-semibold text-slate-900">{dayLabelsByKey[dayKey]}</span>
                  </div>

                  <div className="mt-4 space-y-4">
                    <label className="block min-w-0">
                      <span className="text-sm font-semibold text-slate-700">Apertura</span>
                      <input
                        type="time"
                        value={dayConfig.openTime}
                        disabled={!dayConfig.enabled}
                        onChange={(event) =>
                          setSchedule((current) => ({
                            ...current,
                            [dayKey]: {
                              ...current[dayKey],
                              openTime: event.target.value,
                            },
                          }))
                        }
                        className="mt-2 block min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg text-slate-900 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                      />
                    </label>

                    <label className="block min-w-0">
                      <span className="text-sm font-semibold text-slate-700">Cierre</span>
                      <input
                        type="time"
                        value={dayConfig.closeTime}
                        disabled={!dayConfig.enabled}
                        onChange={(event) =>
                          setSchedule((current) => ({
                            ...current,
                            [dayKey]: {
                              ...current[dayKey],
                              closeTime: event.target.value,
                            },
                          }))
                        }
                        className="mt-2 block min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg text-slate-900 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                      />
                    </label>
                  </div>
                </div>
              ))}

              {scheduleLoading && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  Cargando horario semanal...
                </div>
              )}

              {scheduleError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {scheduleError}
                </div>
              )}

              {scheduleSuccess && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {scheduleSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={savingSchedule || scheduleLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingSchedule ? 'Guardando horario...' : 'Guardar horario semanal'}
              </button>
            </form>
          </section>
        </div>
      </section>
    </div>
  );
}
