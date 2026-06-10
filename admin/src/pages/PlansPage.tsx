import { useEffect, useState } from 'react';
import { QrCode, UtensilsCrossed, Store, Plus } from 'lucide-react';
import { api, type Plan } from '../lib/api';

interface Form {
  name: string;
  priceMonthly: string;
  maxTables: string;
  maxProducts: string;
}
const empty: Form = {
  name: '',
  priceMonthly: '',
  maxTables: '',
  maxProducts: '',
};

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState<Form>(empty);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setPlans(await api.get<Plan[]>('/super-admin/plans'));
  }
  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/super-admin/plans', {
        name: form.name,
        priceMonthly: Number(form.priceMonthly),
        maxTables: Number(form.maxTables),
        maxProducts: Number(form.maxProducts),
      });
      setForm(empty);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function toggle(p: Plan) {
    await api.patch(`/super-admin/plans/${p.id}`, { isActive: !p.isActive });
    load();
  }

  const fmt = (n: string) => new Intl.NumberFormat('uz-UZ').format(Number(n));

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Tariflar</h1>
        <p className="mt-1 text-sm text-slate-500">
          Restoranlar uchun obuna rejalari va cheklovlari.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-4 sm:grid-cols-2">
          {plans.map((p) => (
            <div key={p.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {p.name}
                  </h3>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-semibold tabular-nums text-slate-900">
                      {fmt(p.priceMonthly)}
                    </span>
                    <span className="text-sm text-slate-400">so‘m/oy</span>
                  </div>
                </div>
                <button
                  onClick={() => toggle(p)}
                  className={`badge cursor-pointer ${
                    p.isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      p.isActive ? 'bg-brand-500' : 'bg-slate-400'
                    }`}
                  />
                  {p.isActive ? 'Faol' : 'O‘chiq'}
                </button>
              </div>

              <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
                <li className="flex items-center gap-2.5">
                  <QrCode size={15} className="text-slate-400" />
                  {p.maxTables} tagacha stol
                </li>
                <li className="flex items-center gap-2.5">
                  <UtensilsCrossed size={15} className="text-slate-400" />
                  {p.maxProducts} tagacha mahsulot
                </li>
                <li className="flex items-center gap-2.5">
                  <Store size={15} className="text-slate-400" />
                  {p._count?.subscriptions ?? 0} ta restoran obuna bo‘lgan
                </li>
              </ul>
            </div>
          ))}
        </div>

        <form onSubmit={create} className="card h-fit p-5 lg:sticky lg:top-8">
          <h2 className="mb-4 font-semibold text-slate-900">Yangi tarif</h2>

          <div className="mb-3">
            <label className="label">Nomi</label>
            <input
              placeholder="Masalan: Pro"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              required
            />
          </div>
          <div className="mb-3">
            <label className="label">Oylik narx (so‘m)</label>
            <input
              type="number"
              placeholder="199000"
              value={form.priceMonthly}
              onChange={(e) =>
                setForm({ ...form, priceMonthly: e.target.value })
              }
              className="input"
              required
            />
          </div>
          <div className="mb-3">
            <label className="label">Maksimal stollar</label>
            <input
              type="number"
              placeholder="50"
              value={form.maxTables}
              onChange={(e) => setForm({ ...form, maxTables: e.target.value })}
              className="input"
              required
            />
          </div>
          <div className="mb-3">
            <label className="label">Maksimal mahsulotlar</label>
            <input
              type="number"
              placeholder="500"
              value={form.maxProducts}
              onChange={(e) => setForm({ ...form, maxProducts: e.target.value })}
              className="input"
              required
            />
          </div>

          {error && (
            <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {error}
            </p>
          )}

          <button className="btn btn-primary w-full">
            <Plus size={16} />
            Qo‘shish
          </button>
        </form>
      </div>
    </div>
  );
}
