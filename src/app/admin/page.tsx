'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { CalendarDays, FileText, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { db } from '@/lib/firebase';

type Patient = {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  status?: 'active' | 'inactive';
};

type Appointment = {
  id: string;
  userId?: string;
  patientName?: string;
  reason?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  scheduledAt?: { seconds?: number };
};

type Consultation = {
  id: string;
  reason?: string;
  notes?: string;
  status?: string;
  consultationDate?: { seconds?: number };
};

export default function Admin() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      if (!db) {
        setLoading(false);
        return;
      }

      try {
        const [patientsSnapshot, appointmentsSnapshot, consultationsSnapshot] = await Promise.all([
          getDocs(query(collection(db, 'users'), where('role', '==', 'customer'))),
          getDocs(query(collection(db, 'appointments'), orderBy('scheduledAt', 'desc'), limit(6))),
          getDocs(query(collection(db, 'consultations'), orderBy('consultationDate', 'desc'), limit(5))),
        ]);

        setPatients(
          patientsSnapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data(),
          })) as Patient[],
        );
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
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const activePatients = patients.filter((patient) => (patient.status ?? 'active') === 'active').length;
  const pendingAppointments = appointments.filter((appointment) => appointment.status === 'pending').length;
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

  const recentPatients = patients.slice(0, 4);

  return (
    <div className="space-y-8">
      <section>
        <span className="inline-flex rounded-full border border-cyan-100 bg-white/80 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700 shadow-sm backdrop-blur-sm">
          Panel de administración
        </span>
        <h1 className="mt-6 text-4xl font-black text-slate-950 sm:text-5xl">Control general del consultorio</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          Supervisa pacientes, citas y actividad reciente del sistema desde una sola vista.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/admin/pacientes"
          className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-cyan-200"
        >
          <Users className="h-7 w-7 text-cyan-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">{loading ? '...' : patients.length}</p>
          <p className="mt-1 text-sm text-slate-600">Pacientes registrados</p>
        </Link>
        <Link
          href="/admin/citas"
          className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-cyan-200"
        >
          <CalendarDays className="h-7 w-7 text-blue-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">{loading ? '...' : todayAppointments}</p>
          <p className="mt-1 text-sm text-slate-600">Citas del día</p>
        </Link>
        <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm">
          <ShieldCheck className="h-7 w-7 text-teal-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">{loading ? '...' : activePatients}</p>
          <p className="mt-1 text-sm text-slate-600">Pacientes activos</p>
        </div>
        <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm">
          <TrendingUp className="h-7 w-7 text-indigo-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">{loading ? '...' : pendingAppointments}</p>
          <p className="mt-1 text-sm text-slate-600">Citas pendientes</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Pacientes recientes</h2>
              <p className="mt-2 text-slate-600">Consulta rápido el estado de tus pacientes registrados.</p>
            </div>
            <Link href="/admin/pacientes" className="text-sm font-semibold text-cyan-700 hover:text-cyan-600">
              Ver todos
            </Link>
          </div>
          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-500">Cargando pacientes...</div>
            ) : recentPatients.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-slate-500">
                Aún no hay pacientes registrados.
              </div>
            ) : (
              recentPatients.map((patient) => (
                <Link
                  key={patient.id}
                  href={`/admin/pacientes/${patient.id}`}
                  className="block rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-cyan-200 hover:bg-cyan-50/40"
                >
                  <p className="text-lg font-bold text-slate-950">
                    {[patient.first_name, patient.last_name].filter(Boolean).join(' ') || patient.email || 'Paciente'}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-600">{patient.email ?? 'Sin correo registrado'}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                        (patient.status ?? 'active') === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {patient.status ?? 'active'}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Citas recientes</h2>
              <p className="mt-2 text-slate-600">Monitorea las solicitudes más nuevas y su estado.</p>
            </div>
            <Link href="/admin/citas" className="text-sm font-semibold text-cyan-700 hover:text-cyan-600">
              Ver agenda
            </Link>
          </div>
          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-500">Cargando citas...</div>
            ) : appointments.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-slate-500">
                Aún no hay citas registradas.
              </div>
            ) : (
              appointments.map((appointment) => (
                <Link
                  key={appointment.id}
                  href={`/admin/citas/${appointment.id}`}
                  className="block rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-cyan-200 hover:bg-cyan-50/40"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-bold text-slate-950">{appointment.patientName ?? 'Paciente'}</p>
                      <p className="text-sm text-slate-600">{appointment.reason ?? 'Sin motivo registrado'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-cyan-700">
                        {appointment.scheduledAt?.seconds
                          ? new Date(appointment.scheduledAt.seconds * 1000).toLocaleString('es-MX')
                          : 'Sin fecha'}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
                        {appointment.status ?? 'pending'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-950">Consultas recientes</h2>
            <p className="mt-2 text-slate-600">Acceso rápido al registro clínico más nuevo.</p>
          </div>
          <Link href="/admin/consultas" className="text-sm font-semibold text-cyan-700 hover:text-cyan-600">
            Ver consultas
          </Link>
        </div>
        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-500">Cargando consultas...</div>
          ) : consultations.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-slate-500">
              Aún no hay consultas registradas.
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
                      <p className="text-lg font-bold text-slate-950">{consultation.reason ?? 'Consulta clínica'}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                        {consultation.notes ?? 'Sin notas clínicas registradas.'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-cyan-700">
                      {consultation.consultationDate?.seconds
                        ? new Date(consultation.consultationDate.seconds * 1000).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Sin fecha'}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
                      {consultation.status ?? 'seguimiento'}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
