import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';

export const dynamic = 'force-dynamic';

const schema = z.record(z.string(), z.number().min(0).max(100));

const defaultWeights = {
  relevance: 4,
  categoryMatch: 3,
  recentBehavior: 4,
  personalization: 3,
  similarity: 2,
  salesCount: 4,
  viewCount: 1.5,
  wishlistCount: 2,
  reviewRating: 1.5,
  reviewCount: 0.8,
  recency: 1,
  discounted: 0.5,
  inStock: 10,
};

export async function GET() {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonOk({ key: 'default', weights: defaultWeights, source: 'default' });
  const rows = await prisma.$queryRawUnsafe<Array<{ weightsJson: unknown; enabled: boolean }>>(
    `SELECT "weightsJson", "enabled" FROM "RecommendationConfig" WHERE "key" = 'default' LIMIT 1`,
  );
  if (!rows[0]) return jsonOk({ key: 'default', weights: defaultWeights, enabled: true, source: 'default' });
  return jsonOk({ key: 'default', weights: { ...defaultWeights, ...(rows[0].weightsJson as Record<string, number>) }, enabled: rows[0].enabled, source: 'db' });
}

export async function PUT(req: Request) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('invalid_json', 'Invalid JSON', { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError('invalid_body', 'Weights must be a JSON object of non-negative numbers', { status: 422 });
  const weights = { ...defaultWeights, ...parsed.data };
  await prisma.$executeRawUnsafe(
    `INSERT INTO "RecommendationConfig" ("id","key","weightsJson","enabled","updatedAt") VALUES ($1,'default',$2::jsonb,true,NOW())
     ON CONFLICT ("key") DO UPDATE SET "weightsJson"=$2::jsonb,"enabled"=true,"updatedAt"=NOW()`,
    randomUUID(),
    JSON.stringify(weights),
  );
  return jsonOk({ key: 'default', weights, enabled: true, source: 'db' });
}
