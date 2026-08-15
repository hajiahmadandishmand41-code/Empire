/** Public liveness endpoint. Never exposes DB, version, env or migration state. */
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    { ok: true },
    { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
