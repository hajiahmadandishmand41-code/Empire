/**
 * In-memory push-subscription store (Phase 9 stub).
 *
 * For production, persist subscriptions in Prisma (add a
 * `PushSubscription` model) and use the `web-push` package on Node
 * runtime to deliver notifications with VAPID keys.
 *
 * This module deliberately avoids a runtime dependency so Phase 9 can
 * ship without changing the DB schema. Replace with a Prisma-backed
 * implementation when scale requires it.
 */

export interface StoredSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userId?: string | null;
  locale?: string | null;
  createdAt: number;
}

// Module-scope Map survives the lifetime of the Node process/edge instance.
// Not shared across instances — sufficient for stub delivery.
const store = new Map<string, StoredSubscription>();

export const pushStore = {
  upsert(sub: StoredSubscription) {
    store.set(sub.endpoint, sub);
    return sub;
  },
  remove(endpoint: string) {
    return store.delete(endpoint);
  },
  list(): StoredSubscription[] {
    return [...store.values()];
  },
  size(): number {
    return store.size;
  },
};

export function getVapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || null;
}
