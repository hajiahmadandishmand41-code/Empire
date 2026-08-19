import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { jsonError,jsonOk } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';
import { listSearchStats } from '@/features/admin/lib/control-store';
import { prisma,isDatabaseConfigured } from '@/lib/db';
export async function GET(req:NextRequest){const guard=await requireAdminApi('search.view');if(!guard.ok)return guard.response;if(!isDatabaseConfigured())return jsonError('db_unavailable','Search analytics unavailable',{status:503});try{return jsonOk(await listSearchStats(req.nextUrl.searchParams.get('q')??undefined));}catch{return jsonError('query_failed','Failed to load search analytics',{status:500});}}
export async function PUT(req:NextRequest){const guard=await requireAdminApi('search.view');if(!guard.ok)return guard.response;const body=await req.json().catch(()=>null) as {query?:string,resultCount?:number}|null;if(!body?.query?.trim())return jsonError('invalid_query','Query is required',{status:400});try{await prisma.$executeRawUnsafe(`INSERT INTO "SearchQueryStat" ("id","query","resultCount","searchCount","lastSearchedAt") VALUES ($1,$2,$3,1,NOW()) ON CONFLICT ("query") DO UPDATE SET "resultCount"=$3,"searchCount"="SearchQueryStat"."searchCount"+1,"lastSearchedAt"=NOW()`,randomUUID(),body.query.trim().toLowerCase(),body.resultCount??0);return jsonOk({saved:true});}catch{return jsonError('save_failed','Failed to update search stat',{status:500});}}
