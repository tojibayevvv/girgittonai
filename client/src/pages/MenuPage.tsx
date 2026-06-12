import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Plus,
  Minus,
  UtensilsCrossed,
  CheckCircle2,
  Loader2,
  ShoppingBag,
  MapPin,
} from 'lucide-react';
import {
  createOrder,
  getMenu,
  type MenuResponse,
  type Product,
} from '../lib/api';
import VoiceAssistant from '../components/VoiceAssistant';

type Cart = Record<string, number>;

// Sayt https bo'lsa, http:// rasmlar brauzer tomonidan bloklanadi (mixed content).
// Shu sababli http:// manzillarni https:// ga ko'taramiz.
function safeImg(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    url.startsWith('http://')
  ) {
    return 'https://' + url.slice('http://'.length);
  }
  return url;
}

export default function MenuPage() {
  const { tableCode = '' } = useParams();
  const [menu, setMenu] = useState<MenuResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Cart>({});
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Buyurtma berilganda qisqa bildirishnoma (alohida sahifa emas)
  const [toast, setToast] = useState<string | null>(null);
  // 'ALL' yoki kategoriya id'si
  const [activeCat, setActiveCat] = useState('ALL');

  useEffect(() => {
    getMenu(tableCode)
      .then(setMenu)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tableCode]);

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    menu?.categories.forEach((c) => c.products.forEach((p) => map.set(p.id, p)));
    return map;
  }, [menu]);

  const { count, total } = useMemo(() => {
    let count = 0;
    let total = 0;
    for (const [id, qty] of Object.entries(cart)) {
      const p = productById.get(id);
      if (p) {
        count += qty;
        total += Number(p.price) * qty;
      }
    }
    return { count, total };
  }, [cart, productById]);

  const currency = menu?.restaurant.currency ?? 'UZS';
  const fmt = (n: number) =>
    new Intl.NumberFormat('uz-UZ').format(n) + ' ' + currency;

  // Savatchaning eng yangi holatini ref'da saqlaymiz — AI bir vaqtda
  // qo'shib darrov buyurtma bersa, submit eskirgan state'ni o'qimasligi uchun
  const cartRef = useRef(cart);
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  const addQty = (id: string, n = 1) =>
    setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + n }));
  const removeQty = (id: string, n = 1) =>
    setCart((c) => {
      const next = { ...c };
      if (!next[id]) return next;
      next[id] -= n;
      if (next[id] <= 0) delete next[id];
      return next;
    });
  const add = (id: string) => addQty(id, 1);
  const remove = (id: string) => removeQty(id, 1);

  async function submit() {
    const items = Object.entries(cartRef.current)
      .filter(([, quantity]) => quantity > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));
    if (items.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const order = await createOrder({
        tableCode,
        items,
        note: note || undefined,
      });
      setCart({});
      setNote('');
      setToast(`Buyurtma qabul qilindi · #${order.orderNumber}`);
      setTimeout(() => setToast(null), 5000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <MenuSkeleton />;
  if (error && !menu)
    return (
      <Centered>
        <p className="text-slate-600">{error}</p>
      </Centered>
    );
  if (!menu) return null;

  // Faqat mahsuloti bor kategoriyalar
  const cats = menu.categories.filter((c) => c.products.length > 0);
  // Tanlangan filtrga ko'ra ko'rsatiladigan kategoriyalar
  const visibleCats =
    activeCat === 'ALL' ? cats : cats.filter((c) => c.id === activeCat);

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-white">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3">
          {menu.restaurant.logoUrl ? (
            <img
              src={safeImg(menu.restaurant.logoUrl)}
              alt=""
              className="h-11 w-11 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-base font-semibold text-white">
              {menu.restaurant.name[0]}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold leading-tight text-slate-900">
              {menu.restaurant.name}
            </h1>
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500">
              <MapPin size={12} />
              {menu.table.name}
            </p>
          </div>
        </div>

        {/* Kategoriya filtri */}
        {cats.length > 1 && (
          <nav className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
            <FilterChip
              active={activeCat === 'ALL'}
              onClick={() => setActiveCat('ALL')}
            >
              Hammasi
            </FilterChip>
            {cats.map((cat) => (
              <FilterChip
                key={cat.id}
                active={activeCat === cat.id}
                onClick={() => setActiveCat(cat.id)}
              >
                {cat.name}
              </FilterChip>
            ))}
          </nav>
        )}
      </header>

      {/* Buyurtma bildirishnomasi */}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-4">
          <div className="animate-fade-in flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-card-hover">
            <CheckCircle2 size={18} className="text-emerald-400" />
            {toast}
          </div>
        </div>
      )}

      {/* Menyu */}
      <main className="px-4 pb-40">
        {cats.length === 0 && (
          <div className="mt-10 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <UtensilsCrossed size={26} />
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Menyu hozircha tayyorlanmoqda.
            </p>
          </div>
        )}

        {visibleCats.map((cat) => (
          <section key={cat.id} className="pt-6">
            <h2 className="mb-3 text-lg font-semibold tracking-tight text-slate-900">
              {cat.name}
            </h2>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {cat.products.map((p) => {
                const qty = cart[p.id] ?? 0;
                return (
                  <article
                    key={p.id}
                    className={`flex flex-col overflow-hidden rounded-xl border bg-white transition-colors ${
                      qty
                        ? 'border-brand-300 ring-1 ring-brand-200'
                        : 'border-slate-200'
                    }`}
                  >
                    {p.imageUrl ? (
                      <img
                        src={safeImg(p.imageUrl)}
                        alt=""
                        className="aspect-square w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-square w-full items-center justify-center bg-slate-100 text-slate-300">
                        <UtensilsCrossed size={32} />
                      </div>
                    )}

                    <div className="flex min-w-0 flex-1 flex-col p-2.5">
                      <h3 className="line-clamp-2 text-sm font-medium leading-tight text-slate-900">
                        {p.name}
                      </h3>
                      {p.description && (
                        <p className="mt-1 line-clamp-2 text-xs leading-snug text-slate-500">
                          {p.description}
                        </p>
                      )}
                      <div className="mt-auto flex items-center justify-between gap-1 pt-2">
                        <span className="min-w-0 truncate text-[13px] font-semibold tabular-nums text-slate-900">
                          {fmt(Number(p.price))}
                        </span>
                        {qty ? (
                          <div className="flex shrink-0 items-center gap-1.5">
                            <QtyBtn onClick={() => remove(p.id)}>
                              <Minus size={14} />
                            </QtyBtn>
                            <span className="w-4 text-center text-sm font-semibold tabular-nums">
                              {qty}
                            </span>
                            <QtyBtn primary onClick={() => add(p.id)}>
                              <Plus size={14} />
                            </QtyBtn>
                          </div>
                        ) : (
                          <button
                            onClick={() => add(p.id)}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-700"
                            aria-label="Qo‘shish"
                          >
                            <Plus size={17} />
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </main>

      {/* Savatcha paneli */}
      {count > 0 && (
        <div className="pb-safe fixed inset-x-0 bottom-0 z-30 mx-auto max-w-2xl px-4 pt-2">
          <div className="animate-fade-in rounded-2xl border border-slate-200 bg-white p-3 shadow-card-hover">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Izoh (masalan: kam tuzli)"
              className="input mb-2.5"
            />
            {error && <p className="mb-2 text-sm text-rose-600">{error}</p>}
            <button
              disabled={submitting}
              onClick={submit}
              className="btn btn-primary flex w-full items-center justify-between px-5 py-3 text-base"
            >
              <span className="inline-flex items-center gap-2">
                {submitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <span className="relative">
                    <ShoppingBag size={18} />
                    <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold tabular-nums text-brand-700">
                      {count}
                    </span>
                  </span>
                )}
                {submitting ? 'Yuborilmoqda…' : 'Buyurtma berish'}
              </span>
              <span className="tabular-nums">{fmt(total)}</span>
            </button>
          </div>
        </div>
      )}

      {/* AI ovozli ofitsiant */}
      <VoiceAssistant
        tableCode={tableCode}
        cart={cart}
        onAdd={addQty}
        onRemove={removeQty}
        onPlace={submit}
      />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-slate-900 text-white'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {children}
    </button>
  );
}

function QtyBtn({
  children,
  onClick,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
        primary
          ? 'bg-brand-600 text-white hover:bg-brand-700'
          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center bg-white px-6 text-center">
      {children}
    </div>
  );
}

function MenuSkeleton() {
  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-white">
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
        <div className="h-11 w-11 animate-pulse rounded-full bg-slate-200" />
        <div className="space-y-2">
          <div className="h-3.5 w-32 animate-pulse rounded bg-slate-200" />
          <div className="h-2.5 w-16 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 px-4 pt-6 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-slate-200"
          >
            <div className="aspect-square w-full animate-pulse bg-slate-200" />
            <div className="space-y-2 p-2.5">
              <div className="h-3.5 w-2/3 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
