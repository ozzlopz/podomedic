'use client';

import Link from 'next/link';
import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { Calendar, Clock, User, Mail, MessageSquare, CheckCircle, ArrowRight, ShieldCheck, Stethoscope, ChevronLeft, ChevronRight } from 'lucide-react';
import { functions } from '@/lib/firebase';

const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;
const monthLabels = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

const weekdayTimeSlots = ['11:00', '12:00', '13:00', '16:00', '17:00', '18:00'] as const;
const saturdayTimeSlots = ['10:00', '11:00', '12:00', '13:00'] as const;

function formatDateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function normalizeDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export default function Booking() {
  const [form, setForm] = useState({ name: '', email: '', date: '', time: '', message: '', acceptedPolicies: true });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [displayedMonth, setDisplayedMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const today = normalizeDate(new Date());
  const monthStart = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth(), 1);
  const calendarStartOffset = (monthStart.getDay() + 6) % 7;
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(monthStart.getDate() - calendarStartOffset);

  const selectedDate = form.date ? normalizeDate(new Date(`${form.date}T00:00:00`)) : null;
  const selectedDay = selectedDate?.getDay();
  const availableTimeSlots =
    selectedDay === 6 ? saturdayTimeSlots : selectedDay === 0 || !selectedDate ? [] : weekdayTimeSlots;

  const calendarDays = Array.from({ length: 35 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });

  const handleDateSelect = (date: Date) => {
    const nextDate = formatDateValue(date);
    setForm((current) => ({
      ...current,
      date: nextDate,
      time: current.date === nextDate ? current.time : '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!functions) {
      setError('No se pudo conectar con Firebase Functions.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const createAppointment = httpsCallable(functions, 'createBookingAppointment');
      await createAppointment({
        name: form.name,
        email: form.email,
        date: form.date,
        time: form.time,
        message: form.message,
      });
      setSubmitted(true);
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'No fue posible registrar tu cita.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex-1 bg-[linear-gradient(180deg,#f8fbff_0%,#edf8fb_100%)] px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="overflow-hidden rounded-[2.5rem] border border-emerald-100 bg-white p-10 text-center shadow-[0_28px_80px_rgba(15,23,42,0.08)]">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <h1 className="mt-6 text-4xl font-black text-slate-950">¡Cita reservada!</h1>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-slate-600">
              Hemos recibido tu solicitud. Te contactaremos pronto para confirmar los detalles.
            </p>
            <Link href="/" className="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-950 px-7 py-3 font-semibold text-white transition-all hover:bg-slate-800">
              Volver al Inicio
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[linear-gradient(180deg,#f8fbff_0%,#eef8fb_48%,#ffffff_100%)] px-4 pb-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <section className="grid gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
          <div>
            <span className="inline-flex rounded-full border border-cyan-100 bg-white/80 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700 shadow-sm backdrop-blur-sm">
              Reserva tu cita
            </span>
            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Agenda una consulta de podología en Pachuca con una experiencia más clara y profesional.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
              Completa el formulario y te contactaremos para confirmar fecha, hora y detalles de tu atención podológica en Pachuca.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm">
                <Calendar className="h-7 w-7 text-cyan-600" />
                <p className="mt-4 text-lg font-black text-slate-950">Confirmación</p>
                <p className="mt-1 text-sm text-slate-600">Te contactamos para validar tu solicitud.</p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm">
                <ShieldCheck className="h-7 w-7 text-blue-600" />
                <p className="mt-4 text-lg font-black text-slate-950">Atención segura</p>
                <p className="mt-1 text-sm text-slate-600">Tratamientos con enfoque médico y preventivo.</p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm">
                <Stethoscope className="h-7 w-7 text-teal-600" />
                <p className="mt-4 text-lg font-black text-slate-950">Valoración clínica</p>
                <p className="mt-1 text-sm text-slate-600">Revisamos tu caso antes de intervenir.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-cyan-100 bg-slate-950 p-8 text-white shadow-[0_28px_80px_rgba(15,23,42,0.18)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">Antes de agendar</p>
            <h2 className="mt-4 text-3xl font-black">Información útil para tu visita</h2>
            <div className="mt-8 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">Indica tu molestia principal</p>
                <p className="mt-1 text-sm text-white/70">Así preparamos mejor la valoración inicial.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">Elige horario estimado</p>
                <p className="mt-1 text-sm text-white/70">Te propondremos la mejor disponibilidad posible.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">Consulta personalizada</p>
                <p className="mt-1 text-sm text-white/70">Tu cita se adapta a tu situación clínica.</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-4xl rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-[0_28px_90px_rgba(15,23,42,0.08)] sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-7">
            <div className="mb-2">
              <h2 className="text-3xl font-black text-slate-950">Datos para tu cita</h2>
              <p className="mt-2 text-slate-600">Completa los campos y nos pondremos en contacto contigo.</p>
            </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <User className="h-4 w-4" />
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Mail className="h-4 w-4" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <input type="hidden" value={form.date} required readOnly name="preferredDate" />
                <input type="hidden" value={form.time} required readOnly name="preferredTime" />
                <div className="rounded-[2rem] border border-slate-200 bg-slate-50/70 p-5">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <Calendar className="h-4 w-4" />
                        Fecha Preferida
                      </label>
                      <p className="mt-1 text-sm text-slate-500">Selecciona un día disponible para tu consulta.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setDisplayedMonth(
                            (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1)
                          )
                        }
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-cyan-200 hover:text-cyan-700"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDisplayedMonth(
                            (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1)
                          )
                        }
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-cyan-200 hover:text-cyan-700"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-white bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <p className="text-lg font-bold text-slate-950">
                        {monthLabels[displayedMonth.getMonth()]} {displayedMonth.getFullYear()}
                      </p>
                      {selectedDate && (
                        <p className="text-sm font-medium text-cyan-700">
                          {selectedDate.toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {dayLabels.map((label) => (
                        <span key={label}>{label}</span>
                      ))}
                    </div>

                    <div className="mt-3 grid grid-cols-7 gap-2">
                      {calendarDays.map((date) => {
                        const normalizedDate = normalizeDate(date);
                        const isCurrentMonth = date.getMonth() === displayedMonth.getMonth();
                        const isPast = normalizedDate < today;
                        const isSunday = date.getDay() === 0;
                        const isDisabled = !isCurrentMonth || isPast || isSunday;
                        const isSelected =
                          selectedDate && normalizedDate.getTime() === selectedDate.getTime();

                        return (
                          <button
                            key={date.toISOString()}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => handleDateSelect(date)}
                            className={`aspect-square rounded-2xl text-sm font-semibold transition ${
                              isSelected
                                ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/15'
                                : isDisabled
                                  ? 'cursor-not-allowed bg-slate-100/60 text-slate-300'
                                  : 'bg-slate-50 text-slate-700 hover:bg-cyan-50 hover:text-cyan-700'
                            }`}
                          >
                            {date.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-slate-50/70 p-5">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Clock className="h-4 w-4" />
                    Hora Preferida
                  </label>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedDate
                      ? 'Elige un horario sugerido y te confirmaremos disponibilidad.'
                      : 'Primero selecciona una fecha para ver horarios.'}
                  </p>

                  <div className="mt-5 rounded-[1.5rem] border border-white bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-lg font-bold text-slate-950">Horarios disponibles</p>
                      {selectedDate && (
                        <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                          {selectedDay === 6 ? 'Sábado' : 'Lun-Vie'}
                        </span>
                      )}
                    </div>

                    {selectedDate ? (
                      availableTimeSlots.length > 0 ? (
                        <div className="mt-5 grid grid-cols-2 gap-3">
                          {availableTimeSlots.map((slot) => {
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
                          })}
                        </div>
                      ) : (
                        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                          No hay horarios configurados para ese día.
                        </div>
                      )
                    ) : (
                      <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                        Selecciona una fecha para habilitar el picker de hora.
                      </div>
                    )}
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-950 px-4 py-3 text-sm text-white/80">
                    Horario del consultorio: lunes a viernes de 11:00 a.m. a 7:00 p.m. y sábados de 10:00 a.m. a 2:00 p.m.
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <MessageSquare className="h-4 w-4" />
                  Motivo de la Consulta (Opcional)
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  rows={4}
                  placeholder="Describe brevemente tu problema o consulta..."
                />
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={form.acceptedPolicies}
                  onChange={(e) => setForm({ ...form, acceptedPolicies: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  required
                />
                <span>
                  He leído y acepto el{' '}
                  <Link href="/aviso-de-privacidad" className="font-semibold text-cyan-700 transition-colors hover:text-cyan-600">
                    Aviso de Privacidad
                  </Link>{' '}
                  y los{' '}
                  <Link href="/terminos-y-condiciones" className="font-semibold text-cyan-700 transition-colors hover:text-cyan-600">
                    Términos y Condiciones
                  </Link>
                  .
                </span>
              </label>

              {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-4 text-lg font-semibold text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Calendar className="h-5 w-5" />
                {loading ? 'Registrando cita...' : 'Reservar Cita'}
              </button>
          </form>

          <div className="mt-8 text-center text-slate-600">
            <p>
              ¿Tienes preguntas?{' '}
              <Link href="/contact" className="font-semibold text-cyan-700 transition-colors hover:text-cyan-600">
                Contáctanos
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
