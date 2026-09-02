import { Prisma } from '@prisma/client';

/**
 * Normalize arbitrary runtime data into a value accepted by Prisma JSON fields.
 * Audit/event payloads may contain framework objects or callbacks; those values
 * are omitted instead of making an otherwise valid database operation fail.
 */
export function toPrismaJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === null || value === undefined) return Prisma.JsonNull;
  const normalized = sanitizeJson(value);
  if (normalized === undefined) return Prisma.JsonNull;
  return normalized as Prisma.InputJsonValue;
}

function sanitizeJson(value: unknown): unknown {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'function' || typeof value === 'symbol' || typeof value === 'undefined') return undefined;
  if (Array.isArray(value)) return value.map((item) => sanitizeJson(item)).filter((item) => item !== undefined);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      const normalized = sanitizeJson(child);
      if (normalized !== undefined) out[key] = normalized;
    }
    return out;
  }
  return undefined;
}
