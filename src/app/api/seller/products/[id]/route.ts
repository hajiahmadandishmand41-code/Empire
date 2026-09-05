import type { NextRequest } from 'next/server';
import { isDatabaseConfigured, prisma } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireSellerApi } from '@/lib/auth/require-seller-api';
import { productUpdateSchema, parseProductImages } from '@/features/products/product-contract';
import { getProductService } from '@/server/infrastructure/registry';
import { ProductServiceError } from '@/server/services/product.service';
import { mapErrorToResponse } from '@/server/infrastructure/errors';
import { deletePersistent } from '@/lib/storage';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
function serializeProduct<T extends object>(row:T){const out={...row} as Record<string,unknown>;if(out.price!=null)out.price=Number(out.price);if(out.compareAtPrice!=null)out.compareAtPrice=Number(out.compareAtPrice);if(out.weightKg!=null)out.weightKg=Number(out.weightKg);out.images=parseProductImages(out.imagesJson);delete out.imagesJson;return out;}
async function cleanupImages(urls:string[],productId:string,userId:string){for(const url of urls){try{await deletePersistent(url);}catch(err){logger.warn('seller.products.media_cleanup_failed',{productId,userId,url},err);}}}
export async function OPTIONS(){return jsonPreflight();}
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
  const {id}=await params; const guard=await requireSellerApi(); if(!guard.ok)return guard.response;
  if(!isDatabaseConfigured())return jsonError('db_unavailable','Database is not configured',{status:503});
  let body:unknown; try{body=await req.json();}catch{return jsonError('invalid_json','Invalid JSON',{status:400});}
  const parsed=productUpdateSchema.safeParse(body); if(!parsed.success)return jsonError('invalid_body','Invalid product patch',{status:422,details:{issues:parsed.error.issues}});
  try{
    const svc=getProductService(); const ownership=await svc.checkOwnership(id,guard.user.id,guard.user.role==='admin');
    if(ownership==='not_found')return jsonError('not_found','Product not found',{status:404});
    if(ownership==='forbidden')return jsonError('forbidden','You do not own this product',{status:403});
    if(parsed.data.isActive === true){
      const current=await prisma.product.findUnique({where:{id},select:{imagesJson:true}});
      const imageCount=parseProductImages(parsed.data.images ?? current?.imagesJson).length;
      if(imageCount<3)return jsonError('insufficient_images','برای فعال‌سازی محصول حداقل ۳ تصویر لازم است.',{status:422});
    }
    const {slug:_ignoredSlug, brandId, ...changes}=parsed.data; void _ignoredSlug;
    if (brandId) {
      const rows = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "SellerBrand"
        WHERE "id" = ${brandId} AND "sellerId" = ${guard.user.id} AND "isActive" = true
        LIMIT 1
      `;
      if (!rows[0]) return jsonError('invalid_brand','برند فعال متعلق به این فروشنده پیدا نشد.',{status:422});
    }
    const updated=await svc.updateProduct(id,{...changes,brandId}); return jsonOk(serializeProduct(updated));
  }catch(err){if(err instanceof ProductServiceError)return jsonError(err.code,err.message,{status:err.httpStatus});logger.error('seller.product.update_failed',{productId:id,sellerId:guard.user.id},err);return mapErrorToResponse(err);}
}
export async function DELETE(_req:NextRequest,{params}:{params:Promise<{id:string}>}){const {id}=await params;const guard=await requireSellerApi();if(!guard.ok)return guard.response;if(!isDatabaseConfigured())return jsonError('db_unavailable','Database is not configured',{status:503});try{const svc=getProductService();const ownership=await svc.checkOwnership(id,guard.user.id,guard.user.role==='admin');if(ownership==='not_found')return jsonError('not_found','Product not found',{status:404});if(ownership==='forbidden')return jsonError('forbidden','You do not own this product',{status:403});const product=await prisma.product.findUnique({where:{id},select:{imagesJson:true}});const orderItemCount=await prisma.orderItem.count({where:{productId:id}});if(orderItemCount>0){await prisma.product.update({where:{id},data:{isActive:false,inStock:false}});logger.info('seller.product.deactivated_after_orders',{productId:id,sellerId:guard.user.id,orderItemCount});return jsonOk({deleted:false,deactivated:true,preservedOrderHistory:true});}await svc.deleteProduct(id);const media=parseProductImages(product?.imagesJson);await cleanupImages(media,id,guard.user.id);logger.info('seller.product.deleted',{productId:id,sellerId:guard.user.id,mediaCount:media.length});return jsonOk({deleted:true,deactivated:false,mediaCleanupAttempted:media.length});}catch(err){logger.error('seller.product.delete_failed',{productId:id,sellerId:guard.user.id},err);return mapErrorToResponse(err);}}
