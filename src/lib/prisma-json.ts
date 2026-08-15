import { Prisma } from '@prisma/client';

/**
 * Convert unknown runtime data into a value accepted by Prisma JSON fields.
 * Invalid/non-JSON values are rejected instead of being silently coerced.
 */
export function toPrismaJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === null || value === undefined) return Prisma.JsonNull;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    if (typeof value === 'number' && !Number.isFinite(value)) {
      throw new TypeError('Non-finite numbers are not valid JSON');
    }
    return value;
  }
  if (Array.isArray(value)) return value.map(toPrismaJson) as Prisma.InputJsonArray;
  if (typeof value === 'object') {
    const result: Record<string, Prisma.InputJsonValue> = {};
    for (const [key, child] of Object.entries(value)) {
      const normalized = toPrismaJson(child);
      if (normalized !== Prisma.JsonNull) result[key] = normalized;
      else result[key] = Prisma.JsonNull;
    }
    return result;
  }
  throw new TypeError(`Unsupported JSON value of type ${typeof value}`);
}
