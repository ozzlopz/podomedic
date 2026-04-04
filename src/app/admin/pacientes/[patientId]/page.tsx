'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { collection, doc, getDoc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Fingerprint,
  FileText,
  Mail,
  Phone,
  UserRound,
  HeartPulse,
  KeyRound,
} from 'lucide-react';
import { auth, db, functions } from '@/lib/firebase';

type AccountStatus = 'active' | 'inactive';

type PatientProfile = {
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  phone?: string;
  status?: AccountStatus;
  createdAt?: { seconds?: number };
};

type Appointment = {
  id: string;
  reason?: string;
  status?: string;
  source?: string;
  scheduledAt?: { seconds?: number };
};

type Consultation = {
  id: string;
  reason?: string;
  notes?: string;
  status?: string;
  consultationDate?: { seconds?: number };
};

export default function PatientDetailPage() {
  const params = useParams<{ patientId: string }>();
  const patientId = params.patientId;
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);

  const loadPatient = useCallback(async () => {
    if (!db) {
      setError('No se pudo conectar con Firestore.');
      setLoading(false);
      return;
    }

    try {
      const [snapshot, appointmentsSnapshot, consultationsSnapshot] = await Promise.all([
        getDoc(doc(db, 'users', patientId)),
        getDocs(
          query(collection(db, 'appointments'), where('userId', '==', patientId), orderBy('scheduledAt', 'desc')),
        ),
        getDocs(
          query(
            collection(db, 'consultations'),
            where('userId', '==', patientId),
            orderBy('consultationDate', 'desc'),
          ),
        ),
      ]);

      if (!snapshot.exists()) {
        setError('No se encontró el paciente solicitado.');
        setLoading(false);
        return;
      }

      const data = snapshot.data() as PatientProfile;

      if (data.role !== 'customer') {
        setError('El usuario consultado no pertenece al grupo de pacientes.');
        setLoading(false);
        return;
      }

      setPatient(data);
      setForm({
        first_name: data.first_name ?? '',
        last_name: data.last_name ?? '',
        phone: data.phone ?? '',
      });
      setAppointments(
        appointmentsSnapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        })) as Appointment[],
      );
      setConsultations(
        consultationsSnapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        })) as Consultation[],
      );
      setError('');
    } catch {
      setError('No fue posible cargar el detalle del paciente.');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadPatient();
  }, [loadPatient]);

  const fullName = useMemo(() => {
    if (!patient) return '';
    return [patient.first_name, patient.last_name].filter(Boolean).join(' ') || patient.email || 'Paciente';
  }, [patient]);

  const createdDate = patient?.createdAt?.seconds
    ? new Date(patient.createdAt.seconds * 1000).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Sin fecha registrada';

  const currentStatus = patient?.status ?? 'active';

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!db || !patient) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateDoc(doc(db, 'users', patientId), {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
      });

      setSuccess('Cambios guardados correctamente.');
      await loadPatient();
    } catch {
      setError('No fue posible guardar los cambios del paciente.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!auth || !patient?.email) {
      setError('No hay un correo válido para enviar el restablecimiento.');
      return;
    }

    setSendingReset(true);
    setError('');
    setSuccess('');

    try {
      await sendPasswordResetEmail(auth, patient.email);
      setSuccess('Se envió el correo para restablecer la contraseña.');
    } catch {
      setError('No fue posible enviar el correo de restablecimiento.');
    } finally {
      setSendingReset(false);
    }
  };

  const handleStatusChange = async () => {
    if (!functions || !patient) {
      setError('No se pudo conectar con Firebase Functions.');
      return;
    }

    setUpdatingStatus(true);
    setError('');
    setSuccess('');

    try {
      const updateStatus = httpsCallable(functions, 'setCustomerAccountStatus');
      const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await updateStatus({
        uid: patientId,
        status: nextStatus,
      });
      setSuccess(nextStatus === 'active' ? 'Paciente activado.' : 'Paciente desactivado.');
      await loadPatient();
    } catch (statusError) {
      const message =
        statusError instanceof Error ? statusError.message : 'No fue posible actualizar el estado del paciente.';
      setError(message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/pacientes"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a pacientes
          </Link>
          <h1 className="mt-6 text-4xl font-black text-slate-950 sm:text-5xl">Detalle del paciente</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600">
            Revisa la ficha individual del paciente y gestiona su acceso al dashboard.
          </p>
        </div>
      </section>

      {loading && (
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-slate-500 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          Cargando información del paciente...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-[2rem] border border-red-100 bg-red-50 p-8 text-red-600 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          {error}
        </div>
      )}

      {!loading && !error && patient && (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
              <UserRound className="h-7 w-7 text-cyan-600" />
              <p className="mt-4 text-2xl font-black text-slate-950">{fullName}</p>
              <p className="mt-1 text-sm text-slate-600">Nombre visible del paciente</p>
            </div>
            <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
              <HeartPulse className="h-7 w-7 text-blue-600" />
              <p className="mt-4 text-2xl font-black text-slate-950">customer</p>
              <p className="mt-1 text-sm text-slate-600">Rol asignado en Firestore</p>
            </div>
            <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
              <BadgeCheck className="h-7 w-7 text-teal-600" />
              <p className="mt-4 text-2xl font-black text-slate-950">
                {currentStatus === 'active' ? 'Activo' : 'Inactivo'}
              </p>
              <p className="mt-1 text-sm text-slate-600">Estado actual de la cuenta</p>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <div className="rounded-[2rem] border border-cyan-100 bg-slate-950 p-8 text-white shadow-[0_28px_80px_rgba(15,23,42,0.18)]">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">Perfil</p>
              <div className="mt-8 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <Mail className="h-5 w-5 text-cyan-300" />
                  <p className="mt-4 text-sm uppercase tracking-[0.2em] text-white/45">Correo</p>
                  <p className="mt-2 text-lg font-semibold text-white">{patient.email ?? 'Sin correo registrado'}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <Fingerprint className="h-5 w-5 text-cyan-300" />
                  <p className="mt-4 text-sm uppercase tracking-[0.2em] text-white/45">UID</p>
                  <p className="mt-2 break-all text-sm font-medium text-white/85">{patientId}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <Phone className="h-5 w-5 text-cyan-300" />
                  <p className="mt-4 text-sm uppercase tracking-[0.2em] text-white/45">Teléfono</p>
                  <p className="mt-2 text-lg font-semibold text-white">{patient.phone || 'Sin teléfono registrado'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-slate-950">Información de cuenta</h2>
                    <p className="mt-2 text-slate-600">
                      Actualiza los datos básicos del paciente sin alterar su rol dentro del sistema.
                    </p>
                  </div>
                  <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
                    Rol fijo: customer
                  </div>
                </div>

                <form onSubmit={handleSave} className="mt-8 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Nombre</span>
                      <input
                        value={form.first_name}
                        onChange={(event) => setForm((current) => ({ ...current, first_name: event.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Apellido</span>
                      <input
                        value={form.last_name}
                        onChange={(event) => setForm((current) => ({ ...current, last_name: event.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Teléfono</span>
                    <input
                      value={form.phone}
                      onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
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
                    <HeartPulse className="h-4 w-4" />
                    {saving ? 'Guardando cambios...' : 'Guardar cambios'}
                  </button>
                </form>
              </section>

              <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
                <h2 className="text-2xl font-black text-slate-950">Acciones de seguridad</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    disabled={sendingReset}
                    className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-left transition hover:border-cyan-200 hover:bg-cyan-50/40 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <KeyRound className="h-5 w-5 text-cyan-700" />
                    <p className="mt-4 text-lg font-bold text-slate-950">
                      {sendingReset ? 'Enviando correo...' : 'Enviar reset de contraseña'}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">Envía un enlace al correo del paciente.</p>
                  </button>

                  <button
                    type="button"
                    onClick={handleStatusChange}
                    disabled={updatingStatus}
                    className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-left transition hover:border-cyan-200 hover:bg-cyan-50/40 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <BadgeCheck className="h-5 w-5 text-cyan-700" />
                    <p className="mt-4 text-lg font-bold text-slate-950">
                      {updatingStatus
                        ? 'Actualizando estado...'
                        : currentStatus === 'active'
                          ? 'Desactivar cuenta'
                          : 'Activar cuenta'}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {currentStatus === 'active'
                        ? 'Bloquea el acceso a este paciente sin borrar su perfil.'
                        : 'Restablece el acceso del paciente a su dashboard.'}
                    </p>
                  </button>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Creado</p>
                    <p className="mt-2 text-lg font-bold text-slate-950">{createdDate}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Estado actual</p>
                    <p className="mt-2 text-lg font-bold text-slate-950">
                      {currentStatus === 'active' ? 'Activo' : 'Inactivo'}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-950">Citas del paciente</h2>
                    <p className="mt-2 text-slate-600">Revisa las citas ligadas a esta cuenta.</p>
                  </div>
                  <span className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700">
                    {appointments.length} registradas
                  </span>
                </div>
                <div className="mt-6 space-y-4">
                  {appointments.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-slate-500">
                      Este paciente aún no tiene citas registradas.
                    </div>
                  ) : (
                    appointments.map((appointment) => (
                      <Link
                        key={appointment.id}
                        href={`/admin/citas/${appointment.id}`}
                        className="block rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-cyan-200 hover:bg-cyan-50/40"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-3">
                            <CalendarDays className="mt-1 h-5 w-5 text-cyan-700" />
                            <div>
                              <p className="text-lg font-bold text-slate-950">
                                {appointment.reason ?? 'Cita sin motivo'}
                              </p>
                              <p className="text-sm text-slate-500">
                                {appointment.scheduledAt?.seconds
                                  ? new Date(appointment.scheduledAt.seconds * 1000).toLocaleString('es-MX')
                                  : 'Sin fecha registrada'}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                              {appointment.source ?? 'admin'}
                            </span>
                            <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                              {appointment.status ?? 'pending'}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-950">Consultas del paciente</h2>
                    <p className="mt-2 text-slate-600">Historial clínico ligado a esta cuenta.</p>
                  </div>
                  <span className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700">
                    {consultations.length} registradas
                  </span>
                </div>
                <div className="mt-6 space-y-4">
                  {consultations.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-slate-500">
                      Este paciente aún no tiene consultas registradas.
                    </div>
                  ) : (
                    consultations.map((consultation) => (
                      <Link
                        key={consultation.id}
                        href={`/admin/consultas/${consultation.id}`}
                        className="block rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-cyan-200 hover:bg-cyan-50/40"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-start gap-3">
                            <FileText className="mt-1 h-5 w-5 text-cyan-700" />
                            <div>
                              <p className="text-lg font-bold text-slate-950">
                                {consultation.reason ?? 'Consulta sin motivo'}
                              </p>
                              <p className="text-sm text-slate-500">
                                {consultation.consultationDate?.seconds
                                  ? new Date(consultation.consultationDate.seconds * 1000).toLocaleString('es-MX')
                                  : 'Sin fecha registrada'}
                              </p>
                              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                {consultation.notes ?? 'Sin notas clínicas registradas.'}
                              </p>
                            </div>
                          </div>
                          <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                            {consultation.status ?? 'consulta'}
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </section>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
