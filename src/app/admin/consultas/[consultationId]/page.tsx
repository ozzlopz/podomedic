'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, CalendarDays, FileText, UserRound } from 'lucide-react';
import { db } from '@/lib/firebase';

type Consultation = {
  userId?: string;
  appointmentId?: string;
  reason?: string;
  notes?: string;
  status?: string;
  consultationDate?: { seconds?: number };
};

type Patient = {
  first_name?: string;
  last_name?: string;
  email?: string;
};

export default function ConsultationDetailPage() {
  const params = useParams<{ consultationId: string }>();
  const consultationId = params.consultationId;
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    consultationDate: '',
    reason: '',
    notes: '',
    status: 'seguimiento',
  });

  const loadConsultation = useCallback(async () => {
    if (!db) {
      setError('No se pudo conectar con Firestore.');
      setLoading(false);
      return;
    }

    try {
      const consultationSnapshot = await getDoc(doc(db, 'consultations', consultationId));

      if (!consultationSnapshot.exists()) {
        setError('No se encontró la consulta solicitada.');
        setLoading(false);
        return;
      }

      const consultationData = consultationSnapshot.data() as Consultation;
      setConsultation(consultationData);

      if (consultationData.userId) {
        const patientSnapshot = await getDoc(doc(db, 'users', consultationData.userId));
        if (patientSnapshot.exists()) {
          setPatient(patientSnapshot.data() as Patient);
        }
      }

      setForm({
        consultationDate: consultationData.consultationDate?.seconds
          ? new Date(consultationData.consultationDate.seconds * 1000).toISOString().slice(0, 16)
          : '',
        reason: consultationData.reason ?? '',
        notes: consultationData.notes ?? '',
        status: consultationData.status ?? 'seguimiento',
      });
      setError('');
    } catch {
      setError('No fue posible cargar el detalle de la consulta.');
    } finally {
      setLoading(false);
    }
  }, [consultationId]);

  useEffect(() => {
    loadConsultation();
  }, [loadConsultation]);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!db) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateDoc(doc(db, 'consultations', consultationId), {
        consultationDate: new Date(form.consultationDate),
        reason: form.reason.trim(),
        notes: form.notes.trim(),
        status: form.status,
      });
      setSuccess('Consulta actualizada correctamente.');
      await loadConsultation();
    } catch {
      setError('No fue posible actualizar la consulta.');
    } finally {
      setSaving(false);
    }
  };

  const patientName =
    [patient?.first_name, patient?.last_name].filter(Boolean).join(' ') ||
    patient?.email ||
    'Paciente sin nombre';

  return (
    <div className="space-y-8">
      <section>
        <Link
          href="/admin/consultas"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a consultas
        </Link>
        <h1 className="mt-6 text-4xl font-black text-slate-950 sm:text-5xl">Detalle de la consulta</h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">
          Edita la información clínica y navega rápidamente hacia la cita y paciente relacionados.
        </p>
      </section>

      {loading && (
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-slate-500 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          Cargando consulta...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-[2rem] border border-red-100 bg-red-50 p-8 text-red-600 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          {error}
        </div>
      )}

      {!loading && !error && consultation && (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
              <FileText className="h-7 w-7 text-cyan-600" />
              <p className="mt-4 text-2xl font-black text-slate-950">{consultation.reason ?? 'Consulta clínica'}</p>
              <p className="mt-1 text-sm text-slate-600">Motivo principal registrado</p>
            </div>
            <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
              <UserRound className="h-7 w-7 text-blue-600" />
              <p className="mt-4 text-2xl font-black text-slate-950">{patientName}</p>
              <p className="mt-1 text-sm text-slate-600">Paciente ligado a la consulta</p>
            </div>
            <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
              <CalendarDays className="h-7 w-7 text-teal-600" />
              <p className="mt-4 text-2xl font-black text-slate-950">{consultation.status ?? 'seguimiento'}</p>
              <p className="mt-1 text-sm text-slate-600">Estado clínico</p>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <div className="rounded-[2rem] border border-cyan-100 bg-slate-950 p-8 text-white shadow-[0_28px_80px_rgba(15,23,42,0.18)]">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">Relaciones</p>
              <div className="mt-8 space-y-4">
                {consultation.userId && (
                  <Link
                    href={`/admin/pacientes/${consultation.userId}`}
                    className="block rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-cyan-300/30 hover:bg-white/10"
                  >
                    <p className="text-sm uppercase tracking-[0.2em] text-white/45">Paciente</p>
                    <p className="mt-2 text-lg font-semibold text-white">{patientName}</p>
                  </Link>
                )}
                {consultation.appointmentId && (
                  <Link
                    href={`/admin/citas/${consultation.appointmentId}`}
                    className="block rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-cyan-300/30 hover:bg-white/10"
                  >
                    <p className="text-sm uppercase tracking-[0.2em] text-white/45">Cita ligada</p>
                    <p className="mt-2 break-all text-lg font-semibold text-white">{consultation.appointmentId}</p>
                  </Link>
                )}
              </div>
            </div>

            <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              <h2 className="text-2xl font-black text-slate-950">Editar consulta</h2>
              <form onSubmit={handleSave} className="mt-8 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Fecha de consulta</span>
                    <input
                      type="datetime-local"
                      required
                      value={form.consultationDate}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          consultationDate: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Estado</span>
                    <select
                      value={form.status}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          status: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                    >
                      <option value="seguimiento">Seguimiento</option>
                      <option value="valoracion">Valoración</option>
                      <option value="control">Control</option>
                    </select>
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Motivo</span>
                  <input
                    required
                    value={form.reason}
                    onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Notas clínicas</span>
                  <textarea
                    required
                    rows={6}
                    value={form.notes}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  />
                </label>

                {success && (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FileText className="h-4 w-4" />
                  {saving ? 'Guardando consulta...' : 'Guardar cambios'}
                </button>
              </form>
            </section>
          </section>
        </>
      )}
    </div>
  );
}
