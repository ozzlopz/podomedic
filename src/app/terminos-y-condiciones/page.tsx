import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description:
    'Consulta los términos y condiciones de uso del sitio web y de los formularios de contacto, reserva y solicitudes de PodoMedic.',
  alternates: {
    canonical: '/terminos-y-condiciones',
  },
};

const sections = [
  {
    title: 'Uso del sitio',
    body:
      'Este sitio web tiene fines informativos, de contacto y de solicitud de citas o productos relacionados con los servicios de PodoMedic. El usuario se compromete a utilizar el sitio de forma lícita y a proporcionar información veraz en los formularios.',
  },
  {
    title: 'Reservas y solicitudes',
    body:
      'El envío de formularios no implica aceptación automática, cita confirmada ni disponibilidad garantizada. Toda solicitud está sujeta a revisión y confirmación por parte de PodoMedic.',
  },
  {
    title: 'Información publicada',
    body:
      'El contenido del sitio, incluyendo artículos, recomendaciones o descripciones de servicios, tiene carácter informativo y no sustituye una valoración profesional individual.',
  },
  {
    title: 'Propiedad intelectual',
    body:
      'Los textos, imágenes, logotipos, diseño y demás elementos del sitio pertenecen a PodoMedic o se utilizan con la autorización correspondiente. Queda prohibida su reproducción no autorizada.',
  },
  {
    title: 'Modificaciones',
    body:
      'PodoMedic podrá modificar estos términos en cualquier momento. Las actualizaciones se considerarán vigentes desde su publicación en esta página.',
  },
];

export default function TermsPage() {
  return (
    <div className="flex-1 bg-[linear-gradient(180deg,#f8fbff_0%,#eef8fb_46%,#ffffff_100%)] px-4 pb-20 sm:px-6">
      <div className="mx-auto max-w-4xl py-8">
        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
        >
          Volver al inicio
        </Link>

        <div className="mt-6 rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-[0_28px_90px_rgba(15,23,42,0.08)] sm:p-10">
          <span className="inline-flex rounded-full border border-cyan-100 bg-cyan-50 px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700">
            Legal
          </span>
          <h1 className="mt-6 text-4xl font-black text-slate-950 sm:text-5xl">Términos y Condiciones</h1>

          <div className="mt-10 space-y-8">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-2xl font-black text-slate-950">{section.title}</h2>
                <p className="mt-3 text-base leading-relaxed text-slate-700">{section.body}</p>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
