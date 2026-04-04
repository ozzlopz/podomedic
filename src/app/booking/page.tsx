'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Calendar, Clock, User, Mail, MessageSquare, CheckCircle, ArrowRight, ShieldCheck, Stethoscope } from 'lucide-react';

export default function Booking() {
  const [form, setForm] = useState({ name: '', email: '', date: '', time: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle booking
    setSubmitted(true);
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
              Agenda una consulta con una experiencia más clara y profesional.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
              Completa el formulario y te contactaremos para confirmar fecha, hora y detalles de tu atención podológica.
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

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Calendar className="h-4 w-4" />
                    Fecha Preferida
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Clock className="h-4 w-4" />
                    Hora Preferida
                  </label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                    required
                  />
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

              <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-4 text-lg font-semibold text-white transition-all hover:bg-slate-800">
                <Calendar className="h-5 w-5" />
                Reservar Cita
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
