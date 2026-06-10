const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  isSpicy: boolean;
  tags: string[];
}

export interface Category {
  id: string;
  name: string;
  products: Product[];
}

export interface MenuResponse {
  table: { id: string; name: string; code: string };
  restaurant: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    currency: string;
    status: string;
  };
  categories: Category[];
}

export async function getMenu(tableCode: string): Promise<MenuResponse> {
  const res = await fetch(`${API_URL}/public/menu/${tableCode}`);
  if (!res.ok) throw new Error('Menyu topilmadi');
  return res.json();
}

export interface CreateOrderPayload {
  tableCode: string;
  items: { productId: string; quantity: number }[];
  note?: string;
}

export async function createOrder(payload: CreateOrderPayload) {
  const res = await fetch(`${API_URL}/public/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Buyurtma yuborilmadi');
  }
  return res.json();
}
