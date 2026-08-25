import type { NextRequest } from 'next/server';
import crypto from 'node:crypto';
import { Prisma } from '@prisma/client';
import { isDatabaseConfigured, prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';

export const dynamic = 'force-dynamic';
const MAX_CONTENT = 1200;
const FEED_LIMIT = 60;
const DIVERSITY_MAX_PER_AUTHOR = 3;
const CANDIDATE_LIMIT = FEED_LIMIT * DIVERSITY_MAX_PER_AUTHOR;
type PostRow = { id: string; userId: string; content: string; createdAt: Date; fullName: string; likes: bigint; replyCount: bigint; score: number; liked: boolean };
type ReplyRow = PostRow & { parentId: string };
type FeedSort = 'hot' | 'new' | 'recommended';
type Cursor = { s: number; c: string; i: string };
function parseFeedSort(value: string | null): FeedSort { return value === 'new' || value === 'recommended' ? value : 'hot'; }
function parsePositiveInt(value: string | null, fallback: number, max: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
}
function encodeCursor(post: Pick<PostRow, 'score' | 'createdAt' | 'id'>): string {
  return Buffer.from(JSON.stringify({ s: post.score, c: post.createdAt.toISOString(), i: post.id })).toString('base64url');
}
function parseCursor(value: string | null): Cursor | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Partial<Cursor>;
    if (typeof parsed.s !== 'number' || !Number.isFinite(parsed.s) || typeof parsed.c !== 'string' || typeof parsed.i !== 'string') return null;
    const date = new Date(parsed.c);
    if (Number.isNaN(date.getTime())) return null;
    return { s: parsed.s, c: date.toISOString(), i: parsed.i };
  } catch { return null; }
}

export async function OPTIONS(req: NextRequest) { return jsonPreflight(req); }

export async function GET(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'community:list'), { limit: 120 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429, req });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503, req });
  const user = await getCurrentUser();
  const sort = parseFeedSort(req.nextUrl.searchParams.get('sort'));
  const page = parsePositiveInt(req.nextUrl.searchParams.get('page'), 1, 100);
  const cursor = parseCursor(req.nextUrl.searchParams.get('cursor'));
  const likedExpression = user ? Prisma.sql`EXISTS(SELECT 1 FROM "CommunityPostLike" ml WHERE ml."postId" = p."id" AND ml."userId" = ${user.id})` : Prisma.sql`false`;
  const affinityExpression = user ? Prisma.sql`CASE WHEN EXISTS (
      SELECT 1
      FROM "CommunityPostLike" ul
      JOIN "CommunityPost" up ON up."id" = ul."postId"
      WHERE ul."userId" = ${user.id} AND up."userId" = p."userId" AND up."id" <> p."id"
    ) THEN 1 ELSE 0 END` : Prisma.sql`0`;

  const scoreExpression = sort === 'new'
    ? Prisma.sql`EXTRACT(EPOCH FROM p."createdAt")`
    : sort === 'recommended'
      ? Prisma.sql`(
          ((${affinityExpression}) * 12.0) +
          (LN(1 + COUNT(DISTINCT l."id")) * 2.5) +
          (LN(1 + COUNT(DISTINCT r."id")) * 3.0) +
          (EXP(-GREATEST(0, EXTRACT(EPOCH FROM (NOW() - p."createdAt"))) / 345600.0) * 12.0) +
          (LEAST(LENGTH(p."content"), 600)::double precision / 600.0 * 2.0)
        )`
      : Prisma.sql`(
          (LN(1 + COUNT(DISTINCT l."id")) * 3.0) +
          (LN(1 + COUNT(DISTINCT r."id")) * 4.0) +
          (EXP(-GREATEST(0, EXTRACT(EPOCH FROM (NOW() - p."createdAt"))) / 259200.0) * 18.0) +
          (LEAST(LENGTH(p."content"), 600)::double precision / 600.0 * 2.0)
        )`;
  const cursorPredicate = cursor
    ? Prisma.sql`WHERE ("score" < ${cursor.s} OR ("score" = ${cursor.s} AND "createdAt" < ${new Date(cursor.c)}) OR ("score" = ${cursor.s} AND "createdAt" = ${new Date(cursor.c)} AND "id" > ${cursor.i}))`
    : Prisma.sql``;
  const offset = cursor ? 0 : (page - 1) * FEED_LIMIT;

  try {
    const ranked = await prisma.$queryRaw<PostRow[]>`
      WITH ranked AS (
        SELECT p."id", p."userId", p."content", p."createdAt", u."fullName",
               COUNT(DISTINCT l."id")::bigint AS "likes",
               COUNT(DISTINCT r."id")::bigint AS "replyCount",
               ${scoreExpression}::double precision AS "score",
               ${likedExpression} AS "liked"
        FROM "CommunityPost" p
        JOIN "User" u ON u."id" = p."userId"
        LEFT JOIN "CommunityPostLike" l ON l."postId" = p."id"
        LEFT JOIN "CommunityPost" r ON r."parentId" = p."id"
        WHERE p."parentId" IS NULL
          AND p."isDeleted" = FALSE
          AND p."isHidden" = FALSE
          AND p."isSpam" = FALSE
          AND u."isActive" = TRUE
        GROUP BY p."id", p."userId", u."fullName"
      )
      SELECT * FROM ranked
      ${cursorPredicate}
      ORDER BY "score" DESC, "createdAt" DESC, "id" ASC
      LIMIT ${CANDIDATE_LIMIT + 1}
      OFFSET ${offset}
    `;

    const selected: PostRow[] = [];
    const authorCounts = new Map<string, number>();
    for (const post of ranked) {
      if ((authorCounts.get(post.userId) ?? 0) >= DIVERSITY_MAX_PER_AUTHOR) continue;
      authorCounts.set(post.userId, (authorCounts.get(post.userId) ?? 0) + 1);
      selected.push(post);
      if (selected.length >= FEED_LIMIT) break;
    }

    const ids = selected.map((post) => post.id);
    const replyLikedExpression = user ? Prisma.sql`EXISTS(SELECT 1 FROM "CommunityPostLike" ml WHERE ml."postId" = p."id" AND ml."userId" = ${user.id})` : Prisma.sql`false`;
    const replies = ids.length ? await prisma.$queryRaw<ReplyRow[]>`
      SELECT p."id", p."userId", p."parentId", p."content", p."createdAt", u."fullName",
             COUNT(l."id")::bigint AS "likes", 0::bigint AS "replyCount", 0::double precision AS "score",
             ${replyLikedExpression} AS "liked"
      FROM "CommunityPost" p
      JOIN "User" u ON u."id" = p."userId"
      LEFT JOIN "CommunityPostLike" l ON l."postId" = p."id"
      WHERE p."parentId" IN (${Prisma.join(ids)})
        AND p."isDeleted" = FALSE AND p."isHidden" = FALSE AND p."isSpam" = FALSE AND u."isActive" = TRUE
      GROUP BY p."id", p."userId", p."parentId", u."fullName"
      ORDER BY p."createdAt" ASC, p."id" ASC
    ` : [];
    const replyMap = new Map<string, ReplyRow[]>();
    for (const reply of replies) replyMap.set(reply.parentId, [...(replyMap.get(reply.parentId) ?? []), reply]);

    const nextCursor = selected.length === FEED_LIMIT ? encodeCursor(selected[selected.length - 1]) : null;
    return jsonOk({ sort, page, cursor: nextCursor, posts: selected.map((post) => ({
      id: post.id, content: post.content, author: post.fullName, createdAt: post.createdAt.toISOString(),
      likes: Number(post.likes), comments: Number(post.replyCount), score: Number(post.score), liked: Boolean(post.liked),
      replies: (replyMap.get(post.id) ?? []).map((reply) => ({ id: reply.id, content: reply.content, author: reply.fullName, createdAt: reply.createdAt.toISOString(), likes: Number(reply.likes), liked: Boolean(reply.liked) })),
    })) }, { req });
  } catch (error) {
    console.error('[api/community/posts GET]', error);
    return jsonError('internal_error', 'Failed to load community posts', { status: 500, req });
  }
}

