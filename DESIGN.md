# Design

Toza, yorug' SaaS uslubi (Linear / Stripe altitudasi). Asbob ko'rinmas, rang ma'noli, komponentlar tanish.

## Color

OKLCH bilan o'ylangan, Tailwind slate + emerald orqali amalga oshirilgan.

- **Canvas (fon):** slate-50 `#f8fafc` — sovuq neytral.
- **Surface:** white `#ffffff` (kartochka, panel).
- **Surface-2 (sidebar/toolbar):** white + border, yoki slate-50 toolbar.
- **Ink:** slate-900 `#0f172a` (sarlavha), slate-600 `#475569` (asosiy matn), slate-400 (ikkilamchi).
- **Border:** slate-200 `#e2e8f0`, hover slate-300.
- **Accent (emerald):** 600 `#059669` (asosiy amal, faol holat), 500 hover, 50/100 yumshoq tint, 700 bosilganda.
- **Semantik (yumshoq tintlar):** amber (kutilmoqda), sky (qabul), indigo (tayyorlanmoqda), emerald (tayyor), teal (berildi), slate (yopildi), rose (bekor/xato).

State'lar: hover (biroz to'qroq/och), focus (emerald ring `ring-2 ring-emerald-500/40`), disabled (opacity-50, cursor-not-allowed).

## Typography

- **Family:** Inter (variable) — bitta oila, og'irlik kontrasti orqali ierarxiya. `font-feature-settings: "cv11", "ss01"`. Fallback: system-ui.
- **Scale (fixed rem):** 12 / 13 / 14(body) / 16 / 18 / 20 / 24 / 30. Ratio ~1.2.
- **Weights:** 400 body, 500 medium (label/nav), 600 semibold (sarlavha/raqam), 700 kuchli sarlavha.
- **Tracking:** sarlavhalarда `-0.01em`; kichik uppercase label'larда `0.04em` (kam ishlatiladi).
- Tabular raqamlar narx/summalarда: `tabular-nums`.

## Radii & Shadow

- Radii: `rounded-lg` (10px) tugma/input, `rounded-xl` (14px) kartochka, `rounded-full` badge/avatar.
- Shadow: juda nozik. `shadow-sm` default; kartochka uchun maxsus `shadow-card` (0 1px 2px rgba(15,23,42,.04), 0 1px 3px rgba(15,23,42,.06)). Qalin soya yo'q.

## Iconography

- **lucide-react**, 1.75 stroke, 16–20px. Emoji ishlatilmaydi.
- Nav: Receipt (buyurtma), UtensilsCrossed (menyu), FolderTree (kategoriya), QrCode (stollar), LayoutDashboard, Store (restoran), CreditCard (tarif), Wallet (to'lov).

## Components

`@layer components` da standartlashtirilgan: `.btn` (primary/ghost/danger/sm), `.input`, `.label`, `.card`, `.badge`. Har bir interaktiv element to'liq holatlarga ega. Bo'sh holatlar (empty state) interfeysni o'rgatadi, "hech narsa yo'q" emas.

## Motion

150–250ms, `ease-out`. Holat o'zgarishi/feedback uchun (hover, fokus, kartochka kirishi). Sahifa yuklanishda orkestrlangan animatsiya yo'q. `prefers-reduced-motion` da o'tishlar instant.

## Layout

- adminpanel/admin: chap sidebar (ikon+label, faol = emerald tint) + kontent maydoni sarlavha bilan. Kartochka gridlari `auto-fit minmax`.
- client: mobil-birinchi, bitta ustun, sticky header, pastда sticky savatcha paneli, katta teginish maydonlari.
