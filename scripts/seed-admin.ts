/**
 * Create/update the admin user in the database.
 * Run: npx tsx scripts/seed-admin.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const seedPassword = process.env.ADMIN_SEED_PASSWORD;
  if (!seedPassword || seedPassword.length < 12) {
    throw new Error('ADMIN_SEED_PASSWORD must be provided and at least 12 characters long.');
  }

  const email = (process.env.ADMIN_SEED_EMAIL ?? 'admin@empire.shop').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error('ADMIN_SEED_EMAIL must be a valid email address.');
  }

  const fullName = (process.env.ADMIN_SEED_NAME ?? 'مدیر سیستم').trim() || 'مدیر سیستم';
  const hash = await bcrypt.hash(seedPassword, 12);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash: hash, role: 'admin', isActive: true, fullName },
    create: {
      fullName,
      email,
      passwordHash: hash,
      role: 'admin',
      isActive: true,
    },
  });
}

main()
  .catch((error: unknown) => {
    console.error('Admin seed failed', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
