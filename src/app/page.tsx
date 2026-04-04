import type { Metadata } from 'next';
import Link from 'next/link';
import Slideshow from '@/components/Slideshow';
import { Stethoscope, Users, Award, Clock, Footprints, Shield, Zap, ArrowRight, HeartPulse, Sparkles } from 'lucide-react';
import { businessAddress, businessCity, businessCountry, businessPhoneDisplay, businessPhoneIntl, businessRegion, siteDescription, siteUrl } from '@/lib/site';

const services = [
  {
    title: 'Control de Diabetes e Hipertensión',
    description: 'Monitoreo especializado para proteger la salud del pie en condiciones crónicas.',
    icon: Stethoscope,
    accent: 'text-cyan-500',
    bg: 'from-cyan-500/16 to-blue-500/10',
  },
  {
    title: 'Uñas Encarnadas',
    description: 'Tratamiento preciso y seguro para aliviar dolor y prevenir infecciones.',
    icon: Footprints,
    accent: 'text-blue-500',
    bg: 'from-blue-500/16 to-sky-500/10',
  },
  {
    title: 'Hongos en las Uñas',
    description: 'Diagnóstico y cuidado profesional para uñas más sanas y fuertes.',
    icon: Shield,
    accent: 'text-emerald-500',
    bg: 'from-emerald-500/16 to-teal-500/10',
  },
  {
    title: 'Callosidades',
    description: 'Eliminación experta de callos con énfasis en comodidad y prevención.',
    icon: Zap,
    accent: 'text-indigo-500',
    bg: 'from-indigo-500/16 to-blue-500/10',
  },
  {
    title: 'Atención a Adulto Mayor',
    description: 'Cuidado especializado y compasivo para las necesidades únicas de nuestros adultos mayores.',
    icon: Users,
    accent: 'text-violet-500',
    bg: 'from-violet-500/16 to-fuchsia-500/10',
  },
];

const trustPoints = [
  'Valoración médica especializada para cada paciente.',
  'Plan de tratamiento seguro para diabetes e hipertensión.',
  'Seguimiento profesional y prevención de complicaciones.',
];

export const metadata: Metadata = {
  title: 'Podólogo en Pachuca',
  description: siteDescription,
  alternates: {
    canonical: '/',
  },
};

