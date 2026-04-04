'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { BadgeDollarSign, Boxes, ImagePlus, Package, Save, Store } from 'lucide-react';
import { db } from '@/lib/firebase';
import { uploadProductImage } from '@/lib/storage';

type Product = {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  activeInStore?: boolean;
  updatedAt?: { seconds?: number } | null;
};

const initialForm = {
  name: '',
  slug: '',
  description: '',
  imageUrl: '',
  price: '',
};

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatCurrency(value?: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadProducts = async () => {
    if (!db) {
      setError('No se pudo conectar con Firestore.');
      setLoading(false);
      return;
    }

    try {
      const snapshot = await getDocs(query(collection(db, 'products'), orderBy('updatedAt', 'desc')));
      setProducts(
        snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        })) as Product[],
      );
    } catch {
      setError('No fue posible cargar los productos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (!selectedProductId) {
      setForm(initialForm);
      return;
    }

    const selectedProduct = products.find((product) => product.id === selectedProductId);
    if (!selectedProduct) return;

    setForm({
      name: selectedProduct.name ?? '',
      slug: selectedProduct.slug ?? '',
      description: selectedProduct.description ?? '',
      imageUrl: selectedProduct.imageUrl ?? '',
      price: selectedProduct.price ? String(selectedProduct.price) : '',
    });
  }, [products, selectedProductId]);

  const activeProducts = products.filter((product) => product.activeInStore).length;
  const inventoryValue = products.reduce((total, product) => total + (product.activeInStore ? product.price ?? 0 : 0), 0);

  const handleNameChange = (value: string) => {
    setForm((current) => ({
      ...current,
      name: value,
      slug: current.slug || slugify(value),
    }));
  };

  const handleSave = async (activeInStore: boolean) => {
    if (!db) {
      setError('No se pudo conectar con Firestore.');
      return;
    }

    if (!form.name.trim() || !form.slug.trim() || !form.description.trim() || !form.price) {
      setError('Nombre, slug, descripción y precio son obligatorios.');
      return;
    }

    const numericPrice = Number(form.price);

    if (Number.isNaN(numericPrice)) {
      setError('El precio debe ser numérico.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      name: form.name.trim(),
      slug: slugify(form.slug.trim()),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      price: numericPrice,
      activeInStore,
      updatedAt: serverTimestamp(),
    };

    try {
      if (selectedProductId) {
        await updateDoc(doc(db, 'products', selectedProductId), payload);
      } else {
        const createdProduct = await addDoc(collection(db, 'products'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        setSelectedProductId(createdProduct.id);
      }

      setSuccess(activeInStore ? 'Producto activado en tienda.' : 'Producto guardado fuera de tienda.');
      await loadProducts();
    } catch {
      setError('No fue posible guardar el producto.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStore = async (product: Product) => {
    if (!db) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateDoc(doc(db, 'products', product.id), {
        activeInStore: !product.activeInStore,
        updatedAt: serverTimestamp(),
      });
      setSuccess(product.activeInStore ? 'Producto retirado de tienda.' : 'Producto activado en tienda.');
      await loadProducts();
    } catch {
      setError('No fue posible actualizar el estado en tienda.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    setError('');

    try {
      const imageUrl = await uploadProductImage(file);
      setForm((current) => ({
        ...current,
        imageUrl,
      }));
      setSuccess('Imagen del producto subida correctamente.');
    } catch {
      setError('No fue posible subir la imagen del producto.');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <span className="inline-flex rounded-full border border-cyan-100 bg-white/80 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700 shadow-sm backdrop-blur-sm">
          Productos
        </span>
        <h1 className="mt-6 text-4xl font-black text-slate-950 sm:text-5xl">Catálogo y control de tienda</h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">
          Crea productos, define precio, descripción e imagen, y decide si estarán visibles o no en la tienda pública.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <Package className="h-7 w-7 text-cyan-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">{loading ? '...' : products.length}</p>
          <p className="mt-1 text-sm text-slate-600">Productos totales</p>
        </div>
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <Store className="h-7 w-7 text-blue-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">{loading ? '...' : activeProducts}</p>
          <p className="mt-1 text-sm text-slate-600">Activos en tienda</p>
        </div>
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <BadgeDollarSign className="h-7 w-7 text-teal-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">{loading ? '...' : formatCurrency(inventoryValue)}</p>
          <p className="mt-1 text-sm text-slate-600">Valor visible en tienda</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-950">
                {selectedProductId ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              <p className="mt-2 text-slate-600">Completa la información del producto para el catálogo público.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedProductId(null);
                setForm(initialForm);
              }}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
            >
              Nuevo producto
            </button>
          </div>

          <div className="mt-8 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Nombre</span>
                <input
                  value={form.name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  placeholder="Ej. Crema podológica"
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
                  placeholder="crema-podologica"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Descripción</span>
                <textarea
                  rows={6}
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  placeholder="Describe el producto, beneficios, uso sugerido y detalles importantes."
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Precio</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.price}
                  onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  placeholder="280"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Imagen del producto</span>
              <div className="mt-2 space-y-3">
                <input
                  value={form.imageUrl}
                  onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  placeholder="https://..."
                />
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700">
                  <ImagePlus className="h-4 w-4" />
                  {uploadingImage ? 'Subiendo imagen...' : 'Subir a Firebase Storage'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      void handleImageUpload(file);
                      event.target.value = '';
                    }}
                  />
                </label>
                {form.imageUrl && (
                  <div className="relative h-56 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-100">
                    <Image src={form.imageUrl} alt="Vista previa del producto" fill className="object-cover" />
                  </div>
                )}
              </div>
            </label>

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
                Guardar fuera de tienda
              </button>
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Store className="h-4 w-4" />
                Activar en tienda
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <h2 className="text-2xl font-black text-slate-950">Productos</h2>
          <div className="mt-6 space-y-4">
            {loading && (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-500">
                Cargando productos...
              </div>
            )}

            {!loading && products.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-slate-500">
                Aún no hay productos creados.
              </div>
            )}

            {!loading &&
              products.map((product) => (
                <div
                  key={product.id}
                  className={`rounded-3xl border p-5 transition ${
                    selectedProductId === product.id
                      ? 'border-cyan-200 bg-cyan-50/50'
                      : 'border-slate-200 bg-slate-50 hover:border-cyan-200'
                  }`}
                >
                  <button type="button" onClick={() => setSelectedProductId(product.id)} className="w-full text-left">
                    <div className="flex items-start gap-4">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                        {product.imageUrl ? (
                          <Image src={product.imageUrl} alt={product.name ?? 'Producto'} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-400">
                            <Boxes className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <p className="text-lg font-bold text-slate-950">{product.name ?? 'Producto sin nombre'}</p>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                              product.activeInStore ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {product.activeInStore ? 'En tienda' : 'Oculto'}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm text-slate-600">{product.description ?? 'Sin descripción'}</p>
                        <p className="mt-3 text-sm font-semibold text-cyan-700">{formatCurrency(product.price)}</p>
                      </div>
                    </div>
                  </button>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStore(product)}
                      disabled={saving}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {product.activeInStore ? 'Desactivar en tienda' : 'Activar en tienda'}
                    </button>
                    {product.slug && product.activeInStore && (
                      <a
                        href={`/productos/${product.slug}`}
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
