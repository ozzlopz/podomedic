import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Acceso de Pacientes y Administradores',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
