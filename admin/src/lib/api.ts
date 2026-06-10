const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
const TOKEN_KEY = 'girgitton_super_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (res.status === 401) {
    tokenStore.clear();
    throw new Error('Avtorizatsiya muddati tugadi');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      Array.isArray(err.message) ? err.message.join(', ') : err.message ?? 'Xatolik',
    );
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(p: string) => request<T>(p),
  post: <T>(p: string, body?: unknown) =>
    request<T>(p, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  patch: <T>(p: string, body?: unknown) =>
    request<T>(p, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
};

// ---------- Tiplar ----------
export interface AuthUser {
  id: string;
  email: string;
  role: string;
  restaurantId: string | null;
}

export interface Stats {
  totalRestaurants: number;
  activeRestaurants: number;
  trialRestaurants: number;
  totalOrders: number;
  totalRevenue: string;
}

export type RestaurantStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED';

export interface RestaurantRow {
  id: string;
  name: string;
  slug: string;
  status: RestaurantStatus;
  createdAt: string;
  subscription: {
    status: string;
    plan: { name: string; priceMonthly: string };
  } | null;
  _count: { products: number; tables: number; orders: number };
}

export interface Plan {
  id: string;
  name: string;
  priceMonthly: string;
  maxTables: number;
  maxProducts: number;
  isActive: boolean;
  _count?: { subscriptions: number };
}

export interface Payment {
  id: string;
  amount: string;
  currency: string;
  status: string;
  provider: string | null;
  createdAt: string;
  subscription: { restaurant: { id: string; name: string } } | null;
}
