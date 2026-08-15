/**
 * DB Init — Legacy endpoint stub.
 * The project now uses Prisma migrations. This endpoint is kept for
 * backwards compatibility but does nothing harmful.
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'This project uses Prisma. Run `prisma migrate deploy` to initialize the database.',
  });
}
