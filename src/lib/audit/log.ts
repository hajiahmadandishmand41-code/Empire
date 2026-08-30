/** Empire Shop — append-only admin audit log. */
import type { NextRequest } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { logger } from '@/lib/logger';
import { toPrismaJson } from '@/lib/prisma-json';

export type AuditAction =
  | 'order.status_change'
  | 'payout.decision'
  | 'user.role_change'
  | 'user.active_change'
  | 'seller.status_change'
  | 'seller.update'
  | 'product.create'
  | 'product.update'
  | 'product.archive'
  | 'product.delete'
  | 'review.moderation';

export interface AuditActor { id: string; role: string; }
export interface AuditEntry {
  actor: AuditActor;
  action: AuditAction;
  entityType: 'order' | 'payout' | 'user' | 'seller' | 'product' | 'review';
  entityId: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
  req?: NextRequest;
}
function extractRequestContext(req?: NextRequest): { ip: string | null; userAgent: string | null } {
  if (!req) return { ip: null, userAgent: null };
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null;
  const userAgent = req.headers.get('user-agent') || null;
  return { ip, userAgent };
}
export async function recordAudit(entry: AuditEntry): Promise<void> {
  if (!isDatabaseConfigured()) return;
  const { ip, userAgent } = extractRequestContext(entry.req);
  try {
    await prisma.adminAuditLog.create({ data: { actorId: entry.actor.id, actorRole: entry.actor.role, action: entry.action, entityType: entry.entityType, entityId: entry.entityId, beforeJson: toPrismaJson(entry.before), afterJson: toPrismaJson(entry.after), metadataJson: toPrismaJson(entry.metadata), ip, userAgent } });
  } catch (err) {
    logger.warn('[audit] failed to record entry', { action: entry.action, entityType: entry.entityType, entityId: entry.entityId, error: err instanceof Error ? err.message : String(err) });
  }
}
export const writeAuditLog = recordAudit;
