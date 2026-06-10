import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Plus,
  Maximize2,
  RefreshCw,
  Trash2,
  Printer,
  QrCode,
  X,
} from 'lucide-react';
import { api, type Table } from '../lib/api';

// Mijoz menyu sayti manzili.
// 1) VITE_CLIENT_URL env bo'lsa — o'shani ishlatamiz.
// 2) Bo'lmasa: local'da localhost, productionda esa qi2z domeni (fallback).
const isLocalhost =
  typeof window !== 'undefined' &&
  /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
const CLIENT_URL =
  import.meta.env.VITE_CLIENT_URL ??
  (isLocalhost
    ? 'http://localhost:5173'
    : 'https://girgittonai-qi2z.vercel.app');

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [name, setName] = useState('');
  const [active, setActive] = useState<Table | null>(null);

  async function load() {
    setTables(await api.get<Table[]>('/tables'));
  }
  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await api.post('/tables', { name });
    setName('');
    load();
  }

  async function regenerate(id: string) {
    if (!confirm('QR kodi yangilansinmi? Eski QR ishlamay qoladi.')) return;
    await api.post(`/tables/${id}/regenerate-code`);
    load();
  }

  async function remove(id: string) {
    if (!confirm('Stol o‘chirilsinmi?')) return;
    await api.del(`/tables/${id}`);
    load();
  }

  const urlFor = (code: string) => `${CLIENT_URL}/t/${code}`;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Stollar va QR kodlar
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Har bir stol uchun QR yarating, chop eting va stolga joylashtiring.
        </p>
      </header>

      <form onSubmit={add} className="mb-6 flex max-w-md gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Stol nomi (masalan: Stol 5)"
          className="input"
        />
        <button className="btn btn-primary shrink-0">
          <Plus size={16} />
          Qo‘shish
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tables.map((t) => (
          <div key={t.id} className="card flex flex-col items-center p-4">
            <div className="flex w-full items-center justify-between">
              <span className="font-medium text-slate-900">{t.name}</span>
              <span className="badge bg-slate-100 text-slate-400">
                <QrCode size={12} />
                QR
              </span>
            </div>

            <div className="my-4 rounded-xl border border-slate-100 bg-white p-3">
              <QRCodeCanvas
                value={urlFor(t.code)}
                size={128}
                fgColor="#0f172a"
              />
            </div>

            <code className="text-xs tracking-wide text-slate-400">
              {t.code}
            </code>

            <div className="mt-4 flex w-full items-center gap-1">
              <button
                onClick={() => setActive(t)}
                className="btn btn-ghost btn-sm flex-1"
              >
                <Maximize2 size={14} />
                Kattalashtirish
              </button>
              <button
                onClick={() => regenerate(t.id)}
                title="QR ni yangilash"
                className="rounded-md border border-slate-200 p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
              >
                <RefreshCw size={15} />
              </button>
              <button
                onClick={() => remove(t.id)}
                title="O‘chirish"
                className="rounded-md border border-slate-200 p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}

        {tables.length === 0 && (
          <div className="card col-span-full flex flex-col items-center px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <QrCode size={22} />
            </div>
            <p className="mt-3 text-sm text-slate-500">Hozircha stol yo‘q.</p>
          </div>
        )}
      </div>

      {/* Kattalashtirilgan QR (chop etish uchun) */}
      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => setActive(null)}
        >
          <div
            className="card relative w-full max-w-xs p-8 text-center shadow-card-hover"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActive(null)}
              className="absolute right-3 top-3 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={18} />
            </button>
            <h2 className="text-lg font-semibold">{active.name}</h2>
            <div className="my-5 flex justify-center">
              <QRCodeCanvas value={urlFor(active.code)} size={240} fgColor="#0f172a" />
            </div>
            <p className="text-sm text-slate-500">
              Skanerlab menyuni oching
            </p>
            <button
              onClick={() => window.print()}
              className="btn btn-primary mt-5 w-full"
            >
              <Printer size={16} />
              Chop etish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
