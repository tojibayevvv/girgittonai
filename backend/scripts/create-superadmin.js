// Faqat super admin foydalanuvchisini yaratadi (demo ma'lumotlarsiz).
// Ishga tushirish: DATABASE_URL=<railway public url> node scripts/create-superadmin.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'super@girgitton.ai';
  const password = 'superadmin123';
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: 'SUPER_ADMIN' },
    create: {
      email,
      passwordHash,
      fullName: 'Super Admin',
      role: 'SUPER_ADMIN',
    },
  });

  console.log('Super admin tayyor:', user.email, '| role:', user.role);
}

main()
  .catch((e) => {
    console.error('Xato:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
