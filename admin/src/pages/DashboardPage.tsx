import { useEffect, useState } from 'react';
import {
  Store,
  Receipt,
  TrendingUp,
  CheckCircle2,
  Clock3,
} from 'lucide-react';
import { api, type Stats } from '../lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Stats>('/super-admin/stats')
      .then(setStats)
      .catch((e) => setError(e.message));
  }, []);

  const fmtMoney = (n: string) =>
    new Intl.NumberFormat('uz-UZ').format(Number(n));

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Boshqaruv paneli
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Platforma bo‘yicha umumiy ko‘rsatkichlar.
        </p>
      </header>

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {error}
        </p>
      )}

      {!stats ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card h-32 animate-pulse bg-slate-50" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Daromad — asosiy ko'rsatkich */}
          <div className="card relative overflow-hidden p-6 lg:col-span-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <TrendingUp size={16} className="text-brand-600" />
              Jami daromad
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-4xl font-semibold tracking-tight tabular-nums text-slate-900">
                {fmtMoney(stats.totalRevenue)}
              </span>
              <span className="text-base font-medium text-slate-400">so‘m</span>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Barcha to‘langan obunalardan tushgan umumiy summa.
            </p>
          </div>

          {/* Buyurtmalar */}
          <Tile
            icon={<Receipt size={18} />}
            tint="bg-sky-50 text-sky-600"
            value={stats.totalOrders.toLocaleString('uz-UZ')}
            label="Jami buyurtmalar"
          />

          {/* Restoranlar */}
          <Tile
            icon={<Store size={18} />}
            tint="bg-brand-50 text-brand-600"
            value={String(stats.totalRestaurants)}
            label="Jami restoranlar (mijozlar)"
          />

          {/* Faol */}
          <Tile
            icon={<CheckCircle2 size={18} />}
            tint="bg-emerald-50 text-emerald-600"
            value={String(stats.activeRestaurants)}
            label="Faol restoranlar"
          />

          {/* Sinov */}
          <Tile
            icon={<Clock3 size={18} />}
            tint="bg-amber-50 text-amber-600"
            value={String(stats.trialRestaurants)}
            label="Sinov (trial) rejimida"
          />
        </div>
      )}
    </div>
  );
}

function Tile({
  icon,
  tint,
  value,
  label,
}: {
  icon: React.ReactNode;
  tint: string;
  value: string;
  label: string;
}) {
  return (
    <div className="card p-6">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${tint}`}
      >
        {icon}
      </div>
      <div className="mt-4 text-2xl font-semibold tabular-nums text-slate-900">
        {value}
      </div>
      <div className="mt-0.5 text-sm text-slate-500">{label}</div>
    </div>
  );
}
