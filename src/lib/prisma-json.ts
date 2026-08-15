import { Prisma } from '@prisma/client';

/**
 * Convert unknown runtime data into a value accepted by Prisma JSON fields.
 * Invalid/non-JSON values are rejected instead of being silently coerced.
 *
 * Prisma exposes `Prisma.JsonNull` for a top-level JSON null. Nested JSON
 * values are normalized through JSON serialization so ordinary nested `null`
 * values remain JSON nulls rather than becoming Prisma sentinel objects.
 */
export function toPrismaJson(
  value: unknown,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === null || value === undefined) return Prisma.JsonNull;

  assertJsonCompatible(value);
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function assertJsonCompatible(value: unknown): void {
  if (value === null) return;
  if (typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError('Non-finite numbers are not valid JSON');
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) assertJsonCompatible(item);
    return;
  }
  if (typeof value === 'object') {
    for (const child of Object.values(value)) assertJsonCompatible(child);
    return;
  }
  throw new TypeError(`Unsupported JSON value of type ${typeof value}`);
}
