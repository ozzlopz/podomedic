import { Package, BadgeDollarSign, Boxes } from 'lucide-react';

const products = [
  { name: 'Crema hidratante podológica', stock: 24, price: '$280' },
  { name: 'Plantillas de soporte', stock: 16, price: '$750' },
  { name: 'Kit de cuidado básico', stock: 9, price: '$420' },
];

export default function AdminProductsPage() {
  return (
    <div className="space-y-8">
      <section>
        <span className="inline-flex rounded-full border border-cyan-100 bg-white/80 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700 shadow-sm backdrop-blur-sm">
          Productos
        </span>
        <h1 className="mt-6 text-4xl font-black text-slate-950 sm:text-5xl">Catálogo y control de inventario</h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">
          Visualiza productos, niveles de stock y métricas comerciales con datos demostrativos.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <Package className="h-7 w-7 text-cyan-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">37</p>
          <p className="mt-1 text-sm text-slate-600">Productos activos</p>
        </div>
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <Boxes className="h-7 w-7 text-blue-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">142</p>
          <p className="mt-1 text-sm text-slate-600">Unidades en inventario</p>
        </div>
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <BadgeDollarSign className="h-7 w-7 text-teal-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">$18.2k</p>
          <p className="mt-1 text-sm text-slate-600">Valor estimado del stock</p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <h2 className="text-2xl font-black text-slate-950">Inventario actual</h2>
        <div className="mt-6 space-y-4">
          {products.map((product) => (
            <div key={product.name} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-bold text-slate-950">{product.name}</p>
                  <p className="text-sm text-slate-600">Stock disponible: {product.stock}</p>
                </div>
                <span className="text-sm font-semibold text-cyan-700">{product.price}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
