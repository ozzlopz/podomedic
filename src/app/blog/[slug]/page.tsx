'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { db } from '@/lib/firebase';
import { useParams } from 'next/navigation';

type BlogPost = {
  id: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  coverImage?: string;
  contentHtml?: string;
  published?: boolean;
  publishedAt?: { seconds?: number } | null;
};

export default function BlogDetailPage() {
  const params = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPost = async () => {
      if (!db) {
        setLoading(false);
        return;
      }

      try {
        const snapshot = await getDocs(
          query(collection(db, 'blog_posts'), where('slug', '==', params.slug), where('published', '==', true)),
        );

        if (!snapshot.empty) {
          const docItem = snapshot.docs[0];
          setPost({
            id: docItem.id,
            ...docItem.data(),
          } as BlogPost);
        }
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [params.slug]);

  return (
    <div className="flex-1 bg-[linear-gradient(180deg,#f8fbff_0%,#eef8fb_44%,#ffffff_100%)] px-4 pb-20 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="py-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al blog
          </Link>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-slate-500 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            Cargando artículo...
          </div>
        ) : !post ? (
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-slate-500 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            No se encontró el artículo solicitado.
          </div>
        ) : (
          <article className="overflow-hidden rounded-[2.5rem] border border-slate-200/80 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.08)]">
            <div className="relative h-[320px] bg-slate-100 sm:h-[420px]">
              {post.coverImage ? (
                <Image src={post.coverImage} alt={post.title ?? 'Artículo del blog'} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,#67e8f9,transparent_45%),linear-gradient(135deg,#0f172a,#164e63)] text-white">
                  <span className="text-2xl font-bold">PodoMedic Blog</span>
                </div>
              )}
            </div>

            <div className="p-6 sm:p-10">
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
              <h1 className="mt-5 text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
                {post.title ?? 'Artículo sin título'}
              </h1>
              {post.excerpt && <p className="mt-5 text-lg leading-relaxed text-slate-600">{post.excerpt}</p>}

              <div
                className="mt-10 [&_.ProseMirror-youtube-iframe]:aspect-video [&_.ProseMirror-youtube-iframe]:w-full [&_a]:text-cyan-700 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-cyan-200 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h1]:mt-8 [&_h1]:text-4xl [&_h1]:font-black [&_h2]:mt-8 [&_h2]:text-3xl [&_h2]:font-black [&_h3]:mt-6 [&_h3]:text-2xl [&_h3]:font-bold [&_img]:my-6 [&_img]:rounded-3xl [&_img]:shadow-md [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mt-4 [&_p]:leading-relaxed [&_ul]:list-disc"
                dangerouslySetInnerHTML={{ __html: post.contentHtml ?? '<p>Sin contenido.</p>' }}
              />
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
