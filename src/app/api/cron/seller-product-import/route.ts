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

  // Recover rows left in-flight by a crashed worker. Normal 100-row chunks
  // should complete well below ten minutes.
  await prisma.$executeRaw(
    Prisma.sql`
      UPDATE "ProductImportRow"
      SET "status" = 'pending', "updatedAt" = NOW()
      WHERE "status" = 'processing' AND "updatedAt" < NOW() - INTERVAL '10 minutes'
    `,
  );

  const batches = await prisma.$queryRaw<Array<{ id: string; sellerId: string }>>(
    Prisma.sql`
      SELECT "id", "sellerId"
      FROM "ProductImportBatch"
      WHERE "status" IN ('processing', 'queued')
      ORDER BY "updatedAt" ASC
      LIMIT 10
    `,
  );

  let processed = 0;
  let completedBatches = 0;

  for (const batch of batches) {
    const claimed = await prisma.$transaction(async (tx) => {
      return tx.$queryRaw<Array<{ id: string; payloadJson: unknown }>>(
        Prisma.sql`
          WITH picked AS (
            SELECT "id"
            FROM "ProductImportRow"
            WHERE "batchId" = ${batch.id} AND "status" = 'pending'
            ORDER BY "rowIndex" ASC
            LIMIT ${CHUNK_SIZE}
            FOR UPDATE SKIP LOCKED
          )
          UPDATE "ProductImportRow" AS r
          SET "status" = 'processing', "updatedAt" = NOW()
          FROM picked
          WHERE r."id" = picked."id"
          RETURNING r."id", r."payloadJson"
        `,
      );
    }, { timeout: 15000, maxWait: 5000 });

    if (!claimed.length) {
      const pending = await prisma.$queryRaw<Array<{ count: bigint }>>(
        Prisma.sql`
          SELECT COUNT(*)::bigint AS count
          FROM "ProductImportRow"
          WHERE "batchId" = ${batch.id} AND "status" IN ('pending', 'processing')
        `,
      );
      if (Number(pending[0]?.count ?? 0n) === 0) {
        await prisma.$executeRaw(
          Prisma.sql`
            UPDATE "ProductImportBatch"
            SET "status" = 'completed', "updatedAt" = NOW()
            WHERE "id" = ${batch.id}
          `,
        );
        completedBatches += 1;
      }
      continue;
    }

    let created = 0;
    let failed = 0;

    for (const row of claimed) {
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
          Prisma.sql`
            UPDATE "ProductImportRow"
            SET "status" = 'completed', "updatedAt" = NOW()
            WHERE id = ${row.id}
          `,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'row failed';
        if (message.includes('Unique constraint') || message.includes('duplicate key')) {
          await prisma.$executeRaw(
            Prisma.sql`
              UPDATE "ProductImportRow"
              SET "status" = 'completed', "error" = 'skipped_duplicate', "updatedAt" = NOW()
              WHERE id = ${row.id}
            `,
          );
        } else {
          failed += 1;
          await prisma.$executeRaw(
            Prisma.sql`
              UPDATE "ProductImportRow"
              SET "status" = 'failed', "error" = ${message}, "updatedAt" = NOW()
              WHERE id = ${row.id}
            `,
          );
        }
      }
    }

    await prisma.$executeRaw(
      Prisma.sql`
        UPDATE "ProductImportBatch"
        SET "processedRows" = "processedRows" + ${claimed.length},
            "createdRows" = "createdRows" + ${created},
            "failedRows" = "failedRows" + ${failed},
            "status" = CASE
              WHEN "processedRows" + ${claimed.length} >= "totalRows" THEN 'completed'
              ELSE 'processing'
            END,
            "updatedAt" = NOW()
        WHERE id = ${batch.id}
      `,
    );
    processed += claimed.length;
  }

  return Response.json({ ok: true, processed, batches: batches.length, completedBatches });
}
