import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Productos para Podología en Pachuca',
  description:
    'Explora productos recomendados por PodoMedic en Pachuca para el cuidado podológico, hidratación, soporte y seguimiento en casa.',
  alternates: {
    canonical: '/productos',
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
