import { Prisma } from '@prisma/client';
import { prisma, isDatabaseConfigured } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CHUNK_SIZE = 100;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.VERCEL_ENV !== 'production';
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) return new Response('Unauthorized', { status: 401 });
  if (!isDatabaseConfigured()) return Response.json({ ok: false, error: 'db_unavailable' }, { status: 503 });

  const batches = await prisma.$queryRaw<Array<{ id: string; sellerId: string; status: string }>>(
    Prisma.sql`
      SELECT "id", "sellerId", "status"
      FROM "ProductImportBatch"
      WHERE "status" IN ('processing', 'queued')
      ORDER BY "updatedAt" ASC
      LIMIT 10
    `,
  );

  let processed = 0;
  for (const batch of batches) {
    const rowIds = await prisma.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        SELECT id
        FROM "ProductImportRow"
        WHERE "batchId" = ${batch.id} AND "status" = 'pending'
        ORDER BY "rowIndex" ASC
        LIMIT ${CHUNK_SIZE}
        FOR UPDATE SKIP LOCKED
      `,
    );

    if (!rowIds.length) {
      await prisma.$executeRaw(
        Prisma.sql`
          UPDATE "ProductImportBatch"
          SET "status" = CASE WHEN "processedRows" >= "totalRows" THEN 'completed' ELSE 'processing' END,
              "updatedAt" = NOW()
          WHERE "id" = ${batch.id}
        `,
      );
      continue;
    }

    const ids = rowIds.map((row) => row.id);
    const rows = await prisma.$queryRaw<Array<{ id: string; payloadJson: unknown }>>(
      Prisma.sql`
        SELECT id, "payloadJson"
        FROM "ProductImportRow"
        WHERE id = ANY(${ids})
        ORDER BY "rowIndex" ASC
      `,
    );

    let created = 0;
    let failed = 0;

    for (const row of rows) {
      try {
        const payload = row.payloadJson as Record<string, unknown>;
        await prisma.product.create({
          data: {
            slug: String(payload.slug),
            name: String(payload.name),
            shortDescription: String(payload.shortDescription),
            description: payload.description ? String(payload.description) : null,
            price: Number(payload.price),
            compareAtPrice: payload.compareAtPrice == null ? null : Number(payload.compareAtPrice),
            categoryId: String(payload.categoryId),
            sellerId: batch.sellerId,
            region: String(payload.region ?? 'AF'),
            currency: String(payload.currency ?? 'AFN'),
            inStock: Boolean(payload.inStock ?? true),
            isActive: Boolean(payload.isActive ?? true),
            stockQuantity: Number(payload.stockQuantity ?? 0),
            whatsappNumber: payload.whatsappNumber ? String(payload.whatsappNumber) : null,
            videoUrl: payload.videoUrl ? String(payload.videoUrl) : null,
            isTraditional: Boolean(payload.isTraditional ?? false),
            weightKg: payload.weightKg == null ? null : Number(payload.weightKg),
            dimensionsJson: payload.dimensionsJson ?? undefined,
            tagsJson: payload.tagsJson ?? undefined,
            attributesJson: payload.attributesJson ?? undefined,
            badge: payload.compareAtPrice != null ? 'sale' : null,
          },
        });
        created += 1;
        await prisma.$executeRaw(
          Prisma.sql`UPDATE "ProductImportRow" SET "status" = 'completed', "updatedAt" = NOW() WHERE id = ${row.id}`,
        );
      } catch (error) {
        failed += 1;
        await prisma.$executeRaw(
          Prisma.sql`UPDATE "ProductImportRow" SET "status" = 'failed', "error" = ${error instanceof Error ? error.message : 'row failed'}, "updatedAt" = NOW() WHERE id = ${row.id}`,
        );
      }
    }

    await prisma.$executeRaw(
      Prisma.sql`
        UPDATE "ProductImportBatch"
        SET "processedRows" = "processedRows" + ${rows.length},
            "createdRows" = "createdRows" + ${created},
            "failedRows" = "failedRows" + ${failed},
            "status" = CASE WHEN "processedRows" + ${rows.length} >= "totalRows" THEN 'completed' ELSE 'processing' END,
            "updatedAt" = NOW()
        WHERE id = ${batch.id}
      `,
    );

    processed += rows.length;
  }

  return Response.json({ ok: true, processed, batches: batches.length });
}
