import { jsonOk, jsonError, jsonPreflight } from '@/lib/api/response';
import { getCurrentUser } from '@/lib/auth/current-user';

export async function OPTIONS() {
  return jsonPreflight();
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return jsonError('UNAUTHENTICATED', 'کاربر وارد نشده است', { status: 401 });
  }
  // Include role (Phase 9.3) so the client can render role-aware navigation.
  return jsonOk({ user });
}
