import { Prisma } from '@prisma/client';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk } from '@/lib/api/response';
import { requireSellerApi } from '@/lib/auth/require-seller-api';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return jsonError('id_required', 'Import id is required', { status: 400 });

  const rows = await prisma.$queryRaw<Array<{
    id: string;
    status: string;
    totalRows: number;
    processedRows: number;
    createdRows: number;
    failedRows: number;
    errorJson: unknown;
    updatedAt: Date;
  }>>(
    Prisma.sql`
      SELECT "id", "status", "totalRows", "processedRows", "createdRows", "failedRows", "errorJson", "updatedAt"
      FROM "ProductImportBatch"
      WHERE "id" = ${id} AND "sellerId" = ${guard.user.id}
      LIMIT 1
    `,
  );

  if (!rows[0]) return jsonError('not_found', 'Import batch not found', { status: 404 });
  return jsonOk(rows[0]);
}
