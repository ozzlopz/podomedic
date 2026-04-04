'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { ArrowLeft, BadgeCheck, CalendarDays, FileText, PlusCircle, UserRound } from 'lucide-react';
import { db } from '@/lib/firebase';
import { useParams } from 'next/navigation';

type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

type Appointment = {
  userId?: string;
  patientName?: string;
  patientEmail?: string;
  reason?: string;
  notes?: string;
  source?: 'booking' | 'admin';
  status?: AppointmentStatus;
  scheduledAt?: { seconds?: number };
};

type Consultation = {
  id: string;
  reason?: string;
  notes?: string;
  status?: string;
  consultationDate?: { seconds?: number };
};

const initialConsultationForm = {
  consultationDate: '',
  reason: '',
  notes: '',
  status: 'seguimiento',
};

export default function AppointmentDetailPage() {
  const params = useParams<{ appointmentId: string }>();
  const appointmentId = params.appointmentId;
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [creatingConsultation, setCreatingConsultation] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [consultationForm, setConsultationForm] = useState(initialConsultationForm);

  const loadAppointment = useCallback(async () => {
    if (!db) {
      setError('No se pudo conectar con Firestore.');
      setLoading(false);
      return;
    }

    try {
      const [appointmentSnapshot, consultationsSnapshot] = await Promise.all([
        getDoc(doc(db, 'appointments', appointmentId)),
        getDocs(
          query(collection(db, 'consultations'), where('appointmentId', '==', appointmentId), orderBy('consultationDate', 'desc')),
        ),
      ]);

      if (!appointmentSnapshot.exists()) {
        setError('No se encontró la cita solicitada.');
        setLoading(false);
        return;
      }

      setAppointment(appointmentSnapshot.data() as Appointment);
      setConsultations(
        consultationsSnapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        })) as Consultation[],
      );
      setError('');
    } catch {
      setError('No fue posible cargar el detalle de la cita.');
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    loadAppointment();
  }, [loadAppointment]);

  const handleStatusUpdate = async (nextStatus: AppointmentStatus) => {
    if (!db || !appointment) return;

    setSavingStatus(true);
    setError('');
    setSuccess('');

    try {
      await updateDoc(doc(db, 'appointments', appointmentId), {
        status: nextStatus,
      });
      setSuccess('Estado de la cita actualizado.');
      await loadAppointment();
    } catch {
      setError('No fue posible actualizar el estado de la cita.');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleCreateConsultation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!db || !appointment?.userId) return;

    setCreatingConsultation(true);
    setError('');
    setSuccess('');

    try {
      await addDoc(collection(db, 'consultations'), {
        userId: appointment.userId,
        appointmentId,
        reason: consultationForm.reason,
        notes: consultationForm.notes,
        status: consultationForm.status,
        consultationDate: new Date(consultationForm.consultationDate),
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'appointments', appointmentId), {
        status: 'completed',
      });

      setConsultationForm(initialConsultationForm);
      setSuccess('Consulta creada y ligada a la cita.');
      await loadAppointment();
    } catch {
      setError('No fue posible crear la consulta.');
    } finally {
      setCreatingConsultation(false);
    }
  };

  const scheduledLabel =
    appointment?.scheduledAt?.seconds
      ? new Date(appointment.scheduledAt.seconds * 1000).toLocaleString('es-MX')
      : 'Sin fecha programada';

  return (
    <div className="space-y-8">
      <section>
        <Link
          href="/admin/citas"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a citas
        </Link>
        <h1 className="mt-6 text-4xl font-black text-slate-950 sm:text-5xl">Detalle de la cita</h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">
          Revisa la solicitud, actualiza su estado y genera la consulta clínica ligada a esta cita.
        </p>
      </section>

      {loading && (
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-slate-500 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          Cargando cita...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-[2rem] border border-red-100 bg-red-50 p-8 text-red-600 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          {error}
        </div>
      )}

      {!loading && !error && appointment && (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
              <UserRound className="h-7 w-7 text-cyan-600" />
              <p className="mt-4 text-2xl font-black text-slate-950">{appointment.patientName ?? 'Paciente'}</p>
              <p className="mt-1 text-sm text-slate-600">{appointment.patientEmail ?? 'Sin correo registrado'}</p>
            </div>
            <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
              <CalendarDays className="h-7 w-7 text-blue-600" />
              <p className="mt-4 text-2xl font-black text-slate-950">{scheduledLabel}</p>
              <p className="mt-1 text-sm text-slate-600">Fecha y hora programadas</p>
            </div>
            <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
              <BadgeCheck className="h-7 w-7 text-teal-600" />
              <p className="mt-4 text-2xl font-black text-slate-950">{appointment.status ?? 'pending'}</p>
              <p className="mt-1 text-sm text-slate-600">Estado actual de la cita</p>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
            <div className="space-y-6">
              <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
                <h2 className="text-2xl font-black text-slate-950">Resumen de la solicitud</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Motivo</p>
                    <p className="mt-2 text-lg font-bold text-slate-950">{appointment.reason ?? 'Sin motivo'}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Origen</p>
                    <p className="mt-2 text-lg font-bold text-slate-950">{appointment.source ?? 'admin'}</p>
                  </div>
                </div>
                <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Notas</p>
                  <p className="mt-2 text-base leading-relaxed text-slate-700">
                    {appointment.notes ?? 'Sin notas registradas.'}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {(['pending', 'confirmed', 'completed', 'cancelled'] as AppointmentStatus[]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleStatusUpdate(status)}
                      disabled={savingStatus || appointment.status === status}
                      className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Marcar como {status}
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <PlusCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-950">Crear consulta ligada</h2>
                    <p className="mt-2 text-slate-600">
                      Genera una consulta clínica asociada al paciente y a esta cita.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCreateConsultation} className="mt-8 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Fecha de consulta</span>
                      <input
                        type="datetime-local"
                        required
                        value={consultationForm.consultationDate}
                        onChange={(event) =>
                          setConsultationForm((current) => ({
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
                        value={consultationForm.status}
                        onChange={(event) =>
                          setConsultationForm((current) => ({
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
                      value={consultationForm.reason}
                      onChange={(event) =>
                        setConsultationForm((current) => ({
                          ...current,
                          reason: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      placeholder="Ej. Valoración por uña encarnada"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Notas clínicas</span>
                    <textarea
                      required
                      rows={4}
                      value={consultationForm.notes}
                      onChange={(event) =>
                        setConsultationForm((current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      placeholder="Anota hallazgos, recomendaciones y seguimiento."
                    />
                  </label>

                  {success && (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {success}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={creatingConsultation}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FileText className="h-4 w-4" />
                    {creatingConsultation ? 'Creando consulta...' : 'Crear consulta'}
                  </button>
                </form>
              </section>
            </div>

            <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              <h2 className="text-2xl font-black text-slate-950">Consultas ligadas</h2>
              <div className="mt-6 space-y-4">
                {consultations.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-slate-500">
                    Aún no hay consultas ligadas a esta cita.
                  </div>
                ) : (
                    consultations.map((consultation) => (
                    <Link
                      key={consultation.id}
                      href={`/admin/consultas/${consultation.id}`}
                      className="block rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-cyan-200 hover:bg-cyan-50/40"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-lg font-bold text-slate-950">{consultation.reason ?? 'Consulta'}</p>
                          <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                            {consultation.status ?? 'seguimiento'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">
                          {consultation.consultationDate?.seconds
                            ? new Date(consultation.consultationDate.seconds * 1000).toLocaleString('es-MX')
                            : 'Sin fecha registrada'}
                        </p>
                        <p className="text-sm leading-relaxed text-slate-600">
                          {consultation.notes ?? 'Sin notas registradas.'}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </section>
          </section>
        </>
      )}
    </div>
  );
}
