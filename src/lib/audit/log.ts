/**
 * Empire Shop — Phase 10.3: Admin audit log.
 *
 * Append-only trail of sensitive admin actions. Callers are the
 * admin/seller API routes that mutate financial or trust-sensitive
 * state: order status, payout decisions, user role / seller-status,
 * etc. Failures NEVER block the underlying admin action — audit
 * logging is best-effort by design (we'd rather complete a legitimate
 * admin operation than fail it because logging hiccuped).
 */
import type { NextRequest } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { logger } from '@/lib/logger';

export type AuditAction =
  | 'order.status_change'
  | 'payout.decision'
  | 'user.role_change'
  | 'user.active_change'
  | 'seller.status_change';

export interface AuditActor {
  id: string;
  role: string;
}

export interface AuditEntry {
  actor: AuditActor;
  action: AuditAction;
  entityType: 'order' | 'payout' | 'user' | 'seller';
  entityId: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
  req?: NextRequest;
}

function safeJson(value: unknown): Record<string, unknown> | unknown[] | null {
  if (value === undefined || value === null) return null;
  try {
    if (typeof value !== 'object') return { value };
    return value as Record<string, unknown> | unknown[];
  } catch {
    return null;
  }
}

function extractRequestContext(req?: NextRequest): { ip: string | null; userAgent: string | null } {
  if (!req) return { ip: null, userAgent: null };
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    null;
  const userAgent = req.headers.get('user-agent') || null;
  return { ip, userAgent };
}

export async function recordAudit(entry: AuditEntry): Promise<void> {
  if (!isDatabaseConfigured()) return;
  const { ip, userAgent } = extractRequestContext(entry.req);
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId: entry.actor.id,
        actorRole: entry.actor.role,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        beforeJson: safeJson(entry.before),
        afterJson: safeJson(entry.after),
        metadataJson: safeJson(entry.metadata),
        ip,
        userAgent,
      },
    });
  } catch (err) {
    // Never let audit failure break the admin operation.
    logger.warn('[audit] failed to record entry', {
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/** Alias used by some admin routes. Identical to `recordAudit`. */
export const writeAuditLog = recordAudit;
