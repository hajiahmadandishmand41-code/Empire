import { NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { isPersistentStorageConfigured } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const databaseConfigured = isDatabaseConfigured();
  let database: 'ok' | 'unavailable' = databaseConfigured ? 'unavailable' : 'unavailable';
  if (databaseConfigured) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      database = 'ok';
    } catch {
      database = 'unavailable';
    }
  }

  const auth: 'ok' | 'unavailable' = Boolean(process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim() || process.env.SESSION_SECRET?.trim()) ? 'ok' : 'unavailable';
  const storage: 'ok' | 'unavailable' = isPersistentStorageConfigured || database === 'ok' ? 'ok' : 'unavailable';
  const ok = database === 'ok' && auth === 'ok';

  return NextResponse.json(
    { application: 'ok', database, auth, storage },
    { status: ok ? 200 : 503, headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
