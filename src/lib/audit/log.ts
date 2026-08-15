import type { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { logger } from '@/lib/logger';

export type AuditAction = 'order.status_change' | 'payout.decision' | 'user.role_change' | 'user.active_change' | 'seller.status_change';
export interface AuditActor { id: string; role: string; }
export interface AuditEntry { actor: AuditActor; action: AuditAction; entityType: 'order' | 'payout' | 'user' | 'seller'; entityId: string; before?: unknown; after?: unknown; metadata?: Record<string, unknown>; req?: NextRequest; }

function safeJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === undefined || value === null) return Prisma.JsonNull;
  if (typeof value !== 'object') return { value: value as string | number | boolean };
  try { return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue; } catch { return Prisma.JsonNull; }
}
function extractRequestContext(req?: NextRequest): { ip: string | null; userAgent: string | null } {
  if (!req) return { ip: null, userAgent: null };
  return { ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null, userAgent: req.headers.get('user-agent') || null };
}
export async function recordAudit(entry: AuditEntry): Promise<void> {
  if (!isDatabaseConfigured()) return;
  const { ip, userAgent } = extractRequestContext(entry.req);
  try {
    await prisma.adminAuditLog.create({ data: { actorId: entry.actor.id, actorRole: entry.actor.role, action: entry.action, entityType: entry.entityType, entityId: entry.entityId, beforeJson: safeJson(entry.before), afterJson: safeJson(entry.after), metadataJson: safeJson(entry.metadata), ip, userAgent } });
  } catch (err) {
    logger.warn('[audit] failed to record entry', { action: entry.action, entityType: entry.entityType, entityId: entry.entityId, error: err instanceof Error ? err.message : String(err) });
  }
}
export const writeAuditLog = recordAudit;
