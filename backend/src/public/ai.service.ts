import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { PublicService } from './public.service';

// Mijoz <-> AI suhbatining bitta xabari (faqat matn saqlanadi)
export interface AiChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

// Mijoz savatchasining hozirgi holati (frontenddan keladi)
export interface AiCartItem {
  productId: string;
  quantity: number;
}

// AI frontendga qaytaradigan amallar (savatchani o'zgartirish / buyurtma berish)
export type AiAction =
  | { type: 'add'; items: AiCartItem[] }
  | { type: 'remove'; items: AiCartItem[] }
  | { type: 'place' };

export interface AiReply {
  reply: string;
  actions: AiAction[];
}

@Injectable()
export class AiService {
  private client: Anthropic | null = null;
  // Tezlik va narx uchun Haiku — ovozli suhbatda kechikish muhim
  private readonly model =
    process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001';

  constructor(private readonly publicService: PublicService) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
    }
  }

  async chat(
    tableCode: string,
    messages: AiChatMessage[],
    cart: AiCartItem[],
  ): Promise<AiReply> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'AI hozircha sozlanmagan (ANTHROPIC_API_KEY yo‘q)',
      );
    }

    const menu = await this.publicService.getMenuByTableCode(tableCode);

    // Menyudagi mahsulotlarni id bo'yicha tekshirish uchun
    const validIds = new Set<string>();
    menu.categories.forEach((c) =>
      c.products.forEach((p) => validIds.add(p.id)),
    );

    const system = this.buildSystemPrompt(menu, cart);

    // Suhbat bo'sh bo'lsa — AI o'zi salomlashib menyuni taklif qiladi
    const apiMessages: Anthropic.MessageParam[] =
      messages.length === 0
        ? [
            {
              role: 'user',
              content:
                '[TIZIM: Mijoz menyuni endi ochdi. FAQAT qisqa salomlashing: "Assalomu alaykum, restoranimizga xush kelibsiz, nima buyurasiz?" kabi. MENYUNI O\'QIMA, taomlarni sanama. Bir-ikki jumla, oxirida buyurtma uchun mikrofonni bosib gapirishni eslatsang bo\'ladi.]',
            },
          ]
        : messages.map((m) => ({ role: m.role, content: m.text }));

    let response: Anthropic.Message;
    try {
      response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        system,
        tools: this.tools,
        messages: apiMessages,
      });
    } catch {
      throw new ServiceUnavailableException('AI bilan bog‘lanishda xatolik');
    }

    let reply = '';
    const actions: AiAction[] = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        reply += block.text;
      } else if (block.type === 'tool_use') {
        const input = block.input as {
          items?: { productId: string; quantity: number }[];
        };
        const cleanItems = (input.items ?? [])
          .filter((i) => validIds.has(i.productId) && i.quantity > 0)
          .map((i) => ({
            productId: i.productId,
            quantity: Math.floor(i.quantity),
          }));

        if (block.name === 'add_items' && cleanItems.length) {
          actions.push({ type: 'add', items: cleanItems });
        } else if (block.name === 'remove_items' && cleanItems.length) {
          actions.push({ type: 'remove', items: cleanItems });
        } else if (block.name === 'place_order') {
          actions.push({ type: 'place' });
        }
      }
    }

    return { reply: reply.trim(), actions };
  }

  private get tools(): Anthropic.Tool[] {
    const itemsSchema = {
      type: 'object' as const,
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              productId: { type: 'string', description: 'Mahsulot id si' },
              quantity: { type: 'integer', description: 'Soni (dona)' },
            },
            required: ['productId', 'quantity'],
          },
        },
      },
      required: ['items'],
    };

    return [
      {
        name: 'add_items',
        description:
          'Mijoz buyurtma qilmoqchi bo‘lgan mahsulotlarni savatchaga qo‘shadi. Mijoz "buni 2 ta, undan 3 ta" deganda ishlat.',
        input_schema: itemsSchema,
      },
      {
        name: 'remove_items',
        description: 'Savatchadan mahsulotni olib tashlaydi yoki sonini kamaytiradi.',
        input_schema: itemsSchema,
      },
      {
        name: 'place_order',
        description:
          'Savatchadagi buyurtmani oshxonaga rasmiy yuboradi. Faqat mijoz buyurtmani tasdiqlagandan keyin ishlat.',
        input_schema: { type: 'object' as const, properties: {} },
      },
    ];
  }

  private buildSystemPrompt(
    menu: Awaited<ReturnType<PublicService['getMenuByTableCode']>>,
    cart: AiCartItem[],
  ): string {
    const currency = menu.restaurant.currency;
    const productName = new Map<string, string>();

    const menuText = menu.categories
      .map((c) => {
        const items = c.products
          .map((p) => {
            productName.set(p.id, p.name);
            const parts = [
              `  - id: ${p.id}`,
              `nomi: ${p.name}`,
              `narxi: ${p.price} ${currency}`,
            ];
            if (p.description) parts.push(`tavsif: ${p.description}`);
            if (p.isSpicy) parts.push('achchiq');
            if (p.tags?.length) parts.push(`teglar: ${p.tags.join(', ')}`);
            return parts.join(' | ');
          })
          .join('\n');
        return `### ${c.name}\n${items}`;
      })
      .join('\n\n');

    const cartText = cart.length
      ? cart
          .map(
            (i) =>
              `  - ${productName.get(i.productId) ?? i.productId} × ${i.quantity}`,
          )
          .join('\n')
      : '  (bo‘sh)';

    return `Sen "${menu.restaurant.name}" restoranining ovozli AI ofitsiantisan. Mijoz stol yonida o'tirib, ovoz orqali sen bilan gaplashadi.

VAZIFANG:
- Mijozni iliq kutib ol, menyu bo'yicha yordam ber, taom tavsiya qil va buyurtmani rasmiylashtir.
- Mijoz "bundan 2 ta, undan 3 ta" deb aytsa — add_items asbobidan foydalanib savatchaga qo'sh.
- Mijoz biror narsani olib tashlamoqchi bo'lsa — remove_items dan foydalan.
- Mijoz buyurtmani tasdiqlasa ("ha, yuboring", "shu, tamom") — place_order dan foydalan.
- Buyurtma berishdan oldin doim qisqa takrorlab tasdiqlat (nima va nechta).

USLUB (MUHIM — javobing ovozда o'qiladi):
- Qisqa, samimiy va tabiiy gapir — bu ovozli suhbat, javoblar 1-3 jumla bo'lsin.
- FAQAT oddiy gap yoz. Markdown ishlatma: yulduzcha (*), qalin (**), ro'yxat raqamlari (1. 2.), chiziq (-, —) va boshqa belgilardan FOYDALANMA — ular ovozда noto'g'ri o'qiladi.
- Bir nechta narsani sanaganda gap ichida tabiiy ayt, masalan: "Bizda choy besh ming so'mga va kola o'n ikki ming so'mga bor. Qaysi birini xohlaysiz?"
- Narxni doim "so'm" deb ayt, "UZS" yoki "U Z S" dema. Masalan 5000 ni "besh ming so'm" deb ayt.
- Mijoz qaysi tilda gapirsa (o'zbek, rus, ingliz) — shu tilda javob ber. Kerak bo'lsa tarjima qil.
- Faqat menyudagi mahsulotlarni taklif qil.
- Asbob ishlatganingda ham doim qisqa og'zaki javob ham yoz (mijoz eshitishi uchun).
- Hech qachon mahsulot id sini ovoz chiqarib aytma — faqat nomini ayt.

MENYU:
${menuText}

HOZIRGI SAVATCHA:
${cartText}`;
  }
}
