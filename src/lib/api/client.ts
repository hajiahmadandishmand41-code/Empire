import { apiConfig } from './config';
import { ApiError } from './errors';

/**
 * Thin fetch wrapper — used by the future remote implementation.
 * Endpoint modules short-circuit to the mock adapter when no
 * backend is configured, and never call this function.
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<T> {
  if (!apiConfig.isRemote) {
    throw new ApiError('No backend configured. Set NEXT_PUBLIC_API_BASE_URL.', {
      code: 'no_backend',
    });
  }

  const { timeoutMs = apiConfig.timeoutMs, headers, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${apiConfig.baseUrl}${path}`, {
      ...rest,
      headers: { ...apiConfig.defaultHeaders, ...(headers ?? {}) },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new ApiError(`Request failed with ${res.status}`, {
        code: 'http_error',
        status: res.status,
      });
    }

    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if ((err as Error)?.name === 'AbortError') {
      throw new ApiError('Request timed out', { code: 'timeout' });
    }
    throw new ApiError((err as Error).message ?? 'Network error', {
      code: 'network_error',
    });
  } finally {
    clearTimeout(timer);
  }
}
