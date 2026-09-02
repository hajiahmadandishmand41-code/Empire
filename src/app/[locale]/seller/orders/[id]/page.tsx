import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireSeller } from '@/lib/auth/roles';
import { getOrderForViewer } from '@/features/orders';
import { OrderDetail } from '@/features/orders/components/order-detail';
export const dynamic='force-dynamic';
export default async function SellerOrderDetailPage({params}:{params:Promise<{locale:string;id:string}>}){const{locale,id}=await params;const u=await requireSeller({locale});const viewer={id:u.id,role:u.role==='admin'?'admin':'seller'} as const;const result=await getOrderForViewer(id,viewer);if(!result)notFound();return <div className="mx-auto max-w-7xl" dir="rtl"><Link href={`/${locale}/seller/orders`} className="mb-4 inline-block text-xs font-bold text-muted-foreground hover:text-primary">← بازگشت به سفارش‌ها</Link><OrderDetail order={result.order} totals={result.totals}/></div>}
