'use client';

import Link from 'next/link';
import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { Phone, Mail, MapPin, Send, ArrowRight, Clock3, ShieldCheck } from 'lucide-react';
import { PODOMEDIC_WHATSAPP_NUMBER, buildWhatsAppUrl } from '@/lib/contact';
import { functions } from '@/lib/firebase';

export default function Contact() {
  const mapsEmbedUrl =
    'https://www.google.com/maps?q=20.0336346,-98.796654&z=17&output=embed';
  const mapsDirectionsUrl =
    'https://www.google.com/maps/search/?api=1&query=20.0336346,-98.796654';

  const [form, setForm] = useState(() => {
    const prefilledMessage =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('message') ?? ''
        : '';

    return { name: '', email: '', message: prefilledMessage, acceptedPolicies: true };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!functions) {
      setError('No se pudo conectar con Firebase Functions.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const submitContactMessage = httpsCallable<
        { name: string; email: string; message: string },
        { emailSent?: boolean }
      >(functions, 'submitContactMessage');
      const response = await submitContactMessage({
        name: form.name,
        email: form.email,
        message: form.message,
      });
      setSubmitted(true);
      setSuccessMessage(
        response.data.emailSent
          ? 'Recibimos tu mensaje correctamente y enviamos una notificación al correo de contacto.'
          : 'Recibimos tu mensaje correctamente. Quedó guardado para seguimiento.',
      );
      setForm({ name: '', email: '', message: '', acceptedPolicies: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No fue posible enviar tu mensaje.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-[linear-gradient(180deg,#f8fbff_0%,#eef8fb_46%,#ffffff_100%)] px-4 pb-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <section className="grid gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div>
            <span className="inline-flex rounded-full border border-cyan-100 bg-white/80 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700 shadow-sm backdrop-blur-sm">
              Contacto
            </span>
            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Estamos aquí para orientarte antes de tu consulta de podología en Pachuca.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
              Escríbenos si tienes dudas sobre tratamientos, disponibilidad o el tipo de atención podológica que necesitas en Pachuca.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm">
                <Phone className="h-7 w-7 text-cyan-600" />
                <p className="mt-4 text-lg font-black text-slate-950">Respuesta cercana</p>
                <p className="mt-1 text-sm text-slate-600">Atención humana desde el primer contacto.</p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm">
                <ShieldCheck className="h-7 w-7 text-blue-600" />
                <p className="mt-4 text-lg font-black text-slate-950">Orientación clara</p>
                <p className="mt-1 text-sm text-slate-600">Te ayudamos a identificar la mejor opción.</p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm">
                <Clock3 className="h-7 w-7 text-teal-600" />
                <p className="mt-4 text-lg font-black text-slate-950">Agilidad</p>
                <p className="mt-1 text-sm text-slate-600">Te respondemos para ayudarte a avanzar rápido.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-cyan-100 bg-slate-950 p-8 text-white shadow-[0_28px_80px_rgba(15,23,42,0.18)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">Información de contacto</p>
            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <Phone className="mt-1 h-5 w-5 text-teal-300" />
                <div>
                  <p className="font-semibold text-white">WhatsApp</p>
                  <p className="text-white/70">771 962 5242</p>
                  <a
                    href={buildWhatsAppUrl('Hola, me gustaría recibir información en PodoMedic.')}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex text-sm font-semibold text-cyan-200 transition-colors hover:text-cyan-100"
                  >
                    Abrir WhatsApp
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <Mail className="mt-1 h-5 w-5 text-cyan-300" />
                <div>
                  <p className="font-semibold text-white">Email</p>
                  <p className="text-white/70">contacto@podologapachuca.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <MapPin className="mt-1 h-5 w-5 text-emerald-300" />
                <div>
                  <p className="font-semibold text-white">Dirección</p>
                  <p className="text-white/70">Av. La Principal 10, Real de Toledo. Segundo Piso. Arriba de Laboratorios Coahuila, Pachuca de Soto, Hidalgo</p>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-[1.75rem] bg-white/6 p-6">
              <h3 className="text-xl font-bold text-white">Horarios de atención</h3>
              <div className="mt-4 space-y-2 text-white/70">
                <p>Lunes a viernes: 11:00 a.m. - 7:00 p.m.</p>
                <p>Sábados: 10:00 a.m. - 2:00 p.m.</p>
              </div>
              <Link href="/booking" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 transition-colors hover:text-cyan-100">
                Reservar cita
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-4xl rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-[0_28px_90px_rgba(15,23,42,0.08)] sm:p-10">
          <h2 className="text-3xl font-black text-slate-950">Envíanos un mensaje</h2>
          <p className="mt-2 text-slate-600">Cuéntanos tu duda y te orientaremos con la mejor opción.</p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {submitted && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Nombre</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Mensaje</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                rows={5}
                required
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
              className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-4 font-semibold text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-5 w-5" />
              {loading ? 'Enviando mensaje...' : 'Enviar Mensaje'}
            </button>
            <a
              href={`https://wa.me/${PODOMEDIC_WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-6 py-4 font-semibold text-cyan-700 transition-all hover:bg-cyan-100"
            >
              <Phone className="h-5 w-5" />
              Continuar por WhatsApp
            </a>
          </form>
        </div>

        <section className="mx-auto mt-10 max-w-4xl rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-[0_28px_90px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-3xl font-black text-slate-950">Cómo llegar</h2>
              <p className="mt-2 max-w-2xl text-slate-600">
                Encuéntranos en Av. La Principal 10, Real de Toledo, segundo piso, arriba de Laboratorios Coahuila.
              </p>
            </div>
            <a
              href={mapsDirectionsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-5 py-3 text-sm font-semibold text-cyan-700 transition-all hover:bg-cyan-100"
            >
              <MapPin className="h-4 w-4" />
              Abrir en Google Maps
            </a>
          </div>

          <div className="mt-6 overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-100">
            <iframe
              title="Ubicación de PodoMedic en Google Maps"
              src={mapsEmbedUrl}
              className="h-[420px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </section>
      </div>
    </div>
  );
}
