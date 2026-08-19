import { NextRequest } from 'next/server';
import { jsonError,jsonOk } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';
import { prisma,isDatabaseConfigured } from '@/lib/db';
export async function GET(req:NextRequest){const guard=await requireAdminApi('audit.view');if(!guard.ok)return guard.response;if(!isDatabaseConfigured())return jsonError('db_unavailable','Audit log unavailable',{status:503});const page=Math.max(1,Number(req.nextUrl.searchParams.get('page')??1));const pageSize=Math.min(100,Math.max(10,Number(req.nextUrl.searchParams.get('pageSize')??50)));try{const rows=await prisma.adminAuditLog.findMany({orderBy:{createdAt:'desc'},take:pageSize,skip:(page-1)*pageSize});const total=await prisma.adminAuditLog.count();return jsonOk(rows,{meta:{total,page,pageSize}});}catch{return jsonError('query_failed','Failed to load audit log',{status:500});}}
