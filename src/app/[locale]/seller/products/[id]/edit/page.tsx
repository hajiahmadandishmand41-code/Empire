import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireSeller } from '@/lib/auth/roles';
import { listSellerCategories, getSellerProduct } from '@/features/seller/lib/products';
import { ProductForm } from '@/features/seller/components/product-form';
export const dynamic='force-dynamic';
export default async function EditProductPage({params}:{params:Promise<{locale:string;id:string}>}){const{locale,id}=await params;const user=await requireSeller({locale});const [product,cats]=await Promise.all([getSellerProduct(id,user.role==='admin'?undefined:user.id),listSellerCategories()]);if(!product)notFound();return <div><div className="mx-auto mb-4 max-w-5xl"><Link href={`/${locale}/seller/products`} className="text-xs font-bold text-muted-foreground hover:text-primary">← بازگشت به محصولات</Link></div><ProductForm mode="edit" categories={cats.items} initial={product} backHref={`/${locale}/seller/products`} sellerName={user.fullName} storeName={user.sellerShopName||'فروشگاه من'}/></div>}
