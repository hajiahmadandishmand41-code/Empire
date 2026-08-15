/**
 * GET /api/sellers/:id/public
 *
 * Public seller profile page data.
 * Uses SellerRepository via registry.
 */
import type { NextRequest } from 'next/server';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';
import { isDatabaseConfigured } from '@/lib/db';
import { getSellerRepository } from '@/server/infrastructure/registry';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return jsonPreflight();
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rl = await rateLimitAsync(clientKey(req, 'sellers:public'), { limit: 120 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429 });

  if (!isDatabaseConfigured()) {
    return jsonError('db_unavailable', 'Database not configured', { status: 503 });
  }

  try {
    const repo = getSellerRepository();
    const profile = await repo.findPublicProfile(id);
    if (!profile) return jsonError('not_found', 'Seller not found', { status: 404 });
    return jsonOk(profile, { meta: { source: 'db' } });
  } catch (err) {
    console.error('[api/sellers/:id/public]', err);
    return jsonError('internal_error', 'Failed to load seller profile', { status: 500 });
  }
}
