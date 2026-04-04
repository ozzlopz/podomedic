import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog de Podología en Pachuca',
  description:
    'Artículos de podología médica en Pachuca sobre uñas encarnadas, pie diabético, prevención, higiene y cuidado profesional de los pies.',
  alternates: {
    canonical: '/blog',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
