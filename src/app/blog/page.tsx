'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { CalendarDays, ArrowRight, Search } from 'lucide-react';
import { db } from '@/lib/firebase';

type BlogPost = {
  id: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  coverImage?: string;
  published?: boolean;
  publishedAt?: { seconds?: number } | null;
};

type BlogSort = 'recent' | 'oldest' | 'title';

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<BlogSort>('recent');

  useEffect(() => {
    const loadPosts = async () => {
      if (!db) {
        setLoading(false);
        return;
      }

      try {
        const snapshot = await getDocs(query(collection(db, 'blog_posts'), where('published', '==', true)));
        setPosts(
          snapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data(),
          })) as BlogPost[],
        );
        setError('');
      } catch {
        setError('No fue posible cargar los artículos publicados.');
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredPosts = useMemo(() => {
    const nextPosts = posts.filter((post) => {
      const searchableText = [post.title, post.excerpt].filter(Boolean).join(' ').toLowerCase();
      return normalizedSearch ? searchableText.includes(normalizedSearch) : true;
    });

    const sortedPosts = [...nextPosts];

    if (sortBy === 'recent') {
      sortedPosts.sort((a, b) => (b.publishedAt?.seconds ?? 0) - (a.publishedAt?.seconds ?? 0));
    } else if (sortBy === 'oldest') {
      sortedPosts.sort((a, b) => (a.publishedAt?.seconds ?? 0) - (b.publishedAt?.seconds ?? 0));
    } else if (sortBy === 'title') {
      sortedPosts.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? '', 'es-MX'));
    }

    return sortedPosts;
  }, [normalizedSearch, posts, sortBy]);

  const sortChips: Array<{ value: BlogSort; label: string }> = [
    { value: 'recent', label: 'Más recientes' },
    { value: 'oldest', label: 'Más antiguos' },
    { value: 'title', label: 'A-Z' },
  ];

  return (
    <div className="flex-1 bg-[linear-gradient(180deg,#f8fbff_0%,#eef8fb_44%,#ffffff_100%)] px-4 pb-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <section className="py-8">
          <span className="inline-flex rounded-full border border-cyan-100 bg-white/80 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700 shadow-sm backdrop-blur-sm">
            Blog
          </span>
          <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Consejos, prevención y educación podológica para cuidar mejor tus pies.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-600">
            Explora artículos publicados por PodoMedic sobre pie diabético, uñas encarnadas, higiene, prevención y
            seguimiento clínico.
          </p>
        </section>

        <section className="rounded-[2rem] border border-slate-200/80 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Encuentra el tema que buscas</h2>
              <p className="mt-2 text-slate-600">Busca por título o extracto y organiza las publicaciones según prefieras.</p>
            </div>
            <label className="relative block w-full max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar artículo"
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {sortChips.map((chip) => {
              const isActive = sortBy === chip.value;

              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setSortBy(chip.value)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-slate-950 text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)]'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-cyan-200 hover:text-cyan-700'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-slate-500 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              Cargando artículos...
            </div>
          ) : error ? (
            <div className="rounded-[2rem] border border-red-100 bg-red-50 p-8 text-red-600 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:col-span-2 xl:col-span-3">
              {error}
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-slate-500 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              Aún no hay artículos publicados.
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-slate-500 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:col-span-2 xl:col-span-3">
              No encontramos artículos que coincidan con tu búsqueda.
            </div>
          ) : (
            filteredPosts.map((post) => (
              <article
                key={post.id}
                className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_30px_90px_rgba(15,23,42,0.12)]"
              >
                <div className="relative h-56 bg-slate-100">
                  {post.coverImage ? (
                    <Image src={post.coverImage} alt={post.title ?? 'Artículo del blog'} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,#67e8f9,transparent_45%),linear-gradient(135deg,#0f172a,#164e63)] text-white">
                      <span className="text-lg font-bold">PodoMedic Blog</span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-cyan-700">
                    <CalendarDays className="h-4 w-4" />
                    {post.publishedAt?.seconds
                      ? new Date(post.publishedAt.seconds * 1000).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'Sin fecha'}
                  </div>
                  <h2 className="mt-4 text-2xl font-black text-slate-950">{post.title ?? 'Artículo sin título'}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{post.excerpt ?? 'Sin extracto disponible.'}</p>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Leer artículo
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
