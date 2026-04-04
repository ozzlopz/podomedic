import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Aviso de Privacidad',
  description:
    'Consulta el aviso de privacidad de PodoMedic sobre el tratamiento de datos personales recabados mediante formularios de contacto, reservas y solicitudes.',
  alternates: {
    canonical: '/aviso-de-privacidad',
  },
};

const sections = [
  {
    title: 'Responsable',
    body:
      'PodoMedic es responsable del tratamiento de los datos personales recabados a través de este sitio web.',
  },
  {
    title: 'Datos recabados',
    body:
      'Podemos recabar nombre, correo electrónico, teléfono, mensajes y demás datos que el usuario proporcione voluntariamente mediante formularios de contacto, reserva o solicitud.',
  },
  {
    title: 'Finalidades',
    body:
      'La información se utiliza para responder solicitudes, dar seguimiento a citas, confirmar disponibilidad, atender solicitudes de productos y mantener comunicación con pacientes o prospectos.',
  },
  {
    title: 'Protección de datos',
    body:
      'PodoMedic adopta medidas razonables para proteger la información personal recabada, sin perjuicio de las limitaciones inherentes a cualquier sistema tecnológico.',
  },
  {
    title: 'Derechos del titular',
    body:
      'El usuario podrá solicitar acceso, rectificación, cancelación u oposición respecto de sus datos personales a través de los medios de contacto disponibles en este sitio.',
  },
  {
    title: 'Actualizaciones',
    body:
      'Este aviso puede modificarse cuando existan cambios legales, operativos o de servicio. Toda actualización será publicada en esta misma página.',
  },
];

export default function PrivacyPage() {
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
          <h1 className="mt-6 text-4xl font-black text-slate-950 sm:text-5xl">Aviso de Privacidad</h1>

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
