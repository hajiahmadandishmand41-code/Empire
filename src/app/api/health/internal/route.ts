/** Protected readiness/diagnostics endpoint for monitoring only. */
import { NextRequest, NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = process.env.METRICS_TOKEN;
  const provided = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token || !provided || provided !== token) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, status: 'degraded', db: 'missing' }, { status: 503 });
  }

  try {
    const { prisma } = await import('@/lib/db');
    await prisma.$queryRaw`SELECT 1`;
    const rows = await prisma.$queryRaw<{ applied: bigint | number; failed: bigint | number }[]>`
      SELECT
        COUNT(*) FILTER (WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL) AS applied,
        COUNT(*) FILTER (WHERE finished_at IS NULL OR rolled_back_at IS NOT NULL) AS failed
      FROM "_prisma_migrations"
    `;
    const applied = Number(rows[0]?.applied ?? 0);
    const failed = Number(rows[0]?.failed ?? 0);
    const ready = applied > 0 && failed === 0;
    return NextResponse.json(
      { ok: ready, status: ready ? 'ready' : 'degraded', db: 'up', migrations: applied },
      { status: ready ? 200 : 503 },
    );
  } catch {
    return NextResponse.json({ ok: false, status: 'degraded', db: 'down' }, { status: 503 });
  }
}
