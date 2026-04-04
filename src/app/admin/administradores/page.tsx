'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { ArrowRight, KeyRound, Shield, UserCog, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db, functions } from '@/lib/firebase';

type AdminType = 'superadmin' | 'admin';
type AccountStatus = 'active' | 'inactive';

type AdminUser = {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  admin_type?: AdminType;
  status?: AccountStatus;
};

const initialForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
  admin_type: 'admin' as AdminType,
};

export default function AdminManagersPage() {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.admin_type === 'superadmin';
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [form, setForm] = useState(initialForm);

  const loadAdmins = async () => {
    if (!db) {
      setError('No se pudo conectar con Firestore.');
      setLoading(false);
      return;
    }

    try {
      const adminsQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
      const snapshot = await getDocs(adminsQuery);
      const adminUsers = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      })) as AdminUser[];

      setAdmins(
        adminUsers.sort((left, right) => {
          if (left.admin_type === 'superadmin' && right.admin_type !== 'superadmin') return -1;
          if (left.admin_type !== 'superadmin' && right.admin_type === 'superadmin') return 1;
          return (left.first_name ?? left.email ?? '').localeCompare(right.first_name ?? right.email ?? '', 'es');
        }),
      );
      setError('');
    } catch {
      setError('No fue posible cargar la lista de administradores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleCreateAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!functions) {
      setSubmitError('No se pudo conectar con Firebase Functions.');
      return;
    }

    setCreating(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      const createAdmin = httpsCallable(functions, 'createAdminUser');
      await createAdmin(form);
      setSubmitSuccess('Administrador creado correctamente.');
      setForm(initialForm);
      await loadAdmins();
    } catch (createError) {
      const message =
        createError instanceof Error ? createError.message : 'No fue posible crear el administrador.';
      setSubmitError(message);
    } finally {
      setCreating(false);
    }
  };

  const adminsWithNames = admins.map((admin) => ({
    ...admin,
    displayName:
      [admin.first_name, admin.last_name].filter(Boolean).join(' ') ||
      admin.email ||
      'Administrador sin nombre',
  }));

  const activeAdmins = admins.filter((admin) => (admin.status ?? 'active') === 'active').length;
  const superAdmins = admins.filter((admin) => (admin.admin_type ?? 'admin') === 'superadmin').length;

  return (
    <div className="space-y-8">
      <section>
        <span className="inline-flex rounded-full border border-cyan-100 bg-white/80 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700 shadow-sm backdrop-blur-sm">
          Administradores
        </span>
        <h1 className="mt-6 text-4xl font-black text-slate-950 sm:text-5xl">Gestión de administradores</h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">
          Visualiza a tu equipo de administración y controla quién puede operar como superadministrador.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <Shield className="h-7 w-7 text-cyan-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">{loading ? '...' : activeAdmins}</p>
          <p className="mt-1 text-sm text-slate-600">Administradores activos</p>
        </div>
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <UserPlus className="h-7 w-7 text-blue-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">{loading ? '...' : admins.length}</p>
          <p className="mt-1 text-sm text-slate-600">Cuentas admin registradas</p>
        </div>
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <KeyRound className="h-7 w-7 text-teal-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">{loading ? '...' : superAdmins}</p>
          <p className="mt-1 text-sm text-slate-600">Superadministradores</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Listado de administradores</h2>
              <p className="mt-2 text-slate-600">Usuarios con `role: admin` en Firestore.</p>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
              Solo superadmin puede crear o editar privilegios
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading && (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-500">
                Cargando administradores...
              </div>
            )}

            {!loading && error && (
              <div className="rounded-3xl border border-red-100 bg-red-50 p-5 text-red-600">{error}</div>
            )}

            {!loading && !error && adminsWithNames.length === 0 && (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-500">
                No hay usuarios con rol admin en la colección `users`.
              </div>
            )}

            {!loading &&
              !error &&
              adminsWithNames.map((admin) => (
                <Link
                  key={admin.id}
                  href={`/admin/administradores/${admin.id}`}
                  className="block rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-cyan-200 hover:bg-cyan-50/40"
                >
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <p className="text-lg font-bold text-slate-950">{admin.displayName}</p>
                      <p className="text-sm text-slate-600">{admin.email ?? 'Sin correo registrado'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                          (admin.admin_type ?? 'admin') === 'superadmin'
                            ? 'bg-violet-100 text-violet-700'
                            : 'bg-cyan-50 text-cyan-700'
                        }`}
                      >
                        {admin.admin_type ?? 'admin'}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                          (admin.status ?? 'active') === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {(admin.status ?? 'active') === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white">
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
              <UserCog className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-950">Nuevo administrador</h2>
              <p className="mt-2 text-slate-600">
                {isSuperAdmin
                  ? 'Crea nuevas cuentas de administración y decide si tendrán privilegios elevados.'
                  : 'Tu cuenta puede consultar administradores, pero solo un superadmin puede crear nuevos accesos.'}
              </p>
            </div>
          </div>

          {isSuperAdmin ? (
            <form onSubmit={handleCreateAdmin} className="mt-8 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Nombre</span>
                  <input
                    required
                    value={form.first_name}
                    onChange={(event) => setForm((current) => ({ ...current, first_name: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                    placeholder="Nombre"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Apellido</span>
                  <input
                    required
                    value={form.last_name}
                    onChange={(event) => setForm((current) => ({ ...current, last_name: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                    placeholder="Apellido"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Correo electrónico</span>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  placeholder="admin@podologapachuca.com"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Teléfono</span>
                  <input
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                    placeholder="771 962 5242"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Tipo de administrador</span>
                  <select
                    value={form.admin_type}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        admin_type: event.target.value as AdminType,
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  >
                    <option value="admin">Admin</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Contraseña temporal</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  placeholder="Mínimo 6 caracteres"
                />
              </label>

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
                <UserPlus className="h-4 w-4" />
                {creating ? 'Creando administrador...' : 'Crear administrador'}
              </button>
            </form>
          ) : (
            <div className="mt-8 rounded-3xl border border-amber-100 bg-amber-50 p-5 text-amber-800">
              Tu cuenta no tiene privilegios de superadministrador. Puedes abrir cualquier ficha para revisar la
              información, pero la creación de accesos queda reservada al superadmin.
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
