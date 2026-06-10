import { useEffect, useState } from 'react';
import {
  Store,
  Pause,
  Play,
  UtensilsCrossed,
  QrCode,
  Receipt,
  Plus,
  X,
} from 'lucide-react';
import {
  api,
  type Plan,
  type RestaurantRow,
  type RestaurantStatus,
} from '../lib/api';

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

interface Form {
  restaurantName: string;
  fullName: string;
  email: string;
  password: string;
  phone: string;
  status: RestaurantStatus;
  planId: string;
}
const emptyForm: Form = {
  restaurantName: '',
  fullName: '',
  email: '',
  password: '',
  phone: '',
  status: 'ACTIVE',
  planId: '',
};

export default function RestaurantsPage() {
  const [rows, setRows] = useState<RestaurantRow[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setRows(await api.get<RestaurantRow[]>('/super-admin/restaurants'));
    } catch (e: any) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
    api
      .get<Plan[]>('/super-admin/plans')
      .then(setPlans)
      .catch(() => {});
  }, []);

  async function setStatus(id: string, status: RestaurantStatus) {
    await api.patch(`/super-admin/restaurants/${id}/status`, { status });
    load();
  }

  function openModal() {
    setForm(emptyForm);
    setFormError(null);
    setOpen(true);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      await api.post('/super-admin/restaurants', {
        restaurantName: form.restaurantName,
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        status: form.status,
        planId: form.planId || undefined,
      });
      setOpen(false);
      load();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Restoranlar</h1>
          <p className="mt-1 text-sm text-slate-500">
            Platformadagi barcha mijoz restoranlar va ularning holati.
          </p>
        </div>
        <button onClick={openModal} className="btn btn-primary shrink-0">
          <Plus size={16} />
          Yangi restoran
        </button>
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

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <form onSubmit={create} className="card w-full max-w-md p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Yangi restoran
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-3">
              <label className="label">Restoran nomi</label>
              <input
                placeholder="Masalan: Osh Markazi"
                value={form.restaurantName}
                onChange={(e) =>
                  setForm({ ...form, restaurantName: e.target.value })
                }
                className="input"
                required
              />
            </div>

            <div className="mb-3">
              <label className="label">Admin ismi</label>
              <input
                placeholder="Masalan: Akmal Karimov"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="input"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="mb-3">
                <label className="label">Admin email</label>
                <input
                  type="email"
                  placeholder="admin@restoran.uz"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="label">Parol</label>
                <input
                  type="text"
                  placeholder="kamida 6 belgi"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="input"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="label">Telefon (ixtiyoriy)</label>
              <input
                placeholder="+998 90 123 45 67"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="mb-3">
                <label className="label">Holati</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as RestaurantStatus,
                    })
                  }
                  className="input"
                >
                  <option value="ACTIVE">Faol</option>
                  <option value="TRIAL">Sinov</option>
                  <option value="SUSPENDED">To‘xtatilgan</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="label">Tarif</label>
                <select
                  value={form.planId}
                  onChange={(e) => setForm({ ...form, planId: e.target.value })}
                  className="input"
                >
                  <option value="">Avtomatik (arzoni)</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {formError && (
              <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {formError}
              </p>
            )}

            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn flex-1 bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                Bekor qilish
              </button>
              <button
                disabled={saving}
                className="btn btn-primary flex-1 disabled:opacity-60"
              >
                <Plus size={16} />
                {saving ? 'Saqlanmoqda…' : 'Yaratish'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
