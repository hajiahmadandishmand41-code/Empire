import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const SAFE_ID = /^[A-Za-z0-9_-]{8,80}$/;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!SAFE_ID.test(id)) return new NextResponse('Not found', { status: 404 });

  const rows = await prisma.$queryRaw<Array<{
    mimeType: string | null;
    data: Buffer | null;
    sizeBytes: number | null;
  }>>(Prisma.sql`
    SELECT "mimeType", "data", "sizeBytes"
    FROM "MediaAsset"
    WHERE "id" = ${id}
    LIMIT 1
  `);

  const media = rows[0];
  if (!media?.data) return new NextResponse('Not found', { status: 404 });

  return new NextResponse(media.data as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': media.mimeType || 'application/octet-stream',
      'Content-Length': String(media.sizeBytes ?? media.data.byteLength),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
