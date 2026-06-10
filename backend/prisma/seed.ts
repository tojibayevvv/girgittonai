import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // ----- Super admin -----
  const superAdminEmail = 'super@girgitton.ai';
  const superAdminPass = await bcrypt.hash('superadmin123', 10);
  await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      email: superAdminEmail,
      passwordHash: superAdminPass,
      fullName: 'Super Admin',
      role: 'SUPER_ADMIN',
    },
  });

  // ----- Tariflar -----
  const free = await prisma.plan.upsert({
    where: { name: 'Free' },
    update: {},
    create: {
      name: 'Free',
      priceMonthly: 0,
      maxTables: 5,
      maxProducts: 30,
      features: { ai: false, analytics: false },
    },
  });
  await prisma.plan.upsert({
    where: { name: 'Pro' },
    update: {},
    create: {
      name: 'Pro',
      priceMonthly: 199000,
      maxTables: 50,
      maxProducts: 500,
      features: { ai: true, analytics: true },
    },
  });

  // ----- Demo restoran + admin -----
  const demoEmail = 'admin@demo.uz';
  const existing = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (!existing) {
    const pass = await bcrypt.hash('demo123', 10);
    const restaurant = await prisma.restaurant.create({
      data: {
        name: 'Demo Kafe',
        slug: 'demo-kafe',
        phone: '+998901234567',
        status: 'ACTIVE',
        users: {
          create: {
            email: demoEmail,
            passwordHash: pass,
            fullName: 'Demo Admin',
            role: 'RESTAURANT_ADMIN',
          },
        },
        subscription: {
          create: { planId: free.id, status: 'ACTIVE' },
        },
        categories: {
          create: [
            { name: 'Issiq taomlar', sortOrder: 1 },
            { name: 'Ichimliklar', sortOrder: 2 },
          ],
        },
        tables: {
          create: [
            { name: 'Stol 1', code: 'demotable1' },
            { name: 'Stol 2', code: 'demotable2' },
          ],
        },
      },
      include: { categories: true },
    });

    const issiq = restaurant.categories.find((c) => c.name === 'Issiq taomlar');
    const ichimlik = restaurant.categories.find((c) => c.name === 'Ichimliklar');

    await prisma.product.createMany({
      data: [
        {
          restaurantId: restaurant.id,
          categoryId: issiq?.id,
          name: 'Lag‘mon',
          description: 'An’anaviy qo‘l lag‘moni',
          price: 35000,
          isSpicy: true,
          tags: ['achchiq', 'issiq'],
        },
        {
          restaurantId: restaurant.id,
          categoryId: issiq?.id,
          name: 'Osh (palov)',
          description: 'Toshkent oshi',
          price: 40000,
          tags: ['halol'],
        },
        {
          restaurantId: restaurant.id,
          categoryId: ichimlik?.id,
          name: 'Choy',
          price: 5000,
          tags: ['issiq'],
        },
        {
          restaurantId: restaurant.id,
          categoryId: ichimlik?.id,
          name: 'Cola 0.5L',
          price: 12000,
          tags: ['sovuq'],
        },
      ],
    });
  }

  // eslint-disable-next-line no-console
  console.log('Seed tugadi.');
  // eslint-disable-next-line no-console
  console.log('Super admin: super@girgitton.ai / superadmin123');
  // eslint-disable-next-line no-console
  console.log('Demo restoran admin: admin@demo.uz / demo123');
  // eslint-disable-next-line no-console
  console.log('Demo stol kodlari: demotable1, demotable2');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
