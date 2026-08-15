import { jsonOk, jsonPreflight } from '@/lib/api/response';
import { clearSessionCookie } from '@/lib/auth/session';

export async function OPTIONS() {
  return jsonPreflight();
}

export async function POST() {
  await clearSessionCookie();
  return jsonOk({ success: true });
}
