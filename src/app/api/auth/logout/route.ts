import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { clearSessionCookie, readSessionUserId } from '@/lib/auth/session';
import { prisma, isDatabaseConfigured } from '@/lib/db';

export async function OPTIONS() {
  return jsonPreflight();
}

export async function POST() {
  const userId = await readSessionUserId();

  if (userId && isDatabaseConfigured()) {
    try {
      // Touch updatedAt so every previously issued signed token becomes stale.
      // This intentionally revokes all sessions for the account, which is the
      // safest behavior when the server cannot identify one browser token in
      // a shared session store.
      await prisma.user.update({ where: { id: userId }, data: { updatedAt: new Date() } });
    } catch (error) {
      console.error('[auth/logout]', error);
      return jsonError('logout_failed', 'Unable to revoke the session', { status: 503 });
    }
  }

  await clearSessionCookie();
  return jsonOk({ success: true });
}
