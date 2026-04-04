import { BookText, Eye, PenSquare } from 'lucide-react';

const posts = [
  { title: 'Cuidados básicos para el pie diabético', status: 'Publicado', date: '05 Abr 2026' },
  { title: 'Cómo prevenir uñas encarnadas', status: 'Borrador', date: '03 Abr 2026' },
  { title: 'Hongos en las uñas: señales comunes', status: 'Programado', date: '08 Abr 2026' },
];

export default function AdminBlogPage() {
  return (
    <div className="space-y-8">
      <section>
        <span className="inline-flex rounded-full border border-cyan-100 bg-white/80 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700 shadow-sm backdrop-blur-sm">
          Blog
        </span>
        <h1 className="mt-6 text-4xl font-black text-slate-950 sm:text-5xl">Centro editorial del consultorio</h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">
          Aquí podrás administrar artículos educativos y campañas de contenido para pacientes.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <BookText className="h-7 w-7 text-cyan-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">18</p>
          <p className="mt-1 text-sm text-slate-600">Artículos publicados</p>
        </div>
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <PenSquare className="h-7 w-7 text-blue-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">4</p>
          <p className="mt-1 text-sm text-slate-600">Borradores activos</p>
        </div>
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <Eye className="h-7 w-7 text-teal-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">12.4k</p>
          <p className="mt-1 text-sm text-slate-600">Visualizaciones del mes</p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <h2 className="text-2xl font-black text-slate-950">Artículos recientes</h2>
        <div className="mt-6 space-y-4">
          {posts.map((post) => (
            <div key={post.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-bold text-slate-950">{post.title}</p>
                  <p className="text-sm text-slate-600">{post.status}</p>
                </div>
                <span className="text-sm font-semibold text-cyan-700">{post.date}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
