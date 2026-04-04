'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { ArrowRight, BadgeDollarSign } from 'lucide-react';
import { db } from '@/lib/firebase';

type Product = {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  activeInStore?: boolean;
};

function formatCurrency(value?: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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
          })) as Product[],
        );
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

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

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-slate-500 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              Cargando productos...
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-slate-500 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              Aún no hay productos disponibles en tienda.
            </div>
          ) : (
            products.map((product) => (
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
                  <Link
                    href={`/productos/${product.slug}`}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Ver detalle
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
