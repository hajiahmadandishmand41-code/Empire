/**
 * Prisma client singleton.
 *
 * Prevents exhausting the DB connection pool during Next.js
 * hot-reload in development. `prisma` is a no-op stub if
 * `@prisma/client` has not been generated yet — this lets the app
 * boot with an empty `DATABASE_URL` and fall back to mocks.
 */
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0);
}
