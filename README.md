# GirgittonAI

Restoran va kafelar uchun **QR-menyu + buyurtma avtomatlashtirish** SaaS platformasi.

Mijoz stoldagi QR kodni skanerlaydi → menyu ochiladi → mahsulotlarni vizual ko‘rib
buyurtma beradi → buyurtma restoran admin paneliga tushadi. (AI maslahatchi —
"achchiqroq taom bormi?" kabi tavsiyalar — keyingi bosqichda qo‘shiladi.)

## Tuzilma (monorepo, har bir papka mustaqil)

| Papka          | Vazifasi                                   | Stack                        | Dev port |
| -------------- | ------------------------------------------ | ---------------------------- | -------- |
| `backend`      | API + biznes mantiq + DB                   | NestJS + Prisma + PostgreSQL | 4000     |
| `client`       | Mijoz: QR orqali menyu va buyurtma          | Vite + React + TS + Tailwind | 5173     |
| `adminpanel`   | Restoran admini: buyurtma, menyu, stollar   | Vite + React + TS + Tailwind | 5174     |
| `admin`        | Super admin (SaaS): mijozlar, tarif, to‘lov | Vite + React + TS + Tailwind | 5175     |

## Rollar

- **SUPER_ADMIN** — platforma egasi. `admin` panelida ishlaydi.
- **RESTAURANT_ADMIN** — restoran egasi. `adminpanel`da ishlaydi.
- **STAFF** — ofitsiant/oshpaz (keyinroq kengaytiriladi).

## Ishga tushirish (lokal)

### 1. PostgreSQL
Lokal Postgres yoki Railway’dan `DATABASE_URL` oling.

### 2. Backend
```bash
cd backend
copy .env.example .env        # DATABASE_URL va JWT_SECRET ni to‘ldiring
npm install                   # (allaqachon o‘rnatilgan)
npm run prisma:migrate        # jadvallarni yaratadi
npm run db:seed               # super admin + demo restoran + demo menyu
npm run start:dev             # http://localhost:4000/api
```

### 3. Frontend (3 ta alohida terminal)
```bash
cd client     && copy .env.example .env && npm run dev   # 5173
cd adminpanel && copy .env.example .env && npm run dev   # 5174
cd admin      && copy .env.example .env && npm run dev   # 5175
```

## Demo kirish ma’lumotlari (seed’dan keyin)

- **Super admin** (`admin` panel): `super@girgitton.ai` / `superadmin123`
- **Restoran admin** (`adminpanel`): `admin@demo.uz` / `demo123`
- **Mijoz menyusi** (`client`): `http://localhost:5173/t/demotable1`

## Railway’ga deploy

`backend` papkasi Railway’da alohida service sifatida deploy qilinadi:

- **Build:** `npm install && npm run build && npm run prisma:generate`
- **Start:** `npm run prisma:deploy && npm run start:prod`
- **O‘zgaruvchilar:** `DATABASE_URL` (Railway Postgres plugin avtomatik beradi),
  `JWT_SECRET`, `CORS_ORIGINS` (frontend manzillari), `PORT` (Railway beradi).

Frontend’lar (Vercel/Netlify yoki Railway static) `VITE_API_URL` ni deploy
qilingan backend manziliga sozlaydi.

## API asosiy yo‘nalishlari

- `POST /api/auth/register` — yangi restoran ro‘yxatdan o‘tadi
- `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/public/menu/:tableCode` — QR orqali menyu (auth kerak emas)
- `POST /api/public/orders` — mijoz buyurtmasi (auth kerak emas)
- `GET/PATCH /api/orders` — restoran buyurtmalari (RESTAURANT_ADMIN)
- `CRUD /api/products`, `/api/categories`, `/api/tables`
- `GET /api/super-admin/stats|restaurants|plans|payments` (SUPER_ADMIN)

## Keyingi bosqich: AI

Mahsulotlarda `tags` va `isSpicy` maydonlari AI tavsiyalari uchun tayyor.
Mijoz menyuda "achchiqroq nimadir bormi?" deb so‘raganda Claude API orqali
mos taomlar tavsiya qilinadigan chat qo‘shiladi.
