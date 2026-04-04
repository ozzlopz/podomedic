import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contacto Podólogo en Pachuca',
  description:
    'Contacta a PodoMedic, consultorio de podología médica en Pachuca. Agenda atención para uñas encarnadas, pie diabético, hongos y cuidado integral del pie.',
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
