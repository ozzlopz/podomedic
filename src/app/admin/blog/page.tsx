'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import Image from 'next/image';
import { BookText, Eye, ImagePlus, PenSquare, Rocket, Save } from 'lucide-react';
import BlogEditor from '@/components/BlogEditor';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { uploadBlogImage } from '@/lib/storage';

type BlogPost = {
  id: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  coverImage?: string;
  contentHtml?: string;
  contentText?: string;
  published?: boolean;
  publishedAt?: { seconds?: number } | null;
  updatedAt?: { seconds?: number } | null;
};

const initialForm = {
  title: '',
  slug: '',
  excerpt: '',
  coverImage: '',
  contentHtml: '<p>Empieza a escribir tu artículo...</p>',
  contentText: '',
};

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdminBlogPage() {
  const { profile, user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadPosts = async () => {
    if (!db) {
      setError('No se pudo conectar con Firestore.');
      setLoading(false);
      return;
    }

    try {
      const snapshot = await getDocs(query(collection(db, 'blog_posts'), orderBy('updatedAt', 'desc')));
      const loadedPosts = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      })) as BlogPost[];
      setPosts(loadedPosts);
    } catch {
      setError('No fue posible cargar las entradas del blog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    if (!selectedPostId) {
      setForm(initialForm);
      return;
    }

    const selectedPost = posts.find((post) => post.id === selectedPostId);
    if (!selectedPost) return;

    setForm({
      title: selectedPost.title ?? '',
      slug: selectedPost.slug ?? '',
      excerpt: selectedPost.excerpt ?? '',
      coverImage: selectedPost.coverImage ?? '',
      contentHtml: selectedPost.contentHtml ?? '<p></p>',
      contentText: selectedPost.contentText ?? '',
    });
  }, [posts, selectedPostId]);

  const publishedCount = posts.filter((post) => post.published).length;
  const draftCount = posts.length - publishedCount;

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedPostId) ?? null,
    [posts, selectedPostId],
  );

  const handleTitleChange = (value: string) => {
    setForm((current) => ({
      ...current,
      title: value,
      slug: current.slug || slugify(value),
    }));
  };

  const handleSave = async (publish: boolean) => {
    if (!db) {
      setError('No se pudo conectar con Firestore.');
      return;
    }

    if (!form.title.trim() || !form.slug.trim()) {
      setError('Título y slug son obligatorios.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      title: form.title.trim(),
      slug: slugify(form.slug.trim()),
      excerpt: form.excerpt.trim(),
      coverImage: form.coverImage.trim(),
      contentHtml: form.contentHtml,
      contentText: form.contentText,
      published: publish,
      updatedAt: serverTimestamp(),
      publishedAt: publish
        ? selectedPost?.publishedAt
          ? selectedPost.publishedAt
          : Timestamp.fromDate(new Date())
        : null,
      authorId: user?.uid ?? null,
      authorName: [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || user?.email || 'Admin',
    };

    try {
      if (selectedPostId) {
        await updateDoc(doc(db, 'blog_posts', selectedPostId), payload);
      } else {
        const createdPost = await addDoc(collection(db, 'blog_posts'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        setSelectedPostId(createdPost.id);
      }

      setSuccess(publish ? 'Entrada publicada correctamente.' : 'Borrador guardado correctamente.');
      await loadPosts();
    } catch {
      setError('No fue posible guardar la entrada.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublished = async (post: BlogPost) => {
    if (!db) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const nextPublished = !post.published;
      await updateDoc(doc(db, 'blog_posts', post.id), {
        published: nextPublished,
        publishedAt: nextPublished ? Timestamp.fromDate(new Date()) : null,
        updatedAt: serverTimestamp(),
      });
      setSuccess(nextPublished ? 'Entrada publicada.' : 'Entrada retirada del sitio público.');
      await loadPosts();
    } catch {
      setError('No fue posible actualizar el estado de publicación.');
    } finally {
      setSaving(false);
    }
  };

  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true);
    setError('');

    try {
      const imageUrl = await uploadBlogImage(file, 'covers');
      setForm((current) => ({
        ...current,
        coverImage: imageUrl,
      }));
      setSuccess('Imagen principal subida correctamente.');
    } catch {
      setError('No fue posible subir la imagen principal.');
    } finally {
      setUploadingCover(false);
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <span className="inline-flex rounded-full border border-cyan-100 bg-white/80 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700 shadow-sm backdrop-blur-sm">
          Blog
        </span>
        <h1 className="mt-6 text-4xl font-black text-slate-950 sm:text-5xl">Centro editorial del consultorio</h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">
          Crea, edita y publica artículos educativos para pacientes con un editor visual y control total del estado.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <BookText className="h-7 w-7 text-cyan-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">{loading ? '...' : publishedCount}</p>
          <p className="mt-1 text-sm text-slate-600">Artículos publicados</p>
        </div>
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <PenSquare className="h-7 w-7 text-blue-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">{loading ? '...' : draftCount}</p>
          <p className="mt-1 text-sm text-slate-600">Borradores activos</p>
        </div>
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <Eye className="h-7 w-7 text-teal-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">{loading ? '...' : posts.length}</p>
          <p className="mt-1 text-sm text-slate-600">Entradas totales</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-950">
                {selectedPostId ? 'Editar entrada' : 'Nueva entrada'}
              </h2>
              <p className="mt-2 text-slate-600">Editor visual con texto enriquecido, imágenes por URL y video embebido.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedPostId(null);
                setForm(initialForm);
              }}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
            >
              Nueva entrada
            </button>
          </div>

          <div className="mt-8 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Título</span>
                <input
                  value={form.title}
                  onChange={(event) => handleTitleChange(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  placeholder="Ej. Cómo prevenir uñas encarnadas"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Slug</span>
                <input
                  value={form.slug}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      slug: slugify(event.target.value),
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  placeholder="como-prevenir-unas-encarnadas"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Extracto</span>
              <textarea
                rows={3}
                value={form.excerpt}
                onChange={(event) => setForm((current) => ({ ...current, excerpt: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                placeholder="Resumen corto para tarjetas y SEO interno."
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Imagen principal (URL)</span>
              <div className="mt-2 space-y-3">
                <input
                  value={form.coverImage}
                  onChange={(event) => setForm((current) => ({ ...current, coverImage: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  placeholder="https://..."
                />
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700">
                  <ImagePlus className="h-4 w-4" />
                  {uploadingCover ? 'Subiendo imagen...' : 'Subir a Firebase Storage'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      void handleCoverUpload(file);
                      event.target.value = '';
                    }}
                  />
                </label>
                {form.coverImage && (
                  <div className="relative h-52 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-100">
                    <Image src={form.coverImage} alt="Vista previa de portada" fill className="object-cover" />
                  </div>
                )}
              </div>
            </label>

            <div>
              <span className="text-sm font-semibold text-slate-700">Contenido</span>
              <div className="mt-2">
                <BlogEditor
                  content={form.contentHtml}
                  onUploadImage={(file) => uploadBlogImage(file, 'inline')}
                  onChange={(contentHtml, contentText) =>
                    setForm((current) => ({
                      ...current,
                      contentHtml,
                      contentText,
                    }))
                  }
                />
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                Guardar borrador
              </button>
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Rocket className="h-4 w-4" />
                Publicar
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <h2 className="text-2xl font-black text-slate-950">Entradas del blog</h2>
          <div className="mt-6 space-y-4">
            {loading && (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-500">
                Cargando entradas...
              </div>
            )}

            {!loading && posts.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-slate-500">
                Aún no has creado artículos.
              </div>
            )}

            {!loading &&
              posts.map((post) => (
                <div
                  key={post.id}
                  className={`rounded-3xl border p-5 transition ${
                    selectedPostId === post.id
                      ? 'border-cyan-200 bg-cyan-50/50'
                      : 'border-slate-200 bg-slate-50 hover:border-cyan-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedPostId(post.id)}
                    className="w-full text-left"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-lg font-bold text-slate-950">{post.title ?? 'Entrada sin título'}</p>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                            post.published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {post.published ? 'Publicado' : 'Borrador'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{post.excerpt ?? 'Sin extracto'}</p>
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">/{post.slug ?? 'sin-slug'}</p>
                    </div>
                  </button>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleTogglePublished(post)}
                      disabled={saving}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {post.published ? 'Despublicar' : 'Publicar'}
                    </button>
                    {post.slug && post.published && (
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
                      >
                        Ver público
                      </a>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </section>
      </section>
    </div>
  );
}
