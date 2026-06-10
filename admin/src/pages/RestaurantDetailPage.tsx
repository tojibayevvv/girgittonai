import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  KeyRound,
  UtensilsCrossed,
  QrCode,
  Receipt,
  Phone,
  MapPin,
  Calendar,
  X,
} from 'lucide-react';
import {
  api,
  type RestaurantDetail,
  type RestaurantStatus,
  type RestaurantUser,
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
const ROLE_LABEL: Record<string, string> = {
  RESTAURANT_ADMIN: 'Restoran admini',
  SUPER_ADMIN: 'Super admin',
  STAFF: 'Xodim',
};

export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [r, setR] = useState<RestaurantDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [pwUser, setPwUser] = useState<RestaurantUser | null>(null);

  async function load() {
    try {
      setR(await api.get<RestaurantDetail>(`/super-admin/restaurants/${id}`));
    } catch (e: any) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function remove() {
    if (!r) return;
    if (
      !confirm(
        `"${r.name}" restorani butunlay o‘chiriladi (barcha menyu, stol, buyurtmalar bilan). Davom etamizmi?`,
      )
    )
      return;
    try {
      await api.del(`/super-admin/restaurants/${r.id}`);
      navigate('/restaurants');
    } catch (e: any) {
      setError(e.message);
    }
  }

  if (error) {
    return (
      <div>
        <BackLink />
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {error}
        </p>
      </div>
    );
  }
  if (!r) {
    return (
      <div>
        <BackLink />
        <p className="text-sm text-slate-500">Yuklanmoqda…</p>
      </div>
    );
  }

  const fmt = (n: string) => new Intl.NumberFormat('uz-UZ').format(Number(n));

  return (
    <div>
      <BackLink />

      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{r.name}</h1>
            <span className={`badge ${STATUS_BADGE[r.status]}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[r.status]}`} />
              {STATUS_LABEL[r.status]}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">/{r.slug}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => setEditOpen(true)}
            className="btn btn-sm bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            <Pencil size={14} />
            Tahrirlash
          </button>
          <button onClick={remove} className="btn btn-danger btn-sm">
            <Trash2 size={14} />
            O‘chirish
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Asosiy ma'lumotlar */}
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-slate-900">Ma'lumotlar</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <Info icon={Phone} label="Telefon" value={r.phone ?? '—'} />
              <Info icon={MapPin} label="Manzil" value={r.address ?? '—'} />
              <Info
                icon={Calendar}
                label="Yaratilgan"
                value={new Date(r.createdAt).toLocaleDateString('uz-UZ')}
              />
              <Info
                icon={Receipt}
                label="Tarif"
                value={
                  r.subscription
                    ? `${r.subscription.plan.name} (${fmt(
                        r.subscription.plan.priceMonthly,
                      )} so‘m/oy)`
                    : '—'
                }
              />
            </dl>
          </div>

          {/* Foydalanuvchilar */}
          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-slate-900">
              Foydalanuvchilar
            </h2>
            <div className="divide-y divide-slate-100">
              {r.users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <div className="font-medium text-slate-900">
                      {u.fullName}
                    </div>
                    <div className="text-xs text-slate-400">{u.email}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="badge bg-slate-100 text-slate-500">
                      {ROLE_LABEL[u.role] ?? u.role}
                    </span>
                    <button
                      onClick={() => setPwUser(u)}
                      className="btn btn-sm bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                      <KeyRound size={13} />
                      Parol
                    </button>
                  </div>
                </div>
              ))}
              {r.users.length === 0 && (
                <p className="py-3 text-sm text-slate-500">
                  Foydalanuvchi yo‘q.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Ko'rsatkichlar */}
        <div className="card h-fit p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Ko‘rsatkichlar</h2>
          <div className="space-y-3 text-sm">
            <Stat
              icon={UtensilsCrossed}
              label="Mahsulotlar"
              value={r._count.products}
            />
            <Stat icon={QrCode} label="Stollar" value={r._count.tables} />
            <Stat
              icon={Receipt}
              label="Buyurtmalar"
              value={r._count.orders}
            />
          </div>
        </div>
      </div>

      {editOpen && (
        <EditModal
          restaurant={r}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false);
            load();
          }}
        />
      )}

      {pwUser && (
        <ResetPwModal
          restaurantId={r.id}
          user={pwUser}
          onClose={() => setPwUser(null)}
        />
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/restaurants"
      className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
    >
      <ArrowLeft size={15} />
      Restoranlar
    </Link>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs text-slate-400">
        <Icon size={13} />
        {label}
      </dt>
      <dd className="mt-1 text-slate-800">{value}</dd>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="inline-flex items-center gap-2 text-slate-500">
        <Icon size={15} className="text-slate-400" />
        {label}
      </span>
      <span className="font-semibold tabular-nums text-slate-900">{value}</span>
    </div>
  );
}

function EditModal({
  restaurant,
  onClose,
  onSaved,
}: {
  restaurant: RestaurantDetail;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: restaurant.name,
    phone: restaurant.phone ?? '',
    address: restaurant.address ?? '',
    status: restaurant.status,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.patch(`/super-admin/restaurants/${restaurant.id}`, {
        name: form.name,
        phone: form.phone || undefined,
        address: form.address || undefined,
        status: form.status,
      });
      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Restoranni tahrirlash" onClose={onClose}>
      <form onSubmit={save}>
        <div className="mb-3">
          <label className="label">Nomi</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input"
            required
          />
        </div>
        <div className="mb-3">
          <label className="label">Telefon</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="input"
          />
        </div>
        <div className="mb-3">
          <label className="label">Manzil</label>
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="input"
          />
        </div>
        <div className="mb-3">
          <label className="label">Holati</label>
          <select
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as RestaurantStatus })
            }
            className="input"
          >
            <option value="ACTIVE">Faol</option>
            <option value="TRIAL">Sinov</option>
            <option value="SUSPENDED">To‘xtatilgan</option>
          </select>
        </div>

        {error && (
          <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {error}
          </p>
        )}

        <div className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn flex-1 bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            Bekor qilish
          </button>
          <button
            disabled={saving}
            className="btn btn-primary flex-1 disabled:opacity-60"
          >
            {saving ? 'Saqlanmoqda…' : 'Saqlash'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ResetPwModal({
  restaurantId,
  user,
  onClose,
}: {
  restaurantId: string;
  user: RestaurantUser;
  onClose: () => void;
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.post(`/super-admin/restaurants/${restaurantId}/reset-password`, {
        userId: user.id,
        password,
      });
      setDone(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Parolni tiklash" onClose={onClose}>
      {done ? (
        <div>
          <p className="mb-4 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
            {user.email} uchun yangi parol o‘rnatildi.
          </p>
          <button onClick={onClose} className="btn btn-primary w-full">
            Yopish
          </button>
        </div>
      ) : (
        <form onSubmit={save}>
          <p className="mb-3 text-sm text-slate-500">
            <span className="font-medium text-slate-700">{user.email}</span>{' '}
            uchun yangi parol kiriting.
          </p>
          <div className="mb-3">
            <label className="label">Yangi parol</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              minLength={6}
              placeholder="kamida 6 belgi"
              required
            />
          </div>

          {error && (
            <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {error}
            </p>
          )}

          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn flex-1 bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              Bekor qilish
            </button>
            <button
              disabled={saving}
              className="btn btn-primary flex-1 disabled:opacity-60"
            >
              {saving ? 'Saqlanmoqda…' : 'Tiklash'}
            </button>
          </div>
        </form>
      )}
    </ModalShell>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="card w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
