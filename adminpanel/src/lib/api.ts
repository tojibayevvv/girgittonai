const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

const TOKEN_KEY = 'girgitton_admin_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
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
    throw new Error('Avtorizatsiya muddati tugadi, qayta kiring');
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
  del: <T>(p: string) => request<T>(p, { method: 'DELETE' }),
};

// Rasmni serverga yuklaydi va saqlangan rasm URL'ini qaytaradi
export async function uploadImage(file: File): Promise<string> {
  const token = tokenStore.get();
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${API_URL}/uploads`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Rasm yuklanmadi');
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}

// ---------- Tiplar ----------
export interface AuthUser {
  id: string;
  email: string;
  role: string;
  restaurantId: string | null;
}

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  isAvailable: boolean;
  isSpicy: boolean;
  tags: string[];
  categoryId: string | null;
  category?: { id: string; name: string } | null;
}

export interface Table {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface OrderItem {
  id: string;
  name: string;
  price: string;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  total: string;
  note: string | null;
  createdAt: string;
  table: { id: string; name: string } | null;
  items: OrderItem[];
}
