'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { ArrowRight, BadgeDollarSign, Search, ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { db } from '@/lib/firebase';
import type { StoreProduct } from '@/types/store';

type ProductSort = 'recent' | 'price-asc' | 'price-desc' | 'name';

function formatCurrency(value?: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export default function ProductsPage() {
  const { addItem } = useCart();
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<ProductSort>('recent');

  useEffect(() => {
    const loadProducts = async () => {
      if (!db) {
        setLoading(false);
        return;
      }

      try {
        const snapshot = await getDocs(
          query(collection(db, 'products'), where('activeInStore', '==', true), orderBy('updatedAt', 'desc')),
        );
        setProducts(
          snapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data(),
          })) as StoreProduct[],
        );
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredProducts = useMemo(() => {
    const nextProducts = products.filter((product) => {
      const searchableText = [product.name, product.description].filter(Boolean).join(' ').toLowerCase();
      return normalizedSearch ? searchableText.includes(normalizedSearch) : true;
    });

    const sortedProducts = [...nextProducts];

    if (sortBy === 'price-asc') {
      sortedProducts.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    } else if (sortBy === 'price-desc') {
      sortedProducts.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    } else if (sortBy === 'name') {
      sortedProducts.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'es-MX'));
    }

    return sortedProducts;
  }, [normalizedSearch, products, sortBy]);

  const sortChips: Array<{ value: ProductSort; label: string }> = [
    { value: 'recent', label: 'Más recientes' },
    { value: 'price-asc', label: 'Menor precio' },
    { value: 'price-desc', label: 'Mayor precio' },
    { value: 'name', label: 'A-Z' },
  ];

  return (
    <div className="flex-1 bg-[linear-gradient(180deg,#f8fbff_0%,#eef8fb_44%,#ffffff_100%)] px-4 pb-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <section className="py-8">
          <span className="inline-flex rounded-full border border-cyan-100 bg-white/80 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700 shadow-sm backdrop-blur-sm">
            Productos
          </span>
          <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Productos seleccionados para el cuidado podológico y seguimiento en casa.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-600">
            Explora productos recomendados por PodoMedic para hidratación, soporte y cuidado cotidiano de tus pies.
          </p>
        </section>

        <section className="rounded-[2rem] border border-slate-200/80 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Encuentra el producto ideal</h2>
              <p className="mt-2 text-slate-600">Busca por nombre o descripción y ordena el catálogo como prefieras.</p>
            </div>
            <label className="relative block w-full max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar producto"
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

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-slate-500 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              Cargando productos...
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-slate-500 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              Aún no hay productos disponibles en tienda.
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-slate-500 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:col-span-2 xl:col-span-3">
              No encontramos productos que coincidan con tu búsqueda.
            </div>
          ) : (
            filteredProducts.map((product) => (
              <article
                key={product.id}
                className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]"
              >
                <div className="relative h-64 bg-slate-100">
                  {product.imageUrl ? (
                    <Image src={product.imageUrl} alt={product.name ?? 'Producto'} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,#67e8f9,transparent_45%),linear-gradient(135deg,#0f172a,#164e63)] text-white">
                      <span className="text-lg font-bold">PodoMedic</span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-cyan-700">
                    <BadgeDollarSign className="h-4 w-4" />
                    {formatCurrency(product.price)}
                  </div>
                  <h2 className="mt-4 text-2xl font-black text-slate-950">{product.name ?? 'Producto sin nombre'}</h2>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">
                    {product.description ?? 'Sin descripción disponible.'}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => addItem(product)}
                      className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Agregar
                    </button>
                    <Link
                      href={`/productos/${product.slug}`}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Ver detalle
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
