import { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonError, jsonOk } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';
import { deleteHomepageSection, listHomepageSections, upsertHomepageSection } from '@/features/admin/lib/control-store';

const schema = z.object({
  id: z.string().optional(), key: z.string().trim().min(2).max(80), title: z.string().max(160).optional().nullable(),
  subtitle: z.string().max(300).optional().nullable(), type: z.string().max(40).default('products'), configJson: z.record(z.unknown()).default({}),
  sortOrder: z.number().int().min(0).max(10000).default(0), isActive: z.boolean().default(true),
});

export async function GET() { const guard = await requireAdminApi('homepage.manage'); if (!guard.ok) return guard.response; try { return jsonOk(await listHomepageSections()); } catch { return jsonError('db_unavailable','Homepage builder is unavailable',{status:503}); } }
export async function PUT(req: NextRequest) { const guard = await requireAdminApi('homepage.manage'); if (!guard.ok) return guard.response; const parsed = schema.safeParse(await req.json().catch(()=>null)); if (!parsed.success) return jsonError('invalid_body','Invalid homepage section',{status:422}); try { const id=await upsertHomepageSection(parsed.data); return jsonOk({id}); } catch { return jsonError('save_failed','Failed to save homepage section',{status:500}); } }
export async function DELETE(req: NextRequest) { const guard = await requireAdminApi('homepage.manage'); if (!guard.ok) return guard.response; const id=new URL(req.url).searchParams.get('id'); if(!id) return jsonError('invalid_id','Section id is required',{status:400}); try { await deleteHomepageSection(id); return jsonOk({deleted:true}); } catch { return jsonError('delete_failed','Failed to delete section',{status:500}); } }
