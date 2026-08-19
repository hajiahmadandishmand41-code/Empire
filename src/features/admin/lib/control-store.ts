import { prisma, isDatabaseConfigured } from '@/lib/db';
import { randomUUID } from 'crypto';

export type AdminAccessRole = 'super_admin' | 'admin' | 'moderator' | 'support';

export const DEFAULT_PERMISSIONS: Record<AdminAccessRole, string[]> = {
  super_admin: ['*'],
  admin: [
    'dashboard.view','products.view','products.manage','categories.view','categories.manage',
    'orders.view','orders.manage','sellers.view','sellers.manage','users.view','users.manage',
    'banners.manage','homepage.manage','recommendations.manage','reviews.manage','media.manage',
    'analytics.view','search.view','notifications.manage','audit.view'
  ],
  moderator: ['dashboard.view','products.view','products.manage','categories.view','reviews.manage','media.manage','analytics.view','search.view'],
  support: ['dashboard.view','orders.view','orders.manage','users.view','sellers.view','analytics.view'],
};

function assertDb() {
  if (!isDatabaseConfigured()) throw new Error('Database not configured');
}

export async function getAdminAccessRole(userId: string): Promise<{ role: AdminAccessRole; permissions: string[] }> {
  assertDb();
  const rows = await prisma.$queryRawUnsafe<Array<{ accessRole: AdminAccessRole; permissionsJson: unknown }>>(
    'SELECT "accessRole", "permissionsJson" FROM "AdminAccessControl" WHERE "userId" = $1 LIMIT 1', userId,
  );
  const role = rows[0]?.accessRole ?? 'admin';
  const raw = rows[0]?.permissionsJson;
  const permissions = Array.isArray(raw) ? raw.map(String) : DEFAULT_PERMISSIONS[role] ?? [];
  return { role, permissions };
}

export async function upsertAdminAccess(userId: string, role: AdminAccessRole, permissions?: string[]) {
  assertDb();
  const merged = permissions ?? DEFAULT_PERMISSIONS[role];
  await prisma.$executeRawUnsafe(
    `INSERT INTO "AdminAccessControl" ("userId","accessRole","permissionsJson") VALUES ($1,$2,$3::jsonb)
     ON CONFLICT ("userId") DO UPDATE SET "accessRole"=EXCLUDED."accessRole", "permissionsJson"=EXCLUDED."permissionsJson", "updatedAt"=CURRENT_TIMESTAMP`,
    userId, role, JSON.stringify(merged),
  );
}

export async function listHomepageSections() {
  assertDb();
  return prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    'SELECT * FROM "HomepageSection" ORDER BY "sortOrder" ASC, "createdAt" ASC',
  );
}

export async function upsertHomepageSection(input: { id?: string; key: string; title?: string; subtitle?: string; type?: string; configJson?: unknown; sortOrder?: number; isActive?: boolean }) {
  assertDb();
  const id = input.id ?? randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "HomepageSection" ("id","key","title","subtitle","type","configJson","sortOrder","isActive")
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8)
     ON CONFLICT ("key") DO UPDATE SET "title"=EXCLUDED."title", "subtitle"=EXCLUDED."subtitle", "type"=EXCLUDED."type", "configJson"=EXCLUDED."configJson", "sortOrder"=EXCLUDED."sortOrder", "isActive"=EXCLUDED."isActive", "updatedAt"=CURRENT_TIMESTAMP`,
    id, input.key, input.title ?? null, input.subtitle ?? null, input.type ?? 'products', JSON.stringify(input.configJson ?? {}), input.sortOrder ?? 0, input.isActive ?? true,
  );
  return id;
}

export async function deleteHomepageSection(id: string) {
  assertDb();
  await prisma.$executeRawUnsafe('DELETE FROM "HomepageSection" WHERE "id" = $1', id);
}

export async function listMediaAssets(options: { q?: string; kind?: string; page?: number; pageSize?: number } = {}) {
  assertDb();
  const page = Math.max(1, options.page ?? 1); const pageSize = Math.min(100, Math.max(10, options.pageSize ?? 30));
  const q = options.q?.trim() ?? '';
  const like = `%${q}%`;
  const whereKind = options.kind ? 'AND "kind" = $3' : '';
  const args: unknown[] = [like, pageSize, (page - 1) * pageSize];
  if (options.kind) args.push(options.kind);
  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `SELECT * FROM "MediaAsset" WHERE ("fileName" ILIKE $1 OR "url" ILIKE $1 OR COALESCE("altText",'') ILIKE $1) ${whereKind}
     ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3`, ...args,
  );
  const countRows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT COUNT(*)::bigint AS count FROM "MediaAsset" WHERE ("fileName" ILIKE $1 OR "url" ILIKE $1 OR COALESCE("altText",'') ILIKE $1) ${whereKind}`,
    ...([like, ...(options.kind ? [undefined, options.kind] : [])] as unknown[]),
  ).catch(() => [{ count: BigInt(rows.length) }]);
  return { rows, total: Number(countRows[0]?.count ?? rows.length), page, pageSize };
}

export async function createMediaAsset(input: { url: string; kind: string; mimeType?: string; fileName?: string; sizeBytes?: number; width?: number; height?: number; altText?: string; folder?: string; createdById?: string }) {
  assertDb();
  const id = randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "MediaAsset" ("id","url","kind","mimeType","fileName","sizeBytes","width","height","altText","folder","createdById") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    id, input.url, input.kind, input.mimeType ?? null, input.fileName ?? null, input.sizeBytes ?? null, input.width ?? null, input.height ?? null, input.altText ?? null, input.folder ?? null, input.createdById ?? null,
  );
  return id;
}

export async function deleteMediaAsset(id: string) {
  assertDb();
  await prisma.$executeRawUnsafe('DELETE FROM "MediaAsset" WHERE "id"=$1', id);
}

export async function listSearchStats(q?: string) {
  assertDb();
  const like = `%${q?.trim() ?? ''}%`;
  return prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    'SELECT * FROM "SearchQueryStat" WHERE "query" ILIKE $1 ORDER BY "searchCount" DESC, "lastSearchedAt" DESC LIMIT 100', like,
  );
}
