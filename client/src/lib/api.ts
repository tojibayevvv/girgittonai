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

// ===== AI ovozli ofitsiant =====

export interface AiChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface AiCartItem {
  productId: string;
  quantity: number;
}

export type AiAction =
  | { type: 'add'; items: AiCartItem[] }
  | { type: 'remove'; items: AiCartItem[] }
  | { type: 'place' };

export interface AiReply {
  reply: string;
  actions: AiAction[];
}

export async function sendAiMessage(
  tableCode: string,
  messages: AiChatMessage[],
  cart: AiCartItem[],
): Promise<AiReply> {
  const res = await fetch(`${API_URL}/public/menu/${tableCode}/ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, cart }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'AI bilan bog‘lanib bo‘lmadi');
  }
  return res.json();
}

// Matnni o'zbek ovoziga aylantirish (Azure TTS). Audio blob URL qaytaradi.
// Azure sozlanmagan bo'lsa null qaytaradi — brauzer ovoziga tushib qolamiz.
export async function synthesizeSpeech(text: string): Promise<string | null> {
  const res = await fetch(`${API_URL}/public/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) return null;
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
