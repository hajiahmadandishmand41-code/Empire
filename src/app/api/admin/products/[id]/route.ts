import type { NextRequest } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { recordAudit } from '@/lib/audit/log';
import { requireAdminApi } from '@/lib/auth/require-admin-api';
import { productUpdateSchema } from '@/features/products/product-contract';
import { getProductService } from '@/server/infrastructure/registry';
import { ProductServiceError } from '@/server/services/product.service';
import { mapErrorToResponse } from '@/server/infrastructure/errors';
import { logger } from '@/lib/logger';
export const dynamic='force-dynamic';

export async function OPTIONS(){return jsonPreflight()}

export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const g=await requireAdminApi('products.manage');
  if(!g.ok)return g.response;
  if(!isDatabaseConfigured())return jsonError('db_unavailable','Database is not configured',{status:503});
  let body:unknown;
  try{body=await req.json()}catch{return jsonError('invalid_json','Invalid JSON',{status:400})}
  const p=productUpdateSchema.safeParse(body);
  if(!p.success)return jsonError('invalid_body','Invalid product patch',{status:422,details:{issues:p.error.issues}});
  try{
    const before=await prisma.product.findUnique({where:{id}});
    if(!before)return jsonError('not_found','Product not found',{status:404});
    const {slug: _ignoredSlug,...changes}=p.data;
    const after=await getProductService().updateProduct(id,changes);
    await recordAudit({actor:{id:g.user.id,role:g.accessRole},action:'product.update',entityType:'product',entityId:id,before,after,req});
    return jsonOk(after);
  }catch(err){
    if(err instanceof ProductServiceError)return jsonError(err.code,err.message,{status:err.httpStatus});
    logger.error('admin.products.update_failed',{userId:g.user.id,productId:id},err);
    return mapErrorToResponse(err);
  }
}

export async function DELETE(req:NextRequest,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const g=await requireAdminApi('products.manage');
  if(!g.ok)return g.response;
  if(!isDatabaseConfigured())return jsonError('db_unavailable','Database is not configured',{status:503});
  try{
    const product=await prisma.product.findUnique({where:{id},select:{id:true,isActive:true,inStock:true}});
    if(!product)return jsonError('not_found','Product not found',{status:404});
    const orderCount=await prisma.orderItem.count({where:{productId:id}});
    if(orderCount>0){
      const after=await prisma.product.update({where:{id},data:{isActive:false,inStock:false}});
      await recordAudit({actor:{id:g.user.id,role:g.accessRole},action:'product.archive',entityType:'product',entityId:id,before:product,after,metadata:{orderCount},req});
      return jsonOk({deleted:false,archived:true,reason:'product_has_order_history'});
    }
    await getProductService().deleteProduct(id);
    await recordAudit({actor:{id:g.user.id,role:g.accessRole},action:'product.delete',entityType:'product',entityId:id,before:product,after:null,req});
    return jsonOk({deleted:true});
  }catch(err){
    logger.error('admin.products.delete_failed',{userId:g.user.id,productId:id},err);
    return mapErrorToResponse(err);
  }
}
