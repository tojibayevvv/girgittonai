import { useEffect, useState } from 'react';
import {
  Receipt,
  MapPin,
  Clock,
  X,
  ChevronRight,
  StickyNote,
} from 'lucide-react';
import { api, type Order, type OrderStatus } from '../lib/api';

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Yangi',
  ACCEPTED: 'Qabul qilindi',
  PREPARING: 'Tayyorlanmoqda',
  READY: 'Tayyor',
  SERVED: 'Berildi',
  COMPLETED: 'Yopildi',
  CANCELLED: 'Bekor qilindi',
};

const STATUS_BADGE: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  ACCEPTED: 'bg-sky-50 text-sky-700',
  PREPARING: 'bg-indigo-50 text-indigo-700',
  READY: 'bg-brand-50 text-brand-700',
  SERVED: 'bg-teal-50 text-teal-700',
  COMPLETED: 'bg-slate-100 text-slate-500',
  CANCELLED: 'bg-rose-50 text-rose-600',
};

const STATUS_DOT: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-500',
  ACCEPTED: 'bg-sky-500',
  PREPARING: 'bg-indigo-500',
  READY: 'bg-brand-500',
  SERVED: 'bg-teal-500',
  COMPLETED: 'bg-slate-400',
  CANCELLED: 'bg-rose-500',
};

// Faqat oldinga oqim
const NEXT: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['ACCEPTED'],
  ACCEPTED: ['PREPARING'],
  PREPARING: ['READY'],
  READY: ['SERVED'],
  SERVED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

const isActive = (s: OrderStatus) => s !== 'COMPLETED' && s !== 'CANCELLED';

const FILTERS: { value: OrderStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Barchasi' },
  { value: 'PENDING', label: 'Yangi' },
  { value: 'PREPARING', label: 'Tayyorlanmoqda' },
  { value: 'READY', label: 'Tayyor' },
  { value: 'COMPLETED', label: 'Yopilgan' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    try {
      const q = filter === 'ALL' ? '' : `?status=${filter}`;
      setOrders(await api.get<Order[]>(`/orders${q}`));
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function setStatus(id: string, status: OrderStatus) {
    await api.patch(`/orders/${id}/status`, { status });
    load();
  }

  async function cancel(o: Order) {
    const ok = confirm(
      `#${o.orderNumber} (${o.table?.name ?? 'stol noma’lum'}) buyurtmasi bekor qilinsinmi?`,
    );
    if (!ok) return;
    await api.patch(`/orders/${o.id}/status`, { status: 'CANCELLED' });
    load();
  }

  const fmt = (n: string | number) =>
    new Intl.NumberFormat('uz-UZ').format(Number(n)) + ' so‘m';

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Buyurtmalar</h1>
          <p className="mt-1 text-sm text-slate-500">
            Real vaqtda yangilanadi. Bo‘sh stol buyurtmasini bekor qiling.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {error}
        </p>
      )}

      {loaded && orders.length === 0 ? (
        <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Receipt size={22} />
          </div>
          <h3 className="mt-4 font-medium text-slate-900">
            Hozircha buyurtma yo‘q
          </h3>
          <p className="mt-1 max-w-xs text-sm text-slate-500">
            Mijoz QR kodni skanerlab buyurtma berishi bilan shu yerda paydo
            bo‘ladi.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {orders.map((o) => (
            <article
              key={o.id}
              className="card flex animate-fade-in flex-col p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold tabular-nums text-slate-900">
                  Buyurtma #{o.orderNumber}
                </span>
                <span className={`badge ${STATUS_BADGE[o.status]}`}>
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[o.status]}`}
                  />
                  {STATUS_LABEL[o.status]}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <MapPin size={13} />
                  {o.table?.name ?? 'Stol noma’lum'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={13} />
                  {new Date(o.createdAt).toLocaleTimeString('uz-UZ', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-sm">
                {o.items.map((it) => (
                  <li key={it.id} className="flex justify-between gap-2">
                    <span className="text-slate-700">
                      <span className="text-slate-400">{it.quantity}×</span>{' '}
                      {it.name}
                    </span>
                    <span className="tabular-nums text-slate-500">
                      {fmt(Number(it.price) * it.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              {o.note && (
                <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-xs text-amber-700">
                  <StickyNote size={13} className="mt-0.5 shrink-0" />
                  {o.note}
                </p>
              )}

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <span className="text-base font-semibold tabular-nums text-slate-900">
                  {fmt(o.total)}
                </span>
                <div className="flex gap-2">
                  {isActive(o.status) && (
                    <button
                      onClick={() => cancel(o)}
                      className="btn btn-danger btn-sm"
                    >
                      <X size={14} />
                      Bekor
                    </button>
                  )}
                  {NEXT[o.status].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(o.id, s)}
                      className="btn btn-primary btn-sm"
                    >
                      {STATUS_LABEL[s]}
                      <ChevronRight size={14} />
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
