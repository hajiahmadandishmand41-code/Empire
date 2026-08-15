/**
 * Domain Error Types
 *
 * Typed errors that flow from service layer → API route handlers.
 * Route handlers translate these to JSON responses using mapErrorToResponse().
 * This prevents business logic from leaking into HTTP layer.
 */

import { jsonError } from '@/lib/api/response';
import type { NextResponse } from 'next/server';
import type { ApiFailure } from '@/types';

/** Base domain error class. */
export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly httpStatus: number = 400,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

/** Resource not found. */
export class NotFoundError extends DomainError {
  constructor(resource: string, id?: string) {
    super(
      'not_found',
      id ? `${resource} با شناسه "${id}" یافت نشد.` : `${resource} یافت نشد.`,
      404,
    );
  }
}

/** Access denied. */
export class ForbiddenError extends DomainError {
  constructor(message = 'شما اجازه دسترسی به این منبع را ندارید.') {
    super('forbidden', message, 403);
  }
}

/** Authentication required. */
export class UnauthorizedError extends DomainError {
  constructor(message = 'برای انجام این عملیات باید وارد شوید.') {
    super('unauthorized', message, 401);
  }
}

/** Conflict (e.g. duplicate slug). */
export class ConflictError extends DomainError {
  constructor(message: string, code = 'conflict') {
    super(code, message, 409);
  }
}

/** Validation failure. */
export class ValidationError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('validation_error', message, 422, details);
  }
}

/** Database unavailable (misconfigured or down). */
export class DatabaseUnavailableError extends DomainError {
  constructor() {
    super('db_unavailable', 'دیتابیس در دسترس نیست. لطفاً بعداً تلاش کنید.', 503);
  }
}

/**
 * Map any error to a JSON NextResponse.
 * Handles DomainError hierarchy cleanly; wraps unknown errors as 500.
 */
export function mapErrorToResponse(err: unknown): NextResponse<ApiFailure> {
  if (err instanceof DomainError) {
    return jsonError(err.code, err.message, {
      status: err.httpStatus,
      details: err.details,
    });
  }

  // Prisma unique constraint violation
  if (
    err &&
    typeof err === 'object' &&
    'code' in err &&
    (err as { code: string }).code === 'P2002'
  ) {
    return jsonError('conflict', 'این مورد قبلاً ثبت شده است.', { status: 409 });
  }

  if (
    err &&
    typeof err === 'object' &&
    'code' in err &&
    (err as { code: string }).code === 'P2025'
  ) {
    return jsonError('not_found', 'منبع موردنظر یافت نشد.', { status: 404 });
  }

  if (
    err &&
    typeof err === 'object' &&
    'code' in err &&
    (err as { code: string }).code === 'P2003'
  ) {
    return jsonError('relation_conflict', 'این مورد هنوز در بخش دیگری استفاده می‌شود.', {
      status: 409,
    });
  }

  // Generic fallback
  return jsonError('internal_error', 'خطای سرور. لطفاً بعداً تلاش کنید.', { status: 500 });
}
