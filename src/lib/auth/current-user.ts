import { prisma, isDatabaseConfigured } from '@/lib/db';
import { getSessionPayload } from './session';

export type CurrentUserRole = 'customer' | 'seller' | 'admin';

export interface CurrentUser {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: CurrentUserRole;
  createdAt: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  isActive?: boolean;
  sellerStatus?: string;
  sellerShopName?: string | null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSessionPayload();
  if (!session || !isDatabaseConfigured()) return null;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !user.isActive) return null;

  // Do not invalidate a healthy session merely because a normal profile,
  // address, seller-setting, or other non-security user update changed
  // `updatedAt`. Session lifetime is controlled by the signed cookie expiry;
  // explicit logout/disablement remains authoritative.
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    isActive: user.isActive,
    sellerStatus: user.sellerStatus,
    sellerShopName: user.sellerShopName,
  };
}
