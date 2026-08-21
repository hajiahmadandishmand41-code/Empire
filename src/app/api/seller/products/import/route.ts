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

function batchId(sellerId: string, sourceHash: string): string {
  return `imp_${createHash('sha256').update(`${sellerId}:${sourceHash}`).digest('hex').slice(0, 32)}`;
}

function jsonValue(raw: string | null | undefined) {
  if (!raw || raw.trim() === '') return Prisma.JsonNull;
  return JSON.parse(raw);
}

function toProductData(row: ProductImportRow, sellerId: string) {
  return {
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
  };
}

async function setBatchStatus(
  id: string,
  values: { status?: string; processedRows?: number; createdRows?: number; errorJson?: unknown },
) {
  await prisma.$executeRaw(
    Prisma.sql`
      UPDATE "ProductImportBatch"
      SET "status" = COALESCE(${values.status ?? null}, "status"),
          "processedRows" = COALESCE(${values.processedRows ?? null}, "processedRows"),
          "createdRows" = COALESCE(${values.createdRows ?? null}, "createdRows"),
          "errorJson" = COALESCE(${values.errorJson == null ? null : JSON.stringify(values.errorJson)}::jsonb, "errorJson"),
          "updatedAt" = NOW()
      WHERE "id" = ${id}
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

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError('invalid_form', 'Invalid multipart form data', { status: 400 });
  }

  const fileValue = form.get('file');
  if (!(fileValue instanceof File)) return jsonError('file_required', 'CSV file is required', { status: 400 });
  if (fileValue.size <= 0) return jsonError('file_empty', 'CSV file is empty', { status: 400 });
  if (fileValue.size > MAX_FILE_BYTES) return jsonError('file_too_large', 'CSV file is too large (max 20 MB)', { status: 413 });

  const buffer = Buffer.from(await fileValue.arrayBuffer());
  const sourceHash = hashBuffer(buffer);
  const sourceName = fileValue.name.slice(0, 255);
  const sellerId = guard.user.id;
  const importId = batchId(sellerId, sourceHash);

  let rows: ProductImportRow[];
  try {
    rows = parseProductCsv(buffer.toString('utf8'));
  } catch (error) {
    return jsonError('invalid_csv', error instanceof Error ? error.message : 'Invalid CSV', { status: 422 });
  }

  try {
    const existing = await prisma.$queryRaw<Array<{ id: string; status: string; processedRows: number; createdRows: number; totalRows: number }>>(
      Prisma.sql`
        SELECT "id", "status", "processedRows", "createdRows", "totalRows"
        FROM "ProductImportBatch"
        WHERE "sellerId" = ${sellerId} AND "sourceHash" = ${sourceHash}
        LIMIT 1
      `,
    );

    if (existing[0]?.status === 'completed') {
      return jsonOk({
        id: existing[0].id,
        status: existing[0].status,
        totalRows: existing[0].totalRows,
        processedRows: existing[0].processedRows,
        createdRows: existing[0].createdRows,
        resumed: false,
      });
    }

    if (!existing.length) {
      await prisma.$executeRaw(
        Prisma.sql`
          INSERT INTO "ProductImportBatch" ("id", "sellerId", "sourceName", "sourceHash", "status", "totalRows")
          VALUES (${importId}, ${sellerId}, ${sourceName}, ${sourceHash}, 'processing', ${rows.length})
          ON CONFLICT ("sellerId", "sourceHash") DO NOTHING
        `,
      );
    }

    const current = existing[0] ?? {
      id: importId,
      processedRows: 0,
      createdRows: 0,
      totalRows: rows.length,
      status: 'processing',
    };

    await setBatchStatus(current.id, { status: 'processing' });

    let processedRows = current.processedRows;
    let createdRows = current.createdRows;

    while (processedRows < rows.length) {
      const chunk = rows.slice(processedRows, processedRows + WRITE_BATCH_SIZE);
      const inserted = await prisma.$transaction(async (tx) => {
        const result = await tx.product.createMany({
          data: chunk.map((row) => toProductData(row, sellerId)),
          skipDuplicates: true,
        });
        return result.count;
      }, { timeout: 30000, maxWait: 5000 });

      processedRows += chunk.length;
      createdRows += inserted;
      await setBatchStatus(current.id, { processedRows, createdRows, status: processedRows >= rows.length ? 'completed' : 'processing' });
    }

    return jsonOk({
      id: current.id,
      status: 'completed',
      totalRows: rows.length,
      processedRows,
      createdRows,
      skippedRows: processedRows - createdRows,
      resumed: Boolean(existing.length),
    }, { status: 201 });
  } catch (error) {
    try {
      await setBatchStatus(importId, {
        status: 'failed',
        errorJson: { message: error instanceof Error ? error.message : 'Import failed' },
      });
    } catch {
      // Keep original import error as the response source.
    }
    console.error('[seller/products/import] failed', error);
    return jsonError('import_failed', 'Product import failed', { status: 500 });
  }
}
