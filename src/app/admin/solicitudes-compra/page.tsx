'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { collection, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import { ArrowRight, Clock3, Search, ShoppingBag, Store, UserRound } from 'lucide-react';
import { db } from '@/lib/firebase';

type PurchaseRequestStatus = 'new' | 'contacted' | 'completed' | 'cancelled';

type PurchaseRequest = {
  id: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  subtotal?: number;
  itemCount?: number;
  status?: PurchaseRequestStatus;
  source?: string;
  createdAt?: { seconds?: number };
};

function formatCurrency(value?: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export default function PurchaseRequestsPage() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PurchaseRequestStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadRequests = useCallback(async () => {
    if (!db) {
      setError('No se pudo conectar con Firestore.');
      setLoading(false);
      return;
    }

    try {
      const snapshot = await getDocs(query(collection(db, 'purchase_requests'), orderBy('createdAt', 'desc')));
      setRequests(
        snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        })) as PurchaseRequest[],
      );
      setError('');
    } catch {
      setError('No fue posible cargar las solicitudes de compra.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleStatusChange = async (requestId: string, status: PurchaseRequestStatus) => {
    if (!db) return;

    setSavingId(requestId);
    setError('');

    try {
      await updateDoc(doc(db, 'purchase_requests', requestId), { status });
      await loadRequests();
    } catch {
      setError('No fue posible actualizar el estado de la solicitud.');
    } finally {
      setSavingId(null);
    }
  };

  const newRequests = requests.filter((request) => (request.status ?? 'new') === 'new').length;
  const totalRevenue = requests
    .filter((request) => (request.status ?? 'new') !== 'cancelled')
    .reduce((total, request) => total + (request.subtotal ?? 0), 0);
  const statusChips = [
    { value: 'all' as const, label: 'Todas', count: requests.length },
    { value: 'new' as const, label: 'Nuevas', count: requests.filter((request) => (request.status ?? 'new') === 'new').length },
    { value: 'contacted' as const, label: 'Contactadas', count: requests.filter((request) => request.status === 'contacted').length },
    { value: 'completed' as const, label: 'Completadas', count: requests.filter((request) => request.status === 'completed').length },
    { value: 'cancelled' as const, label: 'Canceladas', count: requests.filter((request) => request.status === 'cancelled').length },
  ];
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredRequests = requests.filter((request) => {
    const matchesStatus = statusFilter === 'all' ? true : (request.status ?? 'new') === statusFilter;
    const searchableText = [
      request.customerName,
      request.customerEmail,
      request.customerPhone,
      request.id,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const matchesSearch = normalizedSearch ? searchableText.includes(normalizedSearch) : true;

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8">
      <section>
        <span className="inline-flex rounded-full border border-cyan-100 bg-white/80 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700 shadow-sm backdrop-blur-sm">
          Solicitudes de compra
        </span>
        <h1 className="mt-6 text-4xl font-black text-slate-950 sm:text-5xl">Bandeja de pedidos por WhatsApp</h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">
          Revisa cada solicitud generada desde el carrito, cambia su estado y entra al detalle para confirmar productos y datos del cliente.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <ShoppingBag className="h-7 w-7 text-cyan-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">{loading ? '...' : requests.length}</p>
          <p className="mt-1 text-sm text-slate-600">Solicitudes totales</p>
        </div>
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <Clock3 className="h-7 w-7 text-blue-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">{loading ? '...' : newRequests}</p>
          <p className="mt-1 text-sm text-slate-600">Pendientes por atender</p>
        </div>
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <Store className="h-7 w-7 text-teal-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">{loading ? '...' : formatCurrency(totalRevenue)}</p>
          <p className="mt-1 text-sm text-slate-600">Monto acumulado solicitado</p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-950">Listado general</h2>
            <p className="mt-2 text-slate-600">Filtra por estado o encuentra una solicitud por cliente, correo, teléfono o folio.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar solicitud"
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'all' | PurchaseRequestStatus)}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
            >
              <option value="all">Todos los estados</option>
              <option value="new">Nuevas</option>
              <option value="contacted">Contactadas</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {statusChips.map((chip) => {
            const isActive = statusFilter === chip.value;

            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => setStatusFilter(chip.value)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-slate-950 text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)]'
                    : 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-cyan-200 hover:text-cyan-700'
                }`}
              >
                <span>{chip.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    isActive ? 'bg-white/15 text-white' : 'bg-white text-slate-500'
                  }`}
                >
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 space-y-4">
          {loading && (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-500">
              Cargando solicitudes...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-3xl border border-red-100 bg-red-50 p-5 text-red-600">{error}</div>
          )}

          {!loading && !error && requests.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-slate-500">
              Aún no hay solicitudes de compra registradas.
            </div>
          )}

          {!loading && !error && requests.length > 0 && filteredRequests.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-slate-500">
              No hay solicitudes que coincidan con los filtros actuales.
            </div>
          )}

          {!loading &&
            !error &&
            filteredRequests.map((request) => (
              <div key={request.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-bold text-slate-950">{request.customerName ?? 'Solicitud sin nombre'}</p>
                      <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                        {request.status ?? 'new'}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-2">
                        <UserRound className="h-4 w-4 text-slate-400" />
                        {request.customerEmail ?? 'Sin correo'}
                      </span>
                      <span>{request.customerPhone ?? 'Sin teléfono'}</span>
                      <span>{request.itemCount ?? 0} producto(s)</span>
                      <span>{formatCurrency(request.subtotal)}</span>
                      <span>
                        {request.createdAt?.seconds
                          ? new Date(request.createdAt.seconds * 1000).toLocaleString('es-MX')
                          : 'Sin fecha'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <select
                      value={request.status ?? 'new'}
                      onChange={(event) =>
                        handleStatusChange(request.id, event.target.value as PurchaseRequestStatus)
                      }
                      disabled={savingId === request.id}
                      className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                    >
                      <option value="new">Nueva</option>
                      <option value="contacted">Contactada</option>
                      <option value="completed">Completada</option>
                      <option value="cancelled">Cancelada</option>
                    </select>

                    <Link
                      href={`/admin/solicitudes-compra/${request.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Ver detalle
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
