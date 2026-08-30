/** Product Service — Business Logic Layer */
import type { IProductRepository, ProductListFilter } from '../repositories/product.repository';
import type { ICategoryRepository } from '../repositories/category.repository';
import type { IReviewRepository } from '../repositories/review.repository';
import { mapProductSummary, mapProduct } from '@/lib/db-mappers';
import { computeSearchScore } from '../algorithms/search-scoring';
import { rankProducts, DEFAULT_RANKING_CONFIG } from '../algorithms/product-ranking';
import { diversifyProducts } from '../algorithms/product-diversity';
import { deterministicSlugFallback, slugifyProductName } from '@/features/products/product-slug';
import type { Product, ProductSummary } from '@/types';

export interface ProductListOptions extends ProductListFilter { rerank?: boolean; }
export interface ProductListResult { products: ProductSummary[]; total: number; page: number; pageSize: number; hasMore: boolean; source: 'db'; }
export class ProductServiceError extends Error { constructor(public readonly code: string, message: string, public readonly httpStatus = 400) { super(message); this.name = 'ProductServiceError'; } }
function readJsonArray(raw: unknown): string[] { if (raw == null) return []; try { const value: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw; return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; } catch { return []; } }

export class ProductService {
  constructor(private readonly products: IProductRepository, private readonly categories: ICategoryRepository, private readonly reviews: IReviewRepository) {}
  async listProducts(opts: ProductListOptions): Promise<ProductListResult> { const page=Math.max(1,opts.page??1),pageSize=Math.min(100,Math.max(1,opts.pageSize??24)),isSearch=Boolean(opts.q?.trim()); const useSmartFeed=!isSearch&&(!opts.sort||opts.sort==='default'||opts.sort==='recommended'),useCandidateRanking=isSearch||useSmartFeed,candidatePageSize=useCandidateRanking?Math.min(200,Math.max(pageSize*4,100)):pageSize,logicalOffset=(page-1)*pageSize,candidatePage=useCandidateRanking?Math.floor(logicalOffset/candidatePageSize)+1:page,candidateOffset=useCandidateRanking?logicalOffset%candidatePageSize:0; const paginated=await this.products.findMany({...opts,page:candidatePage,pageSize:candidatePageSize,isActive:true}); const ratings=await this.products.getRatings(paginated.items.map(r=>r.id)); const mapped=paginated.items.map(row=>{const rating=ratings.get(row.id);return{row,summary:mapProductSummary(row as never,{averageRating:rating?.average??0,reviewCount:rating?.count??0})}}); let ranked:ProductSummary[]; if(isSearch&&opts.q&&opts.rerank!==false) ranked=mapped.map(({row,summary})=>({product:summary,score:computeSearchScore({id:row.id,name:row.name,shortDescription:row.shortDescription,description:row.description,categoryName:row.category?.name,region:row.region,sellerShopName:row.seller?.sellerShopName,tags:readJsonArray(row.tagsJson)},opts.q!)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||(b.product.salesCount??0)-(a.product.salesCount??0)||a.product.id.localeCompare(b.product.id)).map(x=>x.product); else if(useSmartFeed){ranked=rankProducts(mapped.map(({summary})=>({...summary,averageRating:summary.averageRating??0,reviewCount:summary.reviewCount??0,salesCount:summary.salesCount??0,viewCount:summary.viewCount??0,compareAtPrice:summary.comparePrice??null,createdAt:summary.createdAt??undefined})),DEFAULT_RANKING_CONFIG);ranked=diversifyProducts(ranked,{maxPerSeller:3,maxPerCategory:4})} else ranked=mapped.map(({summary})=>summary); const start=useCandidateRanking?candidateOffset:0,products=ranked.slice(start,start+pageSize),hasMore=useCandidateRanking?logicalOffset+products.length<paginated.total:paginated.hasMore; return{products,total:paginated.total,page,pageSize,hasMore,source:'db'}; }
  async getProductBySlug(slug:string):Promise<Product|null>{const row=await this.products.findBySlug(slug);if(!row||!row.isActive)return null;void this.products.incrementViewCount(row.id).catch(()=>undefined);const agg=await this.reviews.summarize(row.id);return mapProduct(row as never,{averageRating:agg.average,reviewCount:agg.count});}
  async getProductById(id:string):Promise<Product|null>{const row=await this.products.findById(id);if(!row||!row.isActive)return null;void this.products.incrementViewCount(row.id).catch(()=>undefined);const agg=await this.reviews.summarize(row.id);return mapProduct(row as never,{averageRating:agg.average,reviewCount:agg.count});}
  async getRelatedProducts(slug:string,limit=4):Promise<ProductSummary[]>{const product=await this.products.findBySlug(slug);if(!product||!product.isActive)return[];const related=await this.products.findRelated(product.id,limit);return related.map(r=>mapProductSummary(r as never));}

  private async uniqueSlug(preferred: string, name: string, categoryId: string): Promise<string> {
    const base = slugifyProductName(preferred || name);
    if (!(await this.products.slugExists(base))) return base;
    const fallback = deterministicSlugFallback(name, categoryId);
    if (!(await this.products.slugExists(fallback))) return fallback;
    for (let suffix = 2; suffix <= 100; suffix += 1) {
      const candidate = `${fallback}-${suffix}`.slice(0, 80).replace(/-+$/g, '');
      if (!(await this.products.slugExists(candidate))) return candidate;
    }
    throw new ProductServiceError('slug_unavailable', 'ساخت شناسه یکتای محصول ممکن نشد. لطفاً دوباره تلاش کنید.', 409);
  }

  async createProduct(input:{slug?:string|null;name:string;shortDescription:string;price:number;compareAtPrice?:number|null;categoryId:string;sellerId?:string|null;region:string;currency?:string;inStock?:boolean;isActive?:boolean;stockQuantity?:number;description?:string|null;whatsappNumber?:string|null;videoUrl?:string|null;isTraditional?:boolean;images?:string[];weightKg?:number|null;dimensionsJson?:string|null;tagsJson?:string|null;attributesJson?:string|null;primaryImageIndex?:number;badge?:string|null;}){
    const category=await this.categories.findById(input.categoryId);
    if(!category)throw new ProductServiceError('category_not_found','دسته‌بندی انتخاب‌شده وجود ندارد. لطفاً یک دسته‌بندی معتبر انتخاب کنید.',422);
    const images=input.images??[];
    if(input.primaryImageIndex!==undefined && input.primaryImageIndex >= images.length && images.length > 0) throw new ProductServiceError('invalid_primary_image','تصویر اصلی انتخاب‌شده معتبر نیست.',422);
    const slug=await this.uniqueSlug(input.slug??'',input.name,input.categoryId);
    try{return await this.products.create({...input,slug,images,primaryImageIndex:images.length>0?(input.primaryImageIndex??0):0});}
    catch(err:unknown){const e=err as{code?:string};if(e.code==='P2002')throw new ProductServiceError('slug_exists','ساخت شناسه یکتای محصول ممکن نشد. لطفاً دوباره تلاش کنید.',409);throw err;}
  }
  async updateProduct(id:string,input:{name?:string;shortDescription?:string;price?:number;compareAtPrice?:number|null;categoryId?:string;region?:string;currency?:string;inStock?:boolean;isActive?:boolean;stockQuantity?:number;description?:string|null;whatsappNumber?:string|null;videoUrl?:string|null;isTraditional?:boolean;images?:string[];tagsJson?:string|null;attributesJson?:string|null;weightKg?:number|null;dimensionsJson?:string|null;primaryImageIndex?:number;}){
    if(input.categoryId){const category=await this.categories.findById(input.categoryId);if(!category)throw new ProductServiceError('category_not_found','دسته‌بندی انتخاب‌شده وجود ندارد.',422)}
    const current=await this.products.findById(id);
    if(!current)throw new ProductServiceError('not_found','محصول پیدا نشد.',404);
    const images=input.images??readJsonArray(current.imagesJson);
    const nextPrimary=input.primaryImageIndex??current.primaryImageIndex;
    if(images.length===0&&nextPrimary!==0)throw new ProductServiceError('invalid_primary_image','وقتی تصویر ندارید، تصویر اصلی باید صفر باشد.',422);
    if(images.length>0&&nextPrimary>=images.length)throw new ProductServiceError('invalid_primary_image','تصویر اصلی انتخاب‌شده معتبر نیست.',422);
    return this.products.update(id,{...input,images,primaryImageIndex:images.length>0?nextPrimary:0});
  }
  async deleteProduct(id:string):Promise<void>{await this.products.delete(id)}
  async checkOwnership(productId:string,userId:string,isAdmin:boolean):Promise<'ok'|'not_found'|'forbidden'>{const product=await this.products.findById(productId);if(!product)return'not_found';if(isAdmin)return'ok';return product.sellerId===userId?'ok':'forbidden'}
  async getHomepageSections(sectionSize=8):Promise<{newest:ProductSummary[];bestSelling:ProductSummary[];mostViewed:ProductSummary[];popular:ProductSummary[];featured:ProductSummary[]}>{const baseFilter:ProductListFilter={isActive:true,pageSize:sectionSize}; const [newResult,bestResult,viewedResult,popularResult,featuredResult]=await Promise.all([this.products.findMany({...baseFilter,sort:'newest',page:1}),this.products.findMany({...baseFilter,sort:'bestSelling',page:1}),this.products.findMany({...baseFilter,sort:'mostViewed',page:1}),this.products.findMany({...baseFilter,sort:'popular',page:1}),this.products.findMany({...baseFilter,featured:true,sort:'featured',page:1})]);return{newest:newResult.items.map(r=>mapProductSummary(r as never)),bestSelling:bestResult.items.map(r=>mapProductSummary(r as never)),mostViewed:viewedResult.items.map(r=>mapProductSummary(r as never)),popular:popularResult.items.map(r=>mapProductSummary(r as never)),featured:featuredResult.items.map(r=>mapProductSummary(r as never))};}
}
