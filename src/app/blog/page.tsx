'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { CalendarDays, ArrowRight } from 'lucide-react';
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

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      if (!db) {
        setLoading(false);
        return;
      }

      try {
        const snapshot = await getDocs(
          query(collection(db, 'blog_posts'), where('published', '==', true), orderBy('publishedAt', 'desc')),
        );
        setPosts(
          snapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data(),
          })) as BlogPost[],
        );
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

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

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-slate-500 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              Cargando artículos...
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-slate-500 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              Aún no hay artículos publicados.
            </div>
          ) : (
            posts.map((post) => (
              <article
                key={post.id}
                className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]"
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
