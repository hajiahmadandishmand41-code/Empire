export interface ApiErrorOptions {
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

export class ApiError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly details?: Record<string, unknown>;

  constructor(message: string, options: ApiErrorOptions = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = options.code ?? 'api_error';
    this.status = options.status;
    this.details = options.details;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}