'use client';

import Link from 'next/link';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock, AlertCircle, ShieldCheck, HeartPulse } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch {
      setError('Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-[linear-gradient(180deg,#f8fbff_0%,#edf8fb_44%,#ffffff_100%)] px-4 pb-20 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center">
        <div>
          <span className="inline-flex rounded-full border border-cyan-100 bg-white/80 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700 shadow-sm backdrop-blur-sm">
            Acceso seguro
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Ingresa a tu cuenta para revisar tu atención en PodoMedic.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
            Accede a tu perfil para consultar información y mantener tu seguimiento en un solo lugar.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm">
              <ShieldCheck className="h-7 w-7 text-cyan-600" />
              <p className="mt-4 text-lg font-black text-slate-950">Ingreso protegido</p>
              <p className="mt-1 text-sm text-slate-600">Tus datos de acceso se manejan con autenticación segura.</p>
            </div>
            <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm">
              <HeartPulse className="h-7 w-7 text-teal-600" />
              <p className="mt-4 text-lg font-black text-slate-950">Seguimiento cercano</p>
              <p className="mt-1 text-sm text-slate-600">Una experiencia alineada con el cuidado clínico del sitio.</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-[0_28px_90px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan-100">
              <LogIn className="h-7 w-7 text-cyan-700" />
            </div>
            <h2 className="mt-6 text-3xl font-black text-slate-950">Iniciar Sesión</h2>
            <p className="mt-2 text-sm text-slate-600">Accede a tu cuenta de Podomedic</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div>
                <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Mail className="h-4 w-4" />
                  Correo Electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 block w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Lock className="h-4 w-4" />
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 block w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-full bg-slate-950 px-4 py-4 text-sm font-semibold text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="h-5 w-5" />
                  Iniciar Sesión
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              ¿No tienes cuenta?{' '}
              <Link href="/contact" className="font-medium text-cyan-700 transition-colors hover:text-cyan-600">
                Contacta con nosotros
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
