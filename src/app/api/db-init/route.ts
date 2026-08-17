/**
 * Legacy database-init endpoint.
 * Prisma migrations are the only supported database initialization mechanism.
 * This route intentionally does not mutate the database.
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: 'LEGACY_ENDPOINT',
        message: 'Database initialization is managed by Prisma migrations.',
      },
    },
    { status: 410 },
  );
}

export async function POST() {
  return GET();
}
