import { NextResponse } from 'next/server';
import { getVapidPublicKey } from '@/lib/pwa/push-store';

export const runtime = 'nodejs';

export async function GET() {
  const key = getVapidPublicKey();
  if (!key) {
    return NextResponse.json(
      { ok: false, error: { code: 'not_configured' } },
      { status: 503 },
    );
  }
  return NextResponse.json({ ok: true, publicKey: key });
}
