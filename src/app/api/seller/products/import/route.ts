import { createHash } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireSellerApi } from '@/lib/auth/require-seller-api';
import { parseProductCsv, type ProductImportRow } from '@/lib/csv/product-import';

export const dynamic = 'force-dynamic';

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const WRITE_BATCH_SIZE = 100;

function hashBuffer(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

function jsonValue(raw: string | null | undefined) {
  if (!raw || raw.trim() === '') return Prisma.JsonNull;
  return JSON.parse(raw);
}

async function updateBatch(
  tx: Prisma.TransactionClient,
  batchId: string,
  values: { createdRows?: number; failedRows?: number; status?: string; errorJson?: unknown },
) {
  await tx.$executeRaw(
    Prisma.sql`
      UPDATE "ProductImportBatch"
      SET "createdRows" = COALESCE(${values.createdRows ?? null}, "createdRows"),
          "failedRows" = COALESCE(${values.failedRows ?? null}, "failedRows"),
          "status" = COALESCE(${values.status ?? null}, "status"),
          "errorJson" = COALESCE(${values.errorJson == null ? null : JSON.stringify(values.errorJson)}::jsonb, "errorJson"),
          "updatedAt" = NOW()
      WHERE "id" = ${batchId}
    `,
  );
}

export async function OPTIONS() {
  return jsonPreflight();
}

export async function POST(req: NextRequest) {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  const form = await req.formData();
  const fileValue = form.get('file');
  if (!(fileValue instanceof File)) return jsonError('file_required', 'CSV file is required', { status: 400 });
  if (fileValue.size <= 0) return jsonError('file_empty', 'CSV file is empty', { status: 400 });
  if (fileValue.size > MAX_FILE_BYTES) return jsonError('file_too_large', 'CSV file is too large (max 20 MB)', { status: 413 });

  const buffer = Buffer.from(await fileValue.arrayBuffer());
  const sourceHash = hashBuffer(buffer);
  const sourceName = fileValue.name.slice(0, 255);

  let rows: ProductImportRow[];
  try {
    rows = parseProductCsv(buffer.toString('utf8'));
  } catch (error) {
    return jsonError('invalid_csv', error instanceof Error ? error.message : 'Invalid CSV', { status: 422 });
  }

  const sellerId = guard.user.id;
  const batchId = `imp_${sourceHash.slice(0, 24)}`;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.$queryRaw<Array<{ id: string; status: string; createdRows: number; failedRows: number; totalRows: number }>>(
        Prisma.sql`
          SELECT "id", "status", "createdRows", "failedRows", "totalRows"
          FROM "ProductImportBatch"
          WHERE "sellerId" = ${sellerId} AND "sourceHash" = ${sourceHash}
          LIMIT 1
        `,
      );

      if (existing[0]?.status === 'completed') return { ...existing[0], resumed: false };

      if (!existing.length) {
        await tx.$executeRaw(
          Prisma.sql`
            INSERT INTO "ProductImportBatch" ("id", "sellerId", "sourceName", "sourceHash", "status", "totalRows")
            VALUES (${batchId}, ${sellerId}, ${sourceName}, ${sourceHash}, 'processing', ${rows.length})
            ON CONFLICT ("sellerId", "sourceHash") DO NOTHING
          `,
        );
      }

      let createdRows = 0;
      for (let start = 0; start < rows.length; start += WRITE_BATCH_SIZE) {
        const chunk = rows.slice(start, start + WRITE_BATCH_SIZE);
        const inserted = await tx.product.createMany({
          data: chunk.map((row) => ({
            slug: row.slug,
            name: row.name,
            shortDescription: row.shortDescription,
            description: row.description ?? null,
            price: row.price,
            compareAtPrice: row.compareAtPrice ?? null,
            categoryId: row.categoryId,
            sellerId,
            region: row.region,
            currency: row.currency,
            inStock: row.inStock,
            isActive: row.isActive,
            stockQuantity: row.stockQuantity,
            whatsappNumber: row.whatsappNumber ?? null,
            videoUrl: row.videoUrl ?? null,
            isTraditional: row.isTraditional,
            weightKg: row.weightKg ?? null,
            dimensionsJson: jsonValue(row.dimensionsJson),
            tagsJson: jsonValue(row.tagsJson),
            attributesJson: jsonValue(row.attributesJson),
            badge: row.compareAtPrice != null ? 'sale' : null,
          })),
          skipDuplicates: true,
        });
        createdRows += inserted.count;
        await updateBatch(tx, batchId, { createdRows, status: 'processing' });
      }

      await updateBatch(tx, batchId, { createdRows, failedRows: 0, status: 'completed' });
      return { id: batchId, status: 'completed', totalRows: rows.length, createdRows, failedRows: 0, resumed: Boolean(existing.length) };
    }, { timeout: 120000, maxWait: 5000 });

    return jsonOk(result, { status: 201 });
  } catch (error) {
    try {
      await prisma.$executeRaw(
        Prisma.sql`
          UPDATE "ProductImportBatch"
          SET "status" = 'failed', "errorJson" = ${JSON.stringify({ message: error instanceof Error ? error.message : 'Import failed' })}::jsonb, "updatedAt" = NOW()
          WHERE "sellerId" = ${sellerId} AND "sourceHash" = ${sourceHash}
        `,
      );
    } catch {
      // Keep original import error as the response source.
    }
    console.error('[seller/products/import] failed', error);
    return jsonError('import_failed', 'Product import failed', { status: 500 });
  }
}
