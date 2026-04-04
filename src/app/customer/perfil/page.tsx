'use client';

import { FormEvent, useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { Mail, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';

export default function CustomerProfilePage() {
  const { user, profile } = useAuth();
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ');
  const [firstName, setFirstName] = useState(profile?.first_name ?? '');
  const [lastName, setLastName] = useState(profile?.last_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setFirstName(profile?.first_name ?? '');
    setLastName(profile?.last_name ?? '');
    setPhone(profile?.phone ?? '');
  }, [profile?.first_name, profile?.last_name, profile?.phone]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!db || !user) {
      setError('No se pudo conectar con tu perfil.');
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setError('Nombre y apellido son obligatorios.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
      });
      setSuccess('Perfil actualizado correctamente.');
    } catch {
      setError('No fue posible actualizar tu perfil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <span className="inline-flex rounded-full border border-cyan-100 bg-white/80 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700 shadow-sm backdrop-blur-sm">
          Mi perfil
        </span>
        <h1 className="mt-6 text-4xl font-black text-slate-950 sm:text-5xl">Tu información registrada</h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">
          Revisa los datos básicos asociados a tu cuenta de paciente.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <UserRound className="h-7 w-7 text-cyan-600" />
          <p className="mt-4 text-sm uppercase tracking-[0.14em] text-slate-500">Nombre</p>
          <p className="mt-2 text-xl font-black text-slate-950">{fullName || 'Sin nombre registrado'}</p>
        </div>
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <Mail className="h-7 w-7 text-blue-600" />
          <p className="mt-4 text-sm uppercase tracking-[0.14em] text-slate-500">Correo</p>
          <p className="mt-2 text-xl font-black text-slate-950">{profile?.email ?? user?.email ?? 'Sin correo'}</p>
        </div>
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <Phone className="h-7 w-7 text-teal-600" />
          <p className="mt-4 text-sm uppercase tracking-[0.14em] text-slate-500">Teléfono</p>
          <p className="mt-2 text-xl font-black text-slate-950">{profile?.phone ?? 'Sin teléfono registrado'}</p>
        </div>
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <ShieldCheck className="h-7 w-7 text-indigo-600" />
          <p className="mt-4 text-sm uppercase tracking-[0.14em] text-slate-500">Estado</p>
          <p className="mt-2 text-xl font-black text-slate-950">{profile?.status ?? 'active'}</p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <h2 className="text-2xl font-black text-slate-950">Editar perfil</h2>
        <p className="mt-2 text-slate-600">Puedes actualizar tu nombre, apellido y teléfono.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Nombre</span>
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Apellido</span>
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Teléfono</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
            />
          </label>

          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </section>
    </div>
  );
}
