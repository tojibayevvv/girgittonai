import { useEffect, useRef, useState } from 'react';
import {
  UtensilsCrossed,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  ImagePlus,
  X,
  Loader2,
} from 'lucide-react';
import { api, uploadImage, type Category, type Product } from '../lib/api';

interface Form {
  name: string;
  price: string;
  categoryId: string;
  description: string;
  imageUrl: string;
}

const empty: Form = {
  name: '',
  price: '',
  categoryId: '',
  description: '',
  imageUrl: '',
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<Form>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function load() {
    const [p, c] = await Promise.all([
      api.get<Product[]>('/products'),
      api.get<Category[]>('/categories'),
    ]);
    setProducts(p);
    setCategories(c);
  }
  useEffect(() => {
    load();
  }, []);

  function startEdit(p: Product) {
    setEditing(p.id);
    setForm({
      name: p.name,
      price: p.price,
      categoryId: p.categoryId ?? '',
      description: p.description ?? '',
      imageUrl: p.imageUrl ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function reset() {
    setEditing(null);
    setForm(empty);
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      name: form.name,
      price: Number(form.price),
      categoryId: form.categoryId || undefined,
      description: form.description || undefined,
      imageUrl: form.imageUrl || undefined,
    };
    try {
      if (editing) await api.patch(`/products/${editing}`, payload);
      else await api.post('/products', payload);
      reset();
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function remove(id: string) {
    if (!confirm('Mahsulot o‘chirilsinmi?')) return;
    await api.del(`/products/${id}`);
    load();
  }

  async function toggleAvailable(p: Product) {
    await api.patch(`/products/${p.id}`, { isAvailable: !p.isAvailable });
    load();
  }

  const fmt = (n: string) =>
    new Intl.NumberFormat('uz-UZ').format(Number(n)) + ' so‘m';

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Mahsulotlar</h1>
        <p className="mt-1 text-sm text-slate-500">
          Menyu mahsulotlarini qo‘shing, tahrirlang va sotuvdan oling.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Ro'yxat */}
        <div className="space-y-2.5">
          {products.map((p) => (
            <div
              key={p.id}
              className="card flex items-center gap-3.5 p-3 transition-shadow hover:shadow-card-hover"
            >
              {p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                  <UtensilsCrossed size={20} />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-slate-900">
                  {p.name}
                </div>
                <div className="mt-0.5 text-sm tabular-nums text-slate-500">
                  {fmt(p.price)}
                  <span className="text-slate-300"> · </span>
                  <span className="text-slate-400">
                    {p.category?.name ?? 'Kategoriyasiz'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => toggleAvailable(p)}
                title={p.isAvailable ? 'Sotuvda' : 'Yashirilgan'}
                className={`badge ${
                  p.isAvailable
                    ? 'bg-brand-50 text-brand-700'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {p.isAvailable ? <Eye size={12} /> : <EyeOff size={12} />}
                {p.isAvailable ? 'Sotuvda' : 'Yashirin'}
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => startEdit(p)}
                  title="Tahrirlash"
                  className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => remove(p.id)}
                  title="O‘chirish"
                  className="rounded-md p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <div className="card flex flex-col items-center px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <UtensilsCrossed size={22} />
              </div>
              <p className="mt-3 text-sm text-slate-500">
                Hozircha mahsulot yo‘q. O‘ngdagi shakl orqali qo‘shing.
              </p>
            </div>
          )}
        </div>

        {/* Forma */}
        <form onSubmit={submit} className="card h-fit p-5 lg:sticky lg:top-8">
          <h2 className="mb-4 font-semibold text-slate-900">
            {editing ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}
          </h2>

          {/* Rasm yuklash */}
          <div className="mb-4">
            <label className="label">Rasm</label>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              onChange={onPickImage}
              className="hidden"
            />
            {form.imageUrl ? (
              <div className="relative h-40 w-full overflow-hidden rounded-lg border border-slate-200">
                <img
                  src={form.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, imageUrl: '' })}
                  className="absolute right-2 top-2 rounded-md bg-white/90 p-1.5 text-slate-600 shadow-sm hover:text-rose-600"
                  title="Rasmni olib tashlash"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 text-slate-400 transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600 disabled:opacity-60"
              >
                {uploading ? (
                  <>
                    <Loader2 size={22} className="animate-spin" />
                    <span className="text-sm">Yuklanmoqda…</span>
                  </>
                ) : (
                  <>
                    <ImagePlus size={22} />
                    <span className="text-sm font-medium">Rasm yuklash</span>
                    <span className="text-xs text-slate-400">
                      JPG yoki PNG, 5MB gacha
                    </span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="mb-3">
            <label className="label">Nomi</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="input"
              placeholder="Masalan: Lag‘mon"
            />
          </div>

          <div className="mb-3">
            <label className="label">Narx (so‘m)</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
              className="input"
              placeholder="35000"
            />
          </div>

          <div className="mb-3">
            <label className="label">Kategoriya</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="input"
            >
              <option value="">— tanlanmagan —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="label">Tavsif</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="input resize-none"
              rows={2}
              placeholder="Qisqacha tavsif"
            />
          </div>

          {error && (
            <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button disabled={uploading} className="btn btn-primary flex-1">
              {!editing && <Plus size={16} />}
              {editing ? 'Saqlash' : 'Qo‘shish'}
            </button>
            {editing && (
              <button type="button" onClick={reset} className="btn btn-ghost">
                Bekor
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
