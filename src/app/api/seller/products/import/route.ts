import { createHash } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireSellerApi } from '@/lib/auth/require-seller-api';
import { parseProductCsv } from '@/lib/csv/product-import';

export const dynamic = 'force-dynamic';

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const ROW_INSERT_CHUNK = 500;

function hashBuffer(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

function batchId(sellerId: string, sourceHash: string): string {
  return `imp_${createHash('sha256').update(`${sellerId}:${sourceHash}`).digest('hex').slice(0, 32)}`;
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

  let rows: ReturnType<typeof parseProductCsv>;
  try {
    rows = parseProductCsv(buffer.toString('utf8'));
  } catch (error) {
    return jsonError('invalid_csv', error instanceof Error ? error.message : 'Invalid CSV', { status: 422 });
  }

  try {
    const current = await prisma.$transaction(async (tx) => {
      const existing = await tx.$queryRaw<Array<{ id: string; status: string; processedRows: number; createdRows: number; totalRows: number }>>(
        Prisma.sql`
          SELECT "id", "status", "processedRows", "createdRows", "totalRows"
          FROM "ProductImportBatch"
          WHERE "sellerId" = ${sellerId} AND "sourceHash" = ${sourceHash}
          LIMIT 1
        `,
      );

      if (existing[0]) return existing[0];

      await tx.$executeRaw(
        Prisma.sql`
          INSERT INTO "ProductImportBatch" ("id", "sellerId", "sourceName", "sourceHash", "status", "totalRows")
          VALUES (${importId}, ${sellerId}, ${sourceName}, ${sourceHash}, 'queued', ${rows.length})
          ON CONFLICT ("sellerId", "sourceHash") DO NOTHING
        `,
      );

      const created = await tx.$queryRaw<Array<{ id: string; status: string; processedRows: number; createdRows: number; totalRows: number }>>(
        Prisma.sql`
          SELECT "id", "status", "processedRows", "createdRows", "totalRows"
          FROM "ProductImportBatch"
          WHERE "sellerId" = ${sellerId} AND "sourceHash" = ${sourceHash}
          LIMIT 1
        `,
      );
      return created[0];
    }, { timeout: 15000, maxWait: 5000 });

    if (current.status === 'completed') {
      return jsonOk({ ...current, resumed: false });
    }

    if (current.processedRows === 0) {
      for (let start = 0; start < rows.length; start += ROW_INSERT_CHUNK) {
        const chunk = rows.slice(start, start + ROW_INSERT_CHUNK);
        await prisma.$transaction(async (tx) => {
          await tx.$executeRaw(
            Prisma.sql`
              INSERT INTO "ProductImportRow" ("id", "batchId", "rowIndex", "payloadJson", "status")
              SELECT * FROM jsonb_to_recordset(${JSON.stringify(chunk.map((row, index) => ({
                id: `${current.id}_${start + index}`,
                batchId: current.id,
                rowIndex: start + index,
                payloadJson: row,
                status: 'pending',
              }))}::jsonb) AS x("id" text, "batchId" text, "rowIndex" int, "payloadJson" jsonb, "status" text)
              ON CONFLICT ("batchId", "rowIndex") DO NOTHING
            `,
          );
        }, { timeout: 15000, maxWait: 5000 });
      }
    }

    await prisma.$executeRaw(
      Prisma.sql`UPDATE "ProductImportBatch" SET "status" = 'processing', "updatedAt" = NOW() WHERE "id" = ${current.id} AND "status" = 'queued'`,
    );

    return jsonOk({
      id: current.id,
      status: 'processing',
      totalRows: rows.length,
      processedRows: current.processedRows,
      createdRows: current.createdRows,
      resumed: current.processedRows > 0,
    }, { status: 202 });
  } catch (error) {
    try {
      await prisma.$executeRaw(
        Prisma.sql`
          UPDATE "ProductImportBatch"
          SET "status" = 'failed',
              "errorJson" = ${JSON.stringify({ message: error instanceof Error ? error.message : 'Import failed' })}::jsonb,
              "updatedAt" = NOW()
          WHERE "id" = ${importId}
        `,
      );
    } catch {
      // Preserve the original failure response.
    }
    console.error('[seller/products/import] queue failed', error);
    return jsonError('import_failed', 'Product import could not be queued', { status: 500 });
  }
}
