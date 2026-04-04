'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, Mail, MessageSquareMore, Package, Phone, ReceiptText, UserRound } from 'lucide-react';
import { db } from '@/lib/firebase';

type PurchaseRequestStatus = 'new' | 'contacted' | 'completed' | 'cancelled';

type PurchaseRequestItem = {
  id?: string;
  slug?: string;
  name?: string;
  price?: number;
  quantity?: number;
};

type PurchaseRequest = {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  subtotal?: number;
  itemCount?: number;
  status?: PurchaseRequestStatus;
  source?: string;
  createdAt?: { seconds?: number };
  items?: PurchaseRequestItem[];
};

function formatCurrency(value?: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export default function PurchaseRequestDetailPage() {
  const params = useParams<{ requestId: string }>();
  const requestId = params.requestId;
  const [purchaseRequest, setPurchaseRequest] = useState<PurchaseRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadRequest = useCallback(async () => {
    if (!db) {
      setError('No se pudo conectar con Firestore.');
      setLoading(false);
      return;
    }

    try {
      const snapshot = await getDoc(doc(db, 'purchase_requests', requestId));

      if (!snapshot.exists()) {
        setError('No se encontró la solicitud de compra.');
        setLoading(false);
        return;
      }

      setPurchaseRequest(snapshot.data() as PurchaseRequest);
      setError('');
    } catch {
      setError('No fue posible cargar el detalle de la solicitud.');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    loadRequest();
  }, [loadRequest]);

  const handleStatusChange = async (status: PurchaseRequestStatus) => {
    if (!db || !purchaseRequest) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateDoc(doc(db, 'purchase_requests', requestId), { status });
      setSuccess('Estado de la solicitud actualizado.');
      await loadRequest();
    } catch {
      setError('No fue posible actualizar el estado de la solicitud.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <Link
          href="/admin/solicitudes-compra"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a solicitudes
        </Link>
        <h1 className="mt-6 text-4xl font-black text-slate-950 sm:text-5xl">Detalle de la solicitud</h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">
          Revisa datos del cliente, productos solicitados y cambia el estado de seguimiento comercial.
        </p>
      </section>

      {loading && (
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-slate-500 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          Cargando solicitud...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-[2rem] border border-red-100 bg-red-50 p-8 text-red-600 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          {error}
        </div>
      )}

      {!loading && !error && purchaseRequest && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_380px]">
          <div className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-950">Cliente solicitante</h2>
                  <p className="mt-2 text-slate-600">Información capturada desde el carrito antes de abrir WhatsApp.</p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Nombre</p>
                  <p className="mt-2 text-lg font-bold text-slate-950">{purchaseRequest.customerName ?? 'Sin nombre'}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Estado</p>
                  <p className="mt-2 text-lg font-bold text-slate-950">{purchaseRequest.status ?? 'new'}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    <Mail className="h-3.5 w-3.5" />
                    Correo
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-950">{purchaseRequest.customerEmail ?? 'Sin correo'}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    <Phone className="h-3.5 w-3.5" />
                    Teléfono
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-950">{purchaseRequest.customerPhone ?? 'Sin teléfono'}</p>
                </div>
              </div>

              <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  <MessageSquareMore className="h-3.5 w-3.5" />
                  Notas
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {purchaseRequest.notes?.trim() || 'No se registraron notas adicionales.'}
                </p>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-950">Productos solicitados</h2>
                  <p className="mt-2 text-slate-600">Resumen completo del contenido enviado desde el carrito.</p>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                {purchaseRequest.items?.length ? (
                  purchaseRequest.items.map((item, index) => (
                    <div key={`${item.id ?? item.slug ?? index}-${index}`} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-lg font-bold text-slate-950">{item.name ?? 'Producto'}</p>
                          <p className="mt-1 text-sm text-slate-600">Slug: {item.slug ?? 'sin-slug'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-cyan-700">Cantidad: {item.quantity ?? 0}</p>
                          <p className="mt-1 text-sm font-semibold text-slate-950">
                            {formatCurrency((item.price ?? 0) * (item.quantity ?? 0))}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-slate-500">
                    Esta solicitud no tiene productos registrados.
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-cyan-100 bg-slate-950 p-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">Resumen</p>
              <div className="mt-8 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-sm text-white/60">Folio</p>
                  <p className="mt-2 text-lg font-bold text-white">{requestId}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-sm text-white/60">Subtotal</p>
                  <p className="mt-2 text-lg font-bold text-white">{formatCurrency(purchaseRequest.subtotal)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-sm text-white/60">Productos</p>
                  <p className="mt-2 text-lg font-bold text-white">{purchaseRequest.itemCount ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <p className="inline-flex items-center gap-2 text-sm text-white/60">
                    <ReceiptText className="h-4 w-4" />
                    Fuente
                  </p>
                  <p className="mt-2 text-lg font-bold text-white">{purchaseRequest.source ?? 'cart_whatsapp'}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-sm text-white/60">Fecha</p>
                  <p className="mt-2 text-lg font-bold text-white">
                    {purchaseRequest.createdAt?.seconds
                      ? new Date(purchaseRequest.createdAt.seconds * 1000).toLocaleString('es-MX')
                      : 'Sin fecha'}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              <h2 className="text-2xl font-black text-slate-950">Actualizar estado</h2>
              <p className="mt-2 text-slate-600">Marca el avance comercial de esta solicitud.</p>

              <div className="mt-6 flex flex-col gap-3">
                {(['new', 'contacted', 'completed', 'cancelled'] as PurchaseRequestStatus[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusChange(status)}
                    disabled={saving || purchaseRequest.status === status}
                    className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Marcar como {status}
                  </button>
                ))}
              </div>

              {error && (
                <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {success && (
                <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {success}
                </div>
              )}
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
