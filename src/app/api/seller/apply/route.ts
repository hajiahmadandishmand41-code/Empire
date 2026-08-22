import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/current-user';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';

export const dynamic = 'force-dynamic';

const applicationSchema = z.object({
  shopName: z.string().trim().min(2).max(120),
  ownerName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(30),
  address: z.string().trim().min(5).max(240),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
});

export async function OPTIONS() {
  return jsonPreflight();
}

export async function POST(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'seller:apply'), { limit: 5, windowMs: 60_000 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429 });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  const user = await getCurrentUser();
  if (!user) return jsonError('unauthorized', 'Authentication required', { status: 401 });
  if (user.role === 'seller') return jsonError('already_seller', 'You are already a seller', { status: 409 });
  if (user.sellerStatus === 'approved') return jsonError('seller_approved', 'Seller access is already approved', { status: 409 });

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('invalid_json', 'Request body is not valid JSON', { status: 400 }); }
  const parsed = applicationSchema.safeParse(body);
  if (!parsed.success) return jsonError('invalid_body', 'Please complete all required seller fields', { status: 422, details: { issues: parsed.error.issues } });

  try {
    const existing = await prisma.sellerApplication.findFirst({
      where: { userId: user.id, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) return jsonOk(existing, { status: 200, meta: { source: 'existing-pending' } });

    const created = await prisma.$transaction(async (tx) => {
      const application = await tx.sellerApplication.create({
        data: {
          userId: user.id,
          shopName: parsed.data.shopName,
          ownerName: parsed.data.ownerName,
          phone: parsed.data.phone,
          address: parsed.data.address,
          description: parsed.data.description || null,
          status: 'pending',
        },
      });
      await tx.user.update({ where: { id: user.id }, data: { sellerStatus: 'pending' } });
      return application;
    });

    return jsonOk(created, { status: 201 });
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? (error as { code?: string }).code : undefined;
    if (code === 'P2002') return jsonError('pending_application_exists', 'A seller application is already pending', { status: 409 });
    console.error('[seller/apply]', error);
    return jsonError('application_failed', 'Failed to submit seller application', { status: 500 });
  }
}
