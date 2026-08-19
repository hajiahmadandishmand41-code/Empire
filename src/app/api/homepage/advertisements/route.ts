import { Prisma } from '@prisma/client';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isDatabaseConfigured()) return jsonOk([]);

  try {
    const rows = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT "id","titleFa","titlePs","titleEn","subtitleFa","subtitlePs","subtitleEn","imageUrl","href","sortOrder"
      FROM "HomepageAdvertisement"
      WHERE "isActive" = true
        AND ("startsAt" IS NULL OR "startsAt" <= NOW())
        AND ("endsAt" IS NULL OR "endsAt" >= NOW())
      ORDER BY "sortOrder" ASC, "createdAt" DESC
      LIMIT 5
    `);

    return jsonOk(rows.map((row) => ({
      id: String(row.id),
      titleFa: String(row.titleFa ?? ''),
      titlePs: String(row.titlePs ?? ''),
      titleEn: String(row.titleEn ?? ''),
      subtitleFa: String(row.subtitleFa ?? ''),
      subtitlePs: String(row.subtitlePs ?? ''),
      subtitleEn: String(row.subtitleEn ?? ''),
      imageUrl: row.imageUrl ? String(row.imageUrl) : null,
      href: row.href ? String(row.href) : '/shop',
      sortOrder: Number(row.sortOrder ?? 0),
    })));
  } catch (error) {
    console.error('[api/homepage/advertisements.GET]', error);
    return jsonError('query_failed', 'Failed to load homepage advertisements', { status: 500 });
  }
}
