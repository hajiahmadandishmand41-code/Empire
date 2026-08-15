/**
 * Standard JSON response helpers for API routes.
 * Wraps every payload in the `ApiSuccess` / `ApiFailure` envelope
 * declared in `src/types/api.ts`.
 */
import { NextResponse } from 'next/server';
import type { ApiFailure, ApiSuccess } from '@/types';
import { corsHeaders } from './cors';

export function jsonOk<T>(
  data: T,
  init: { status?: number; meta?: Record<string, unknown>; req?: Request } = {},
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json<ApiSuccess<T>>(
    { ok: true, data, ...(init.meta ? { meta: init.meta } : {}) },
    { status: init.status ?? 200, headers: corsHeaders(init.req) },
  );
}

export function jsonError(
  code: string,
  message: string,
  init: { status?: number; details?: Record<string, unknown>; req?: Request } = {},
): NextResponse<ApiFailure> {
  return NextResponse.json<ApiFailure>(
    {
      ok: false,
      error: { code, message, ...(init.details ? { details: init.details } : {}) },
    },
    { status: init.status ?? 400, headers: corsHeaders(init.req) },
  );
}

export function jsonPreflight(req?: Request): NextResponse {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

// Shorthand aliases used by Phase-12 auth routes.
// ok(data)              → JSON 200 with { ok: true, data }
// err(code, msg, status) → JSON error envelope
export function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return jsonOk(data, { status });
}

export function err(
  code: string,
  message: string,
  status = 400,
): NextResponse<ApiFailure> {
  return jsonError(code, message, { status });
}
