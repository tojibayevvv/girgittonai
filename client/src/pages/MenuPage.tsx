import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Sparkles,
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

type Cart = Record<string, number>;

export default function MenuPage() {
  const { tableCode = '' } = useParams();
  const [menu, setMenu] = useState<MenuResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Cart>({});
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState<number | null>(null);
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

  const add = (id: string) =>
    setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  const remove = (id: string) =>
    setCart((c) => {
      const next = { ...c };
      if (!next[id]) return next;
      next[id] -= 1;
      if (next[id] <= 0) delete next[id];
      return next;
    });

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const items = Object.entries(cart).map(([productId, quantity]) => ({
        productId,
        quantity,
      }));
      const order = await createOrder({
        tableCode,
        items,
        note: note || undefined,
      });
      setPlaced(order.orderNumber);
      setCart({});
      setNote('');
      window.scrollTo({ top: 0 });
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

  if (placed !== null) {
    return (
      <Centered>
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <CheckCircle2 size={36} strokeWidth={2} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">
          Buyurtma qabul qilindi
        </h1>
        <p className="mt-1.5 text-slate-500">
          Buyurtma raqami:{' '}
          <span className="font-semibold tabular-nums text-slate-900">
            #{placed}
          </span>
        </p>
        <button className="btn btn-primary mt-8" onClick={() => setPlaced(null)}>
          Yana buyurtma berish
        </button>
      </Centered>
    );
  }

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
              src={menu.restaurant.logoUrl}
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

      {/* AI maslahatchi (keyinchalik) */}
      <div className="mx-4 mt-4 flex items-start gap-2.5 rounded-xl border border-brand-100 bg-brand-50/60 px-3.5 py-3">
        <Sparkles size={17} className="mt-0.5 shrink-0 text-brand-600" />
        <p className="text-sm leading-snug text-brand-800">
          <span className="font-medium">AI maslahatchi tez orada.</span> Tez
          orada taom tanlashda yordam beradi.
        </p>
      </div>

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
            <div className="grid gap-2.5 sm:grid-cols-2">
              {cat.products.map((p) => {
                const qty = cart[p.id] ?? 0;
                return (
                  <article
                    key={p.id}
                    className={`flex gap-3 rounded-xl border bg-white p-3 transition-colors ${
                      qty
                        ? 'border-brand-300 ring-1 ring-brand-200'
                        : 'border-slate-200'
                    }`}
                  >
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt=""
                        className="h-24 w-24 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-300">
                        <UtensilsCrossed size={26} />
                      </div>
                    )}

                    <div className="flex min-w-0 flex-1 flex-col">
                      <h3 className="font-medium leading-tight text-slate-900">
                        {p.name}
                      </h3>
                      {p.description && (
                        <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-slate-500">
                          {p.description}
                        </p>
                      )}
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <span className="text-sm font-semibold tabular-nums text-slate-900">
                          {fmt(Number(p.price))}
                        </span>
                        {qty ? (
                          <div className="flex items-center gap-2.5">
                            <QtyBtn onClick={() => remove(p.id)}>
                              <Minus size={15} />
                            </QtyBtn>
                            <span className="w-4 text-center text-sm font-semibold tabular-nums">
                              {qty}
                            </span>
                            <QtyBtn primary onClick={() => add(p.id)}>
                              <Plus size={15} />
                            </QtyBtn>
                          </div>
                        ) : (
                          <button
                            onClick={() => add(p.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-700"
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
      <div className="space-y-2.5 px-4 pt-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-3 rounded-xl border border-slate-200 p-3"
          >
            <div className="h-24 w-24 shrink-0 animate-pulse rounded-lg bg-slate-200" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
