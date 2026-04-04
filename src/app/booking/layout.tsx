import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agenda tu Cita de Podología en Pachuca',
  description:
    'Reserva tu cita de podología médica en Pachuca con PodoMedic. Atención profesional para uñas encarnadas, pie diabético, callos y seguimiento podológico.',
  alternates: {
    canonical: '/booking',
  },
};

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
