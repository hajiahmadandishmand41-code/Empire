import { NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { checkPersistentStorage } from '@/lib/storage';
import { hasValidAuthSecret } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const databaseConfigured = isDatabaseConfigured();
  let database: 'ok' | 'unavailable' = 'unavailable';
  if (databaseConfigured) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      database = 'ok';
    } catch {
      database = 'unavailable';
    }
  }

  const auth: 'ok' | 'unavailable' = hasValidAuthSecret() ? 'ok' : 'unavailable';
  const storage: 'ok' | 'unavailable' = await checkPersistentStorage()
    ? 'ok'
    : 'unavailable';
  const ok = database === 'ok' && auth === 'ok' && storage === 'ok';

  return NextResponse.json(
    { application: 'ok', database, auth, storage },
    { status: ok ? 200 : 503, headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
