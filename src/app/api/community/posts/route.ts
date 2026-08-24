import type { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { isDatabaseConfigured, prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';

export const dynamic = 'force-dynamic';

const MAX_CONTENT = 1200;

type PostRow = { id: string; content: string; createdAt: Date; fullName: string; likes: bigint; liked: boolean };
type ReplyRow = PostRow & { parentId: string };

export async function OPTIONS(req: NextRequest) { return jsonPreflight(req); }

export async function GET(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'community:list'), { limit: 120 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429, req });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503, req });
  const user = await getCurrentUser();
  const likedExpression = user ? Prisma.sql`EXISTS(SELECT 1 FROM "CommunityPostLike" ml WHERE ml."postId" = p."id" AND ml."userId" = ${user.id})` : Prisma.sql`false`;

  try {
    const posts = await prisma.$queryRaw<PostRow[]>`
      SELECT p."id", p."content", p."createdAt", u."fullName", COUNT(l."id")::bigint AS "likes", ${likedExpression} AS "liked"
      FROM "CommunityPost" p
      JOIN "User" u ON u."id" = p."userId"
      LEFT JOIN "CommunityPostLike" l ON l."postId" = p."id"
      WHERE p."parentId" IS NULL
      GROUP BY p."id", u."fullName"
      ORDER BY p."createdAt" DESC
      LIMIT 60
    `;

    const ids = posts.map((post) => post.id);
    const replyLikedExpression = user ? Prisma.sql`EXISTS(SELECT 1 FROM "CommunityPostLike" ml WHERE ml."postId" = p."id" AND ml."userId" = ${user.id})` : Prisma.sql`false`;
    const replies = ids.length ? await prisma.$queryRaw<ReplyRow[]>`
      SELECT p."id", p."parentId", p."content", p."createdAt", u."fullName", COUNT(l."id")::bigint AS "likes", ${replyLikedExpression} AS "liked"
      FROM "CommunityPost" p
      JOIN "User" u ON u."id" = p."userId"
      LEFT JOIN "CommunityPostLike" l ON l."postId" = p."id"
      WHERE p."parentId" IN (${Prisma.join(ids)})
      GROUP BY p."id", u."fullName"
      ORDER BY p."createdAt" ASC
    ` : [];

    const replyMap = new Map<string, ReplyRow[]>();
    for (const reply of replies) replyMap.set(reply.parentId, [...(replyMap.get(reply.parentId) ?? []), reply]);

    return jsonOk({ posts: posts.map((post) => ({
      id: post.id, content: post.content, author: post.fullName, createdAt: post.createdAt.toISOString(), likes: Number(post.likes), liked: Boolean(post.liked),
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
      const existing = await prisma.$queryRaw<{ id: string }[]>`SELECT "id" FROM "CommunityPostLike" WHERE "userId" = ${user.id} AND "postId" = ${input.postId} LIMIT 1`;
      if (existing.length) {
        await prisma.$executeRaw`DELETE FROM "CommunityPostLike" WHERE "id" = ${existing[0].id}`;
        return jsonOk({ liked: false }, { req });
      }
      const post = await prisma.$queryRaw<{ id: string }[]>`SELECT "id" FROM "CommunityPost" WHERE "id" = ${input.postId} LIMIT 1`;
      if (!post.length) return jsonError('not_found', 'Post not found', { status: 404, req });
      await prisma.$executeRaw`INSERT INTO "CommunityPostLike" ("id", "userId", "postId", "createdAt") VALUES (${crypto.randomUUID()}, ${user.id}, ${input.postId}, NOW())`;
      return jsonOk({ liked: true }, { req });
    }

    if (input.action !== 'create' && input.action !== 'reply') return jsonError('invalid_action', 'Invalid community action', { status: 400, req });
    if (typeof input.content !== 'string') return jsonError('invalid_content', 'Message is required', { status: 400, req });
    const content = input.content.trim();
    if (content.length < 1 || content.length > MAX_CONTENT) return jsonError('invalid_content', `Message must be 1-${MAX_CONTENT} characters.`, { status: 400, req });

    let parentId: string | null = null;
    if (input.action === 'reply') {
      if (typeof input.postId !== 'string' || !input.postId) return jsonError('invalid_post', 'Post id is required for replies', { status: 400, req });
      const parent = await prisma.$queryRaw<{ id: string }[]>`SELECT "id" FROM "CommunityPost" WHERE "id" = ${input.postId} LIMIT 1`;
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
