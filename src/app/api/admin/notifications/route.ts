import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonError,jsonOk } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';

type NotificationDbRow={id:string;audience:string;title:string;body:string|null;href:string|null;kind:string;isActive:boolean;sendAt:Date|null;expiresAt:Date|null;createdAt:Date;createdById:string};
const schema=z.object({audience:z.enum(['users','sellers','all']),title:z.string().trim().min(2).max(160),body:z.string().max(1000).optional().nullable(),href:z.string().max(500).optional().nullable(),kind:z.string().max(40).default('system'),isActive:z.boolean().default(true),sendAt:z.string().datetime().optional().nullable(),expiresAt:z.string().datetime().optional().nullable()});
export async function GET(){const g=await requireAdminApi('notifications.manage');if(!g.ok)return g.response;try{return jsonOk(await prisma.$queryRawUnsafe<NotificationDbRow[]>('SELECT * FROM "AdminNotification" ORDER BY "createdAt" DESC LIMIT 100'));}catch{return jsonError('db_unavailable','Notifications unavailable',{status:503});}}
export async function POST(req:NextRequest){const g=await requireAdminApi('notifications.manage');if(!g.ok)return g.response;const p=schema.safeParse(await req.json().catch(()=>null));if(!p.success)return jsonError('invalid_body','Invalid notification payload',{status:422});try{const id=randomUUID();await prisma.$executeRawUnsafe(`INSERT INTO "AdminNotification" ("id","audience","title","body","href","kind","isActive","sendAt","expiresAt","createdById") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,id,p.data.audience,p.data.title,p.data.body??null,p.data.href??null,p.data.kind,p.data.isActive,p.data.sendAt?new Date(p.data.sendAt):null,p.data.expiresAt?new Date(p.data.expiresAt):null,g.user.id);return jsonOk({id},{status:201});}catch{return jsonError('save_failed','Failed to create notification',{status:500});}}
