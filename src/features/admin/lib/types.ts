/** Shared admin row contracts. Runtime data must come from repositories/services, not fixtures. */
export interface AdminStats { users:number; products:number; orders:number; categories:number; revenue:number; currency:string; }
export interface AdminOrderRow { id:string; reference:string; status:string; paymentMethod:string; total:number; currency:string; itemCount:number; customerName:string; createdAt:string; }
export interface AdminUserRow { id:string; fullName:string; email:string|null; phone:string|null; role:'customer'|'seller'|'admin'; isActive:boolean; createdAt:string; orderCount:number; }
export interface AdminProductRow { id:string; slug:string; name:string; price:number; currency:string; categoryName:string; region:string; inStock:boolean; isHero?:boolean; createdAt:string; }
export interface AdminCategoryRow { id:string; key:string; name:string; slug:string; imageUrl?:string|null; productCount:number; }
export interface SalesByDay { date:string; count:number; revenue:number; }
export interface TopProduct { slug:string; name:string; units:number; revenue:number; }
export type SellerStatus='none'|'pending'|'approved'|'rejected';
export interface AdminSellerRow{id:string;fullName:string;email:string|null;phone:string|null;shopName:string|null;bio:string|null;sellerStatus:SellerStatus;isActive:boolean;productCount:number;createdAt:string;application?:{id:string;shopName:string;ownerName:string;phone:string;address:string;description:string|null;status:SellerStatus;createdAt:string}|null;}
export interface AdminTransactionRow{id:string;reference:string;orderId:string;orderReference:string;provider:string;method:string;status:string;amount:number;currency:string;paidAt:string|null;createdAt:string;}
export interface AdminRevenueSummary{gross:number;paid:number;pending:number;refunded:number;currency:string;orderCount:number;paidOrderCount:number;averageOrderValue:number;byDay:SalesByDay[];byMethod:{method:string;amount:number;count:number}[];}