export default function Home() {
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name: 'PodoMedic',
    url: siteUrl,
    telephone: businessPhoneIntl,
    image: `${siteUrl}/images/logo.png`,
    description: siteDescription,
    areaServed: `${businessCity}, ${businessRegion}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: businessAddress,
      addressLocality: businessCity,
      addressRegion: businessRegion,
      addressCountry: businessCountry,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '11:00',
        closes: '19:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '10:00',
        closes: '14:00',
      },
    ],
  };

  return (
    <div className="-mt-24 flex-1 bg-[linear-gradient(180deg,#f7fbff_0%,#eef7fb_42%,#ffffff_100%)] sm:-mt-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <section className="pt-0">
        <Slideshow />
      </section>

      <section className="relative overflow-hidden px-4 py-24 sm:px-6">
        <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.16),transparent_60%)]" />
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div>
              <span className="inline-flex rounded-full border border-cyan-200 bg-white/80 px-4 py-2 text-sm font-semibold uppercase tracking-[0.26em] text-cyan-700 shadow-sm backdrop-blur-sm">
                Atención médica especializada
              </span>
              <h2 className="mt-6 max-w-3xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Podología médica en Pachuca con una experiencia más humana, precisa y confiable.
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
                En PodoMedic, nuestra atención en Pachuca de Soto es brindada por un especialista en podología médica, con experiencia en el manejo de pie diabético, hipertensión y otras condiciones que requieren cuidado profesional.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/booking" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 font-semibold text-white transition-all hover:bg-slate-800">
                  Reservar cita
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/contact" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition-all hover:border-cyan-200 hover:text-cyan-700">
                  Hablar con nosotros
                </Link>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm">
                  <HeartPulse className="h-7 w-7 text-cyan-600" />
                  <p className="mt-4 text-2xl font-black text-slate-950">Atención clínica</p>
                  <p className="mt-1 text-sm text-slate-600">Tratamientos con enfoque médico y preventivo.</p>
                </div>
                <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm">
                  <Award className="h-7 w-7 text-blue-600" />
                  <p className="mt-4 text-2xl font-black text-slate-950">Diagnóstico claro</p>
                  <p className="mt-1 text-sm text-slate-600">Evaluación profesional antes de intervenir.</p>
                </div>
                <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm">
                  <Sparkles className="h-7 w-7 text-teal-600" />
                  <p className="mt-4 text-2xl font-black text-slate-950">Cuidado continuo</p>
                  <p className="mt-1 text-sm text-slate-600">Seguimiento y prevención para mejores resultados.</p>
                </div>
              </div>
            </div>
            <div className="relative rounded-[2rem] border border-cyan-100 bg-slate-950 p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
              <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">Servicio médico con confianza</p>
              <h3 className="mt-5 text-3xl font-black leading-tight">Un consultorio pensado para pacientes que buscan seguridad y claridad.</h3>
              <ul className="mt-8 space-y-4 text-white/85">
                {trustPoints.map((item) => (
                  <li key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-teal-600">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/6 p-4 text-center">
                  <p className="text-2xl font-black text-white">Lun-Sáb</p>
                  <p className="mt-2 text-[0.7rem] uppercase tracking-[0.16em] text-white/55">Disponibilidad</p>
                </div>
                <div className="rounded-2xl bg-white/6 p-4 text-center">
                  <p className="text-2xl font-black text-white">100%</p>
                  <p className="mt-2 text-[0.7rem] uppercase tracking-[0.16em] text-white/55">Personalizado</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex rounded-full border border-cyan-100 bg-cyan-50 px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700">
                Nuestros servicios
              </span>
              <h2 className="mt-5 text-4xl font-black text-slate-950 sm:text-5xl">Tratamientos diseñados para aliviar, prevenir y acompañar.</h2>
            </div>
            <p className="max-w-xl text-lg leading-relaxed text-slate-600">
              Cada servicio combina valoración médica, técnica precisa y seguimiento para ofrecerte una atención clara desde la primera consulta.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {services.map(({ title, description, icon: Icon, accent, bg }) => (
              <article
                key={title}
                className="group relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white p-7 shadow-[0_18px_60px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(15,23,42,0.1)]"
              >
                <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${bg}`} />
                <div className={`relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-slate-100 ${accent}`}>
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="relative mt-6 text-2xl font-bold text-slate-950">{title}</h3>
                <p className="relative mt-3 leading-relaxed text-slate-600">{description}</p>
                <div className="relative mt-6 flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors group-hover:text-cyan-700">
                  Atención profesional
                  <ArrowRight className="h-4 w-4" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-[2.5rem] bg-slate-950 px-6 py-12 text-white shadow-[0_32px_100px_rgba(15,23,42,0.22)] sm:px-10 lg:px-14">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
            <div>
              <span className="inline-flex rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em] text-teal-200">
                ¿Por qué elegirnos?
              </span>
              <h2 className="mt-6 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
                Un espacio clínico moderno para cuidar tus pies con calma y precisión.
              </h2>
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <Clock className="h-8 w-8 text-teal-300" />
                  <h3 className="mt-4 text-xl font-bold">Horarios flexibles</h3>
                  <p className="mt-2 text-white/70">Atención de lunes a sábado adaptada a tu rutina.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <Award className="h-8 w-8 text-cyan-300" />
                  <h3 className="mt-4 text-xl font-bold">Profesionales certificados</h3>
                  <p className="mt-2 text-white/70">Experiencia clínica y evaluación responsable.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <Users className="h-8 w-8 text-sky-300" />
                  <h3 className="mt-4 text-xl font-bold">Atención personalizada</h3>
                  <p className="mt-2 text-white/70">Cada paciente recibe una recomendación clara y útil.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <Stethoscope className="h-8 w-8 text-emerald-300" />
                  <h3 className="mt-4 text-xl font-bold">Tecnología moderna</h3>
                  <p className="mt-2 text-white/70">Protocolos y herramientas pensadas para seguridad y confort.</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/6 p-8 backdrop-blur-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-200">Consulta informada</p>
              <h3 className="mt-4 text-3xl font-black">Lo que buscamos en cada cita</h3>
              <div className="mt-8 space-y-4">
                <div className="rounded-2xl bg-white/6 p-4">
                  <p className="font-semibold text-white">Diagnóstico entendible</p>
                  <p className="mt-1 text-sm text-white/70">Te explicamos el problema y el tratamiento sin rodeos.</p>
                </div>
                <div className="rounded-2xl bg-white/6 p-4">
                  <p className="font-semibold text-white">Intervención cuidadosa</p>
                  <p className="mt-1 text-sm text-white/70">Buscamos aliviar molestias con técnica y seguridad.</p>
                </div>
                <div className="rounded-2xl bg-white/6 p-4">
                  <p className="font-semibold text-white">Prevención real</p>
                  <p className="mt-1 text-sm text-white/70">No solo resolvemos hoy: ayudamos a evitar recaídas.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 pt-8 sm:px-6">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="grid gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center lg:px-14 lg:py-14">
            <div>
              <span className="inline-flex rounded-full border border-teal-100 bg-teal-50 px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em] text-teal-700">
                Agenda tu consulta
              </span>
              <h2 className="mt-5 text-4xl font-black text-slate-950 sm:text-5xl">Empieza hoy con un cuidado podológico más profesional.</h2>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
                Agenda tu cita en Pachuca y recibe una valoración clara, tratamiento seguro y recomendaciones útiles para el cuidado diario.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/booking" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-7 py-3 font-semibold text-white transition-all hover:bg-slate-800">
                  Reservar cita
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/contact" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-7 py-3 font-semibold text-slate-700 transition-all hover:border-cyan-200 hover:text-cyan-700">
                  Contactar
                </Link>
              </div>
            </div>
            <div className="rounded-[2rem] bg-[linear-gradient(180deg,#0f172a_0%,#082f49_100%)] p-6 text-white">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-200">Respuesta rápida</p>
              <p className="mt-4 text-3xl font-black">Atención cercana desde tu primer mensaje.</p>
              <p className="mt-3 text-white/70">Cuéntanos tu caso y te orientamos sobre la mejor forma de atenderlo.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-black text-teal-300">PodoMedic</h3>
              <p className="mt-4 max-w-md text-slate-300">
                Especialistas en podología médica en Pachuca con atención personalizada para el cuidado integral del pie.
                Tu salud podológica es nuestra prioridad.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Servicios</h4>
              <ul className="space-y-2 text-slate-300">
                <li><span className="transition-colors hover:text-teal-300">Control de Diabetes</span></li>
                <li><span className="transition-colors hover:text-teal-300">Uñas Encarnadas</span></li>
                <li><span className="transition-colors hover:text-teal-300">Hongos en las Uñas</span></li>
                <li><span className="transition-colors hover:text-teal-300">Callosidades</span></li>
                <li><span className="transition-colors hover:text-teal-300">Atención Adulto Mayor</span></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Contacto</h4>
              <div className="space-y-3 text-slate-300">
                <div className="flex items-center">
                  <span className="mr-2">📍</span>
                  <span>{businessAddress}, {businessCity}, {businessRegion}</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">📞</span>
                  <span>WhatsApp: {businessPhoneDisplay}</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">✉️</span>
                  <span>info@podomedic.com</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">🕐</span>
                  <span>Lun-Vie: 11:00 a.m. - 7:00 p.m. | Sáb: 10:00 a.m. - 2:00 p.m.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-slate-800 pt-8">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <p className="text-slate-400 text-sm">
                © 2024 PodoMedic. Todos los derechos reservados.
              </p>
              <div className="flex flex-wrap justify-center gap-6 md:justify-end">
                <span className="text-sm text-slate-400 transition-colors hover:text-teal-300">
                  Política de Privacidad
                </span>
                <span className="text-sm text-slate-400 transition-colors hover:text-teal-300">
                  Términos de Servicio
                </span>
                <span className="text-sm text-slate-400 transition-colors hover:text-teal-300">
                  Contacto
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
