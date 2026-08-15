import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { pushStore } from '@/lib/pwa/push-store';
import { getCurrentUser } from '@/lib/auth/current-user';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';

export const runtime = 'nodejs';

// Phase 10.4 audit — `userId` MUST NOT be trusted from the request body,
// otherwise any anonymous client can hijack push notifications intended
// for another user by subscribing on their behalf. We derive it from the
// authenticated session; anonymous subscriptions are still allowed but
// are stored without a userId binding.
const SubscribeSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(200),
    auth: z.string().min(1).max(100),
  }),
  locale: z.string().max(20).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'push:subscribe'), { limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: { code: 'rate_limited' } },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: 'bad_json', message: 'Invalid JSON body' } },
      { status: 400 },
    );
  }
  const parsed = SubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: 'invalid_body', issues: parsed.error.flatten() } },
      { status: 400 },
    );
  }

  // Bind the subscription to the authenticated user (if any). Never trust
  // a client-supplied userId — see comment on SubscribeSchema.
  const user = await getCurrentUser();
  pushStore.upsert({
    ...parsed.data,
    userId: user?.id ?? null,
    createdAt: Date.now(),
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'push:unsubscribe'), { limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: { code: 'rate_limited' } },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get('endpoint');
  if (!endpoint || endpoint.length > 2048) {
    return NextResponse.json(
      { ok: false, error: { code: 'missing_endpoint' } },
      { status: 400 },
    );
  }
  const removed = pushStore.remove(endpoint);
  return NextResponse.json({ ok: true, removed });
}
