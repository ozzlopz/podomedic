'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import {
  ArrowLeft,
  BadgeCheck,
  Fingerprint,
  Mail,
  Shield,
  UserRound,
  Phone,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { auth, db, functions } from '@/lib/firebase';

type AdminType = 'superadmin' | 'admin';
type AccountStatus = 'active' | 'inactive';

type AdminProfile = {
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  phone?: string;
  admin_type?: AdminType;
  status?: AccountStatus;
  createdAt?: { seconds?: number };
};

export default function AdminDetailPage() {
  const params = useParams<{ adminId: string }>();
  const { profile } = useAuth();
  const adminId = params.adminId;
  const isSuperAdmin = profile?.admin_type === 'superadmin';
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    admin_type: 'admin' as AdminType,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadAdmin = useCallback(async () => {
    if (!db) {
      setError('No se pudo conectar con Firestore.');
      setLoading(false);
      return;
    }

    try {
      const snapshot = await getDoc(doc(db, 'users', adminId));

      if (!snapshot.exists()) {
        setError('No se encontró el administrador solicitado.');
        setLoading(false);
        return;
      }

      const data = snapshot.data() as AdminProfile;

      if (data.role !== 'admin') {
        setError('El usuario consultado no pertenece al grupo de administradores.');
        setLoading(false);
        return;
      }

      setAdmin(data);
      setForm({
        first_name: data.first_name ?? '',
        last_name: data.last_name ?? '',
        phone: data.phone ?? '',
        admin_type: data.admin_type ?? 'admin',
      });
      setError('');
    } catch {
      setError('No fue posible cargar el detalle del administrador.');
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    loadAdmin();
  }, [loadAdmin]);

  const fullName = useMemo(() => {
    if (!admin) return '';
    return [admin.first_name, admin.last_name].filter(Boolean).join(' ') || admin.email || 'Administrador';
  }, [admin]);

  const createdDate = admin?.createdAt?.seconds
    ? new Date(admin.createdAt.seconds * 1000).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Sin fecha registrada';

  const currentStatus = admin?.status ?? 'active';
  const currentAdminType = admin?.admin_type ?? 'admin';

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!db || !admin) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateDoc(doc(db, 'users', adminId), {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        admin_type: isSuperAdmin ? form.admin_type : currentAdminType,
      });

      setSuccess('Cambios guardados correctamente.');
      await loadAdmin();
    } catch {
      setError('No fue posible guardar los cambios del administrador.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!auth || !admin?.email) {
      setError('No hay un correo válido para enviar el restablecimiento.');
      return;
    }

    setSendingReset(true);
    setError('');
    setSuccess('');

    try {
      await sendPasswordResetEmail(auth, admin.email);
      setSuccess('Se envió el correo para restablecer la contraseña.');
    } catch {
      setError('No fue posible enviar el correo de restablecimiento.');
    } finally {
      setSendingReset(false);
    }
  };

  const handleStatusChange = async () => {
    if (!functions || !admin) {
      setError('No se pudo conectar con Firebase Functions.');
      return;
    }

    setUpdatingStatus(true);
    setError('');
    setSuccess('');

    try {
      const updateStatus = httpsCallable(functions, 'setAdminAccountStatus');
      const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await updateStatus({
        uid: adminId,
        status: nextStatus,
      });
      setSuccess(nextStatus === 'active' ? 'Administrador activado.' : 'Administrador desactivado.');
      await loadAdmin();
    } catch (statusError) {
      const message =
        statusError instanceof Error ? statusError.message : 'No fue posible actualizar el estado del administrador.';
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
            href="/admin/administradores"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a administradores
          </Link>
          <h1 className="mt-6 text-4xl font-black text-slate-950 sm:text-5xl">Detalle del administrador</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600">
            Revisa la ficha individual y administra el acceso según el nivel de permisos de tu cuenta.
          </p>
        </div>
      </section>

      {loading && (
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-slate-500 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          Cargando información del administrador...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-[2rem] border border-red-100 bg-red-50 p-8 text-red-600 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          {error}
        </div>
      )}

      {!loading && !error && admin && (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
              <UserRound className="h-7 w-7 text-cyan-600" />
              <p className="mt-4 text-2xl font-black text-slate-950">{fullName}</p>
              <p className="mt-1 text-sm text-slate-600">Nombre visible del administrador</p>
            </div>
            <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
              <Shield className="h-7 w-7 text-blue-600" />
              <p className="mt-4 text-2xl font-black capitalize text-slate-950">{currentAdminType}</p>
              <p className="mt-1 text-sm text-slate-600">Tipo de acceso asignado</p>
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
                  <p className="mt-2 text-lg font-semibold text-white">{admin.email ?? 'Sin correo registrado'}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <Fingerprint className="h-5 w-5 text-cyan-300" />
                  <p className="mt-4 text-sm uppercase tracking-[0.2em] text-white/45">UID</p>
                  <p className="mt-2 break-all text-sm font-medium text-white/85">{adminId}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <Phone className="h-5 w-5 text-cyan-300" />
                  <p className="mt-4 text-sm uppercase tracking-[0.2em] text-white/45">Teléfono</p>
                  <p className="mt-2 text-lg font-semibold text-white">{admin.phone || 'Sin teléfono registrado'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-slate-950">Información de cuenta</h2>
                    <p className="mt-2 text-slate-600">
                      {isSuperAdmin
                        ? 'Puedes editar datos básicos, cambiar el nivel admin y controlar el estado de acceso.'
                        : 'Vista de consulta. Solo un superadmin puede modificar privilegios o el estado del acceso.'}
                    </p>
                  </div>
                  <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
                    Rol fijo: admin
                  </div>
                </div>

                <form onSubmit={handleSave} className="mt-8 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Nombre</span>
                      <input
                        value={form.first_name}
                        onChange={(event) => setForm((current) => ({ ...current, first_name: event.target.value }))}
                        disabled={!isSuperAdmin}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Apellido</span>
                      <input
                        value={form.last_name}
                        onChange={(event) => setForm((current) => ({ ...current, last_name: event.target.value }))}
                        disabled={!isSuperAdmin}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Teléfono</span>
                      <input
                        value={form.phone}
                        onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                        disabled={!isSuperAdmin}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Nivel de acceso</span>
                      <select
                        value={form.admin_type}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            admin_type: event.target.value as AdminType,
                          }))
                        }
                        disabled={!isSuperAdmin}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="admin">Admin</option>
                        <option value="superadmin">Superadmin</option>
                      </select>
                    </label>
                  </div>

                  {success && (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {success}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!isSuperAdmin || saving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Shield className="h-4 w-4" />
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
                    disabled={!isSuperAdmin || sendingReset}
                    className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-left transition hover:border-cyan-200 hover:bg-cyan-50/40 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <KeyRound className="h-5 w-5 text-cyan-700" />
                    <p className="mt-4 text-lg font-bold text-slate-950">
                      {sendingReset ? 'Enviando correo...' : 'Enviar reset de contraseña'}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">Envía un enlace al correo del administrador.</p>
                  </button>

                  <button
                    type="button"
                    onClick={handleStatusChange}
                    disabled={!isSuperAdmin || updatingStatus}
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
                        ? 'Bloquea el acceso a este administrador sin borrar su perfil.'
                        : 'Restablece el acceso del administrador al back office.'}
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
            </div>
          </section>
        </>
      )}
    </div>
  );
}
