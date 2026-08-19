import { Prisma } from '@prisma/client';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';

export const dynamic = 'force-dynamic';

/**
 * Demo products are marked with tagsJson=["demo"]. Products already referenced
 * by an order cannot be deleted safely, so those rows are deactivated instead.
 */
export async function DELETE() {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const demoRows = await tx.product.findMany({
        where: { tagsJson: { array_contains: 'demo' } },
        select: { id: true },
      });
      if (demoRows.length === 0) return { deleted: 0, deactivated: 0 };

      const demoIds = demoRows.map((row) => row.id);
      const referenced = await tx.orderItem.findMany({ where: { productId: { in: demoIds } }, distinct: ['productId'], select: { productId: true } });
      const referencedIds = new Set(referenced.map((row) => row.productId));
      const deletableIds = demoIds.filter((id) => !referencedIds.has(id));

      const deactivated = await tx.product.updateMany({ where: { id: { in: [...referencedIds] } }, data: { isActive: false } });
      let deleted = 0;
      if (deletableIds.length > 0) {
        const deletedResult = await tx.product.deleteMany({ where: { id: { in: deletableIds } } });
        deleted = deletedResult.count;
      }
      return { deleted, deactivated: deactivated.count };
    });

    return jsonOk(result);
  } catch (error) {
    console.error('[admin/products/demo.DELETE]', error);
    return jsonError('cleanup_failed', 'Unable to clean demo products', { status: 500 });
  }
}
