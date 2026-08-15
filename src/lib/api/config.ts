/**
 * API configuration — Phase 6.
 *
 * Reads the future backend base URL from `NEXT_PUBLIC_API_BASE_URL`.
 * When empty the API layer falls back to the in-memory mock adapter,
 * so the whole app keeps working with zero configuration.
 */
export const apiConfig = {
  baseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, ''),
  get isRemote(): boolean {
    return this.baseUrl.length > 0;
  },
  defaultHeaders: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  } as Record<string, string>,
  timeoutMs: 15_000,
} as const;

export type ApiConfig = typeof apiConfig;
