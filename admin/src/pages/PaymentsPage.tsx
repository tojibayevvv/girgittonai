import { useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';
import { api, type Payment } from '../lib/api';

const STATUS_BADGE: Record<string, string> = {
  PAID: 'bg-brand-50 text-brand-700',
  PENDING: 'bg-amber-50 text-amber-700',
  FAILED: 'bg-rose-50 text-rose-600',
};
const STATUS_DOT: Record<string, string> = {
  PAID: 'bg-brand-500',
  PENDING: 'bg-amber-500',
  FAILED: 'bg-rose-500',
};
const STATUS_LABEL: Record<string, string> = {
  PAID: 'To‘langan',
  PENDING: 'Kutilmoqda',
  FAILED: 'Muvaffaqiyatsiz',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Payment[]>('/super-admin/payments')
      .then(setPayments)
      .catch((e) => setError(e.message));
  }, []);

  const fmt = (n: string, c: string) =>
    new Intl.NumberFormat('uz-UZ').format(Number(n)) + ' ' + c;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">To‘lovlar</h1>
        <p className="mt-1 text-sm text-slate-500">
          Restoranlardan tushgan obuna to‘lovlari tarixi.
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
              <th className="px-4 py-3 text-right">Summa</th>
              <th className="px-4 py-3">Holati</th>
              <th className="px-4 py-3">Provayder</th>
              <th className="px-4 py-3 text-right">Sana</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-slate-50/60">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {p.subscription?.restaurant.name ?? '—'}
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900">
                  {fmt(p.amount, p.currency)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`badge ${
                      STATUS_BADGE[p.status] ?? 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        STATUS_DOT[p.status] ?? 'bg-slate-400'
                      }`}
                    />
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {p.provider ?? '—'}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-500">
                  {new Date(p.createdAt).toLocaleDateString('uz-UZ')}
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center text-slate-500">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Wallet size={22} />
                    </div>
                    <p className="mt-3 text-sm">Hozircha to‘lovlar yo‘q.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