export async function POST(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'community:write'), { limit: 30 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429, req });
  const user = await getCurrentUser();
  if (!user) return jsonError('unauthorized', 'برای نوشتن پیام ابتدا وارد حساب خود شوید.', { status: 401, req });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503, req });
  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('invalid_body', 'Invalid JSON body', { status: 400, req }); }
  if (!body || typeof body !== 'object') return jsonError('invalid_body', 'Invalid payload', { status: 400, req });
  const input = body as { action?: string; content?: unknown; postId?: unknown };
  try {
    if (input.action === 'like') {
      if (typeof input.postId !== 'string' || !input.postId) return jsonError('invalid_post', 'Invalid post id', { status: 400, req });
      const post = await prisma.$queryRaw<{ id: string }[]>`SELECT "id" FROM "CommunityPost" WHERE "id" = ${input.postId} AND "isDeleted" = FALSE AND "isHidden" = FALSE AND "isSpam" = FALSE LIMIT 1`;
      if (!post.length) return jsonError('not_found', 'Post not found', { status: 404, req });

      const inserted = await prisma.$queryRaw<{ id: string }[]>`
        INSERT INTO "CommunityPostLike" ("id", "userId", "postId", "createdAt")
        VALUES (${crypto.randomUUID()}, ${user.id}, ${input.postId}, NOW())
        ON CONFLICT ("userId", "postId") DO NOTHING
        RETURNING "id"
      `;
      if (inserted.length) return jsonOk({ liked: true }, { req });

      await prisma.$executeRaw`DELETE FROM "CommunityPostLike" WHERE "userId" = ${user.id} AND "postId" = ${input.postId}`;
      return jsonOk({ liked: false }, { req });
    }
    if (input.action !== 'create' && input.action !== 'reply') return jsonError('invalid_action', 'Invalid community action', { status: 400, req });
    if (typeof input.content !== 'string') return jsonError('invalid_content', 'Message is required', { status: 400, req });
    const content = input.content.trim();
    if (content.length < 1 || content.length > MAX_CONTENT) return jsonError('invalid_content', `Message must be 1-${MAX_CONTENT} characters.`, { status: 400, req });
    let parentId: string | null = null;
    if (input.action === 'reply') {
      if (typeof input.postId !== 'string' || !input.postId) return jsonError('invalid_post', 'Post id is required for replies', { status: 400, req });
      const parent = await prisma.$queryRaw<{ id: string }[]>`SELECT "id" FROM "CommunityPost" WHERE "id" = ${input.postId} AND "parentId" IS NULL AND "isDeleted" = FALSE AND "isHidden" = FALSE AND "isSpam" = FALSE LIMIT 1`;
      if (!parent.length) return jsonError('not_found', 'Post not found', { status: 404, req });
      parentId = input.postId;
    }
    const id = crypto.randomUUID();
    await prisma.$executeRaw`INSERT INTO "CommunityPost" ("id", "userId", "parentId", "content", "createdAt", "updatedAt") VALUES (${id}, ${user.id}, ${parentId}, ${content}, NOW(), NOW())`;
    return jsonOk({ id }, { status: 201, req });
  } catch (error) {
    console.error('[api/community/posts POST]', error);
    return jsonError('internal_error', 'Community action failed', { status: 500, req });
  }
}
