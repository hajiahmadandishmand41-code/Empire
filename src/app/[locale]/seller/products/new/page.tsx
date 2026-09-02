import Link from 'next/link';
import { requireSeller } from '@/lib/auth/roles';
import { listSellerCategories } from '@/features/seller/lib/products';
import { ProductForm } from '@/features/seller/components/product-form';
export const dynamic='force-dynamic';
export default async function NewProductPage({params}:{params:Promise<{locale:string}>}){const{locale}=await params;const user=await requireSeller({locale});const cats=await listSellerCategories();return <div><div className="mx-auto mb-4 max-w-5xl"><Link href={`/${locale}/seller/products`} className="text-xs font-bold text-muted-foreground hover:text-primary">← بازگشت به محصولات</Link></div><ProductForm mode="create" categories={cats.items} backHref={`/${locale}/seller/products`} sellerName={user.fullName} storeName={user.sellerShopName||'فروشگاه من'}/></div>}
