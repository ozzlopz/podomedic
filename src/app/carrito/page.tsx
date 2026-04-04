'use client';

import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { functions } from '@/lib/firebase';
import { buildCartInquiryMessage, buildWhatsAppUrl } from '@/lib/contact';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function CartPage() {
  const { items, itemCount, subtotal, removeItem, updateQuantity, clearCart } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [requestError, setRequestError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const cartMessage = buildCartInquiryMessage(items, subtotal, {
    customerName: customerName.trim(),
    customerEmail: customerEmail.trim(),
    customerPhone: customerPhone.trim(),
    notes: notes.trim(),
  });
  const contactHref = `/contact?message=${encodeURIComponent(cartMessage)}`;

  const handleWhatsAppRequest = async () => {
    setRequestError('');
    setRequestSuccess('');

    if (!items.length) {
      setRequestError('Agrega al menos un producto antes de enviar la solicitud.');
      return;
    }

    if (!customerName.trim() || !customerEmail.trim()) {
      setRequestError('Nombre y correo son obligatorios para registrar la solicitud.');
      return;
    }

    if (!functions) {
      setRequestError('Firebase todavía no está disponible. Recarga la página e inténtalo de nuevo.');
      return;
    }

    setIsSubmittingRequest(true);

    try {
      const createPurchaseRequest = httpsCallable<
        {
          name: string;
          email: string;
          phone: string;
          notes: string;
          subtotal: number;
          source: 'cart_whatsapp';
          items: Array<{
            id: string;
            slug: string;
            name: string;
            price: number;
            quantity: number;
          }>;
        },
        { requestId: string; message: string }
      >(functions, 'createPurchaseRequest');

      const response = await createPurchaseRequest({
        name: customerName.trim(),
        email: customerEmail.trim(),
        phone: customerPhone.trim(),
        notes: notes.trim(),
        subtotal,
        source: 'cart_whatsapp',
        items: items.map((item) => ({
          id: item.id,
          slug: item.slug,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      });

      const message = buildCartInquiryMessage(items, subtotal, {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        notes: notes.trim(),
        reference: response.data.requestId,
      });

      setRequestSuccess(`Solicitud registrada con folio ${response.data.requestId}.`);
      window.location.assign(buildWhatsAppUrl(message));
    } catch (error) {
      const nextError =
        error instanceof Error
          ? error.message
          : 'No pudimos registrar tu solicitud. Intenta nuevamente en unos segundos.';
      setRequestError(nextError);
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  return (
    <div className="flex-1 bg-[linear-gradient(180deg,#f8fbff_0%,#eef8fb_44%,#ffffff_100%)] px-4 pb-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <section className="py-8">
          <span className="inline-flex rounded-full border border-cyan-100 bg-white/80 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700 shadow-sm backdrop-blur-sm">
            Carrito
          </span>
          <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
            Tu selección de productos para cuidado y seguimiento en casa.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-600">
            Revisa tu pedido, ajusta cantidades y luego contáctanos para confirmar disponibilidad y entrega.
          </p>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_380px]">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black text-slate-950">Productos en carrito</h2>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:text-rose-600"
                >
                  Vaciar carrito
                </button>
              )}
            </div>

            <div className="mt-6 space-y-4">
              {items.length === 0 ? (
                <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                  <ShoppingCart className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-4 text-lg font-semibold text-slate-700">Tu carrito está vacío</p>
                  <p className="mt-2 text-sm">Explora el catálogo para agregar productos.</p>
                  <Link
                    href="/productos"
                    className="mt-6 inline-flex items-center rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Ver productos
                  </Link>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <div className="relative h-24 w-full overflow-hidden rounded-2xl bg-slate-100 sm:h-24 sm:w-24">
                        {item.imageUrl ? (
                          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-400">
                            <ShoppingCart className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <Link href={`/productos/${item.slug}`} className="text-lg font-bold text-slate-950 hover:text-cyan-700">
                              {item.name}
                            </Link>
                            <p className="mt-1 text-sm font-semibold text-cyan-700">{formatCurrency(item.price)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 transition hover:border-rose-200 hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Quitar
                          </button>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-4">
                          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="min-w-10 text-center text-sm font-bold text-slate-950">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          <p className="text-sm font-bold text-slate-950">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <aside className="rounded-[2rem] border border-cyan-100 bg-slate-950 p-8 text-white shadow-[0_28px_80px_rgba(15,23,42,0.18)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">Resumen</p>
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <span className="text-white/70">Productos</span>
                <span className="text-lg font-bold text-white">{itemCount}</span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <span className="text-white/70">Subtotal</span>
                <span className="text-lg font-bold text-white">{formatCurrency(subtotal)}</span>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Siguiente paso</p>
              <p className="mt-3 text-sm leading-relaxed text-white/75">
                El carrito te ayuda a seleccionar productos. La confirmación final de compra, existencia y entrega se
                hace directamente con PodoMedic.
              </p>
              <div className="mt-5 space-y-3">
                <div>
                  <label htmlFor="customerName" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
                    Nombre completo
                  </label>
                  <input
                    id="customerName"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder="Tu nombre"
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-cyan-300"
                  />
                </div>
                <div>
                  <label htmlFor="customerEmail" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
                    Correo
                  </label>
                  <input
                    id="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(event) => setCustomerEmail(event.target.value)}
                    placeholder="tu@email.com"
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-cyan-300"
                  />
                </div>
                <div>
                  <label htmlFor="customerPhone" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
                    WhatsApp o teléfono
                  </label>
                  <input
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(event) => setCustomerPhone(event.target.value)}
                    placeholder="771 962 5242"
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-cyan-300"
                  />
                </div>
                <div>
                  <label htmlFor="customerNotes" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
                    Notas adicionales
                  </label>
                  <textarea
                    id="customerNotes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Entrega, dudas o indicaciones especiales"
                    rows={4}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-cyan-300"
                  />
                </div>
              </div>

              {requestError && (
                <div className="mt-4 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {requestError}
                </div>
              )}

              {requestSuccess && (
                <div className="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                  {requestSuccess}
                </div>
              )}

              <div className="mt-5 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleWhatsAppRequest}
                  disabled={isSubmittingRequest || items.length === 0}
                  className="rounded-full bg-cyan-500 px-4 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                >
                  {isSubmittingRequest ? 'Guardando solicitud...' : 'Guardar solicitud y abrir WhatsApp'}
                </button>
                <Link
                  href={contactHref}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Pasar a contacto con pedido
                </Link>
                <Link
                  href="/productos"
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Seguir comprando
                </Link>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
