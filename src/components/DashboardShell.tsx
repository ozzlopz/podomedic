'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import {
  LayoutDashboard,
  Shield,
  Users,
  BookText,
  Package,
  CalendarDays,
  ShoppingBag,
  Activity,
  History,
  FileText,
  ClipboardPlus,
  UserCircle2,
  Stethoscope,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

type Role = 'admin' | 'customer';

type DashboardShellProps = {
  role: Role;
  children: React.ReactNode;
};

const adminNavItems = [
  { href: '/admin', label: 'Inicio', icon: LayoutDashboard },
  { href: '/admin/administradores', label: 'Administradores', icon: Shield },
  { href: '/admin/pacientes', label: 'Pacientes', icon: Users },
  { href: '/admin/consultas', label: 'Consultas', icon: FileText },
  { href: '/admin/blog', label: 'Blog', icon: BookText },
  { href: '/admin/productos', label: 'Productos', icon: Package },
  { href: '/admin/solicitudes-compra', label: 'Solicitudes', icon: ShoppingBag },
  { href: '/admin/citas', label: 'Citas', icon: CalendarDays },
] as const;

const customerNavItems = [
  { href: '/customer', label: 'Inicio', icon: LayoutDashboard },
  { href: '/customer/citas', label: 'Mis citas', icon: CalendarDays },
  { href: '/customer/registrar-niveles', label: 'Registrar niveles', icon: ClipboardPlus },
  { href: '/customer/historial-niveles', label: 'Historial de niveles', icon: Activity },
  { href: '/customer/historial-consultas', label: 'Historial de consultas', icon: History },
  { href: '/customer/perfil', label: 'Mi perfil', icon: UserCircle2 },
] as const;

export default function DashboardShell({ role, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = role === 'admin' ? adminNavItems : customerNavItems;
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ');

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/login');
  };

  return (
    <div className="min-h-full bg-[linear-gradient(180deg,#f4fbff_0%,#ecf8fb_46%,#ffffff_100%)] text-slate-900">
      <div className="flex min-h-full flex-col lg:flex-row">
        <aside
          className={`border-b border-slate-200/80 bg-slate-950 text-white transition-[width] duration-300 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r ${
            isCollapsed ? 'lg:w-28' : 'lg:w-80'
          }`}
        >
          <div className="flex h-full flex-col px-5 py-6 sm:px-6">
            <div className="mb-4 flex items-center justify-between">
              {!isCollapsed && (
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
                  Navegación
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsCollapsed((current) => !current)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-white/75 transition hover:bg-white/12 hover:text-white"
                aria-label={isCollapsed ? 'Expandir panel lateral' : 'Contraer panel lateral'}
              >
                {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
              </button>
            </div>

            <div className={`rounded-[2rem] border border-white/10 bg-white/5 p-5 ${isCollapsed ? 'px-3 py-4' : ''}`}>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
                {isCollapsed ? 'BO' : fullName || (role === 'admin' ? 'Administrador' : 'Paciente')}
              </p>
              <div className={`mt-4 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300">
                  <Stethoscope className="h-6 w-6" />
                </div>
                {!isCollapsed && (
                  <div className="min-w-0">
                    <p className="text-xl font-black text-white">PodoMedic</p>
                    <p className="truncate text-sm text-white/60">{user?.email ?? 'Usuario autenticado'}</p>
                  </div>
                )}
              </div>
            </div>

            <nav className="mt-6 flex flex-1 flex-col gap-2">
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-cyan-400 text-slate-950 shadow-[0_18px_40px_rgba(45,212,191,0.25)]'
                        : 'text-white/78 hover:bg-white/8 hover:text-white'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                    title={isCollapsed ? label : undefined}
                  >
                    <Icon className="h-5 w-5" />
                    {!isCollapsed && label}
                  </Link>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={handleLogout}
              className={`mt-6 flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/16 ${
                isCollapsed ? 'px-0' : ''
              }`}
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && 'Cerrar sesión'}
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</div>
        </div>
      </div>
    </div>
  );
}
