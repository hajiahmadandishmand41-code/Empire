import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';

export const dynamic = 'force-dynamic';

const schema = z.object({ id: z.string().min(1), enabled: z.boolean() });

export async function POST(req: Request) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError('invalid_body', 'Invalid homepage featured payload', { status: 422 });

  try {
    const product = await prisma.product.findUnique({ where: { id: parsed.data.id }, select: { id: true, badge: true } });
    if (!product) return jsonError('not_found', 'Product not found', { status: 404 });

    if (parsed.data.enabled) {
      const count = await prisma.product.count({ where: { badge: 'hero' } });
      if (product.badge !== 'hero' && count >= 2) {
        return jsonError('limit_reached', 'Only two homepage featured products are allowed.', { status: 409 });
      }
      await prisma.product.update({ where: { id: parsed.data.id }, data: { badge: 'hero' } });
    } else if (product.badge === 'hero') {
      await prisma.product.update({ where: { id: parsed.data.id }, data: { badge: null } });
    }

    return jsonOk({ enabled: parsed.data.enabled });
  } catch (error) {
    console.error('[admin/homepage-featured]', error);
    return jsonError('update_failed', 'Failed to update homepage featured state', { status: 500 });
  }
}
