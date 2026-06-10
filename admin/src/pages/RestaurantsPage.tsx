import { useEffect, useState } from 'react';
import { Store, Pause, Play, UtensilsCrossed, QrCode, Receipt } from 'lucide-react';
import { api, type RestaurantRow, type RestaurantStatus } from '../lib/api';

const STATUS_LABEL: Record<RestaurantStatus, string> = {
  TRIAL: 'Sinov',
  ACTIVE: 'Faol',
  SUSPENDED: 'To‘xtatilgan',
};
const STATUS_BADGE: Record<RestaurantStatus, string> = {
  TRIAL: 'bg-amber-50 text-amber-700',
  ACTIVE: 'bg-brand-50 text-brand-700',
  SUSPENDED: 'bg-rose-50 text-rose-600',
};
const STATUS_DOT: Record<RestaurantStatus, string> = {
  TRIAL: 'bg-amber-500',
  ACTIVE: 'bg-brand-500',
  SUSPENDED: 'bg-rose-500',
};

export default function RestaurantsPage() {
  const [rows, setRows] = useState<RestaurantRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setRows(await api.get<RestaurantRow[]>('/super-admin/restaurants'));
    } catch (e: any) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: RestaurantStatus) {
    await api.patch(`/super-admin/restaurants/${id}/status`, { status });
    load();
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Restoranlar
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Platformadagi barcha mijoz restoranlar va ularning holati.
        </p>
      </header>

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {error}
        </p>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">Restoran</th>
              <th className="px-4 py-3">Holati</th>
              <th className="px-4 py-3">Tarif</th>
              <th className="px-4 py-3 text-right">Ko‘rsatkichlar</th>
              <th className="px-4 py-3 text-right">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                      <Store size={17} />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{r.name}</div>
                      <div className="text-xs text-slate-400">/{r.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${STATUS_BADGE[r.status]}`}>
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[r.status]}`}
                    />
                    {STATUS_LABEL[r.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {r.subscription?.plan.name ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-4 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1" title="Mahsulotlar">
                      <UtensilsCrossed size={13} className="text-slate-400" />
                      {r._count.products}
                    </span>
                    <span className="inline-flex items-center gap-1" title="Stollar">
                      <QrCode size={13} className="text-slate-400" />
                      {r._count.tables}
                    </span>
                    <span className="inline-flex items-center gap-1" title="Buyurtmalar">
                      <Receipt size={13} className="text-slate-400" />
                      {r._count.orders}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    {r.status === 'SUSPENDED' ? (
                      <button
                        onClick={() => setStatus(r.id, 'ACTIVE')}
                        className="btn btn-sm bg-brand-50 text-brand-700 hover:bg-brand-100"
                      >
                        <Play size={13} />
                        Faollashtirish
                      </button>
                    ) : (
                      <button
                        onClick={() => setStatus(r.id, 'SUSPENDED')}
                        className="btn btn-danger btn-sm"
                      >
                        <Pause size={13} />
                        To‘xtatish
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                  Hozircha restoran yo‘q.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
