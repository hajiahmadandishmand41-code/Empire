/**
 * @deprecated — Legacy Drizzle DB stub.
 *
 * This project now uses Prisma exclusively. These exports are kept ONLY to
 * prevent import errors in files not yet migrated. They perform NO real DB
 * operations. DO NOT use in new code — import from '@/lib/db' (Prisma) instead.
 *
 * Removal: safe to delete once all callers import from '@/lib/db'.
 *
 * @module drizzle-stub
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db: any = {
  select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }),
  insert: () => ({ values: () => Promise.resolve([]) }),
  update: () => ({ set: () => ({ where: () => Promise.resolve([]) }) }),
  delete: () => ({ where: () => Promise.resolve([]) }),
};