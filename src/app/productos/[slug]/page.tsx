'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { ArrowLeft, BadgeDollarSign, ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { db } from '@/lib/firebase';
import { useParams } from 'next/navigation';
import type { StoreProduct } from '@/types/store';

function formatCurrency(value?: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const { addItem } = useCart();
  const [product, setProduct] = useState<StoreProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      if (!db) {
        setLoading(false);
        return;
      }

      try {
        const snapshot = await getDocs(
          query(collection(db, 'products'), where('slug', '==', params.slug), where('activeInStore', '==', true)),
        );

        if (!snapshot.empty) {
          const docItem = snapshot.docs[0];
          setProduct({
            id: docItem.id,
            ...docItem.data(),
          } as StoreProduct);
        }
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [params.slug]);

  return (
    <div className="flex-1 bg-[linear-gradient(180deg,#f8fbff_0%,#eef8fb_44%,#ffffff_100%)] px-4 pb-20 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="py-8">
          <Link
            href="/productos"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a productos
          </Link>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-slate-500 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            Cargando producto...
          </div>
        ) : !product ? (
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-slate-500 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            No se encontró el producto solicitado.
          </div>
        ) : (
          <article className="overflow-hidden rounded-[2.5rem] border border-slate-200/80 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.08)]">
            <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="relative min-h-[340px] bg-slate-100 sm:min-h-[480px]">
                {product.imageUrl ? (
                  <Image src={product.imageUrl} alt={product.name ?? 'Producto'} fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,#67e8f9,transparent_45%),linear-gradient(135deg,#0f172a,#164e63)] text-white">
                    <span className="text-2xl font-bold">PodoMedic</span>
                  </div>
                )}
              </div>

              <div className="p-6 sm:p-10">
                <div className="flex items-center gap-2 text-sm text-cyan-700">
                  <BadgeDollarSign className="h-4 w-4" />
                  {formatCurrency(product.price)}
                </div>
                <h1 className="mt-5 text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
                  {product.name ?? 'Producto sin nombre'}
                </h1>
                <p className="mt-6 text-base leading-relaxed text-slate-600">
                  {product.description ?? 'Sin descripción disponible.'}
                </p>

                <div className="mt-10 rounded-[1.75rem] border border-cyan-100 bg-cyan-50/60 p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Interesado en este producto</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    Si deseas información o disponibilidad, contáctanos por WhatsApp o agenda una cita para una
                    recomendación más personalizada.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => product && addItem(product)}
                      className="inline-flex items-center gap-2 rounded-full bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Agregar al carrito
                    </button>
                    <Link
                      href="/contact"
                      className="rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Contactar
                    </Link>
                    <Link
                      href="/booking"
                      className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
                    >
                      Reservar cita
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
