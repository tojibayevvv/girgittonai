import { useEffect, useState } from 'react';
import { FolderTree, Plus, Trash2 } from 'lucide-react';
import { api, type Category } from '../lib/api';

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setItems(await api.get<Category[]>('/categories'));
  }
  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await api.post('/categories', { name, sortOrder: items.length + 1 });
      setName('');
      setError(null);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function remove(id: string) {
    if (!confirm('Kategoriya o‘chirilsinmi?')) return;
    await api.del(`/categories/${id}`);
    load();
  }

  return (
    <div className="max-w-2xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Kategoriyalar</h1>
        <p className="mt-1 text-sm text-slate-500">
          Menyuni bo‘limlarga ajrating: issiq taomlar, ichimliklar va hokazo.
        </p>
      </header>

      <form onSubmit={add} className="mb-6 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Yangi kategoriya nomi"
          className="input"
        />
        <button className="btn btn-primary shrink-0">
          <Plus size={16} />
          Qo‘shish
        </button>
      </form>

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {error}
        </p>
      )}

      <div className="card divide-y divide-slate-100">
        {items.map((c) => (
          <div
            key={c.id}
            className="group flex items-center gap-3 px-4 py-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <FolderTree size={17} />
            </div>
            <div className="flex-1">
              <div className="font-medium text-slate-900">{c.name}</div>
              <div className="text-xs text-slate-400">
                {c._count?.products ?? 0} ta mahsulot
              </div>
            </div>
            <button
              onClick={() => remove(c.id)}
              title="O‘chirish"
              className="rounded-md p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        {items.length === 0 && (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <FolderTree size={22} />
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Hozircha kategoriya yo‘q.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
