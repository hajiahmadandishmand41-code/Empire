import { prisma, isDatabaseConfigured } from '@/lib/db';

export type AdminSellerApplication = {
  id: string;
  userId: string;
  shopName: string;
  ownerName: string;
  phone: string;
  address: string;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  user: {
    fullName: string;
    email: string | null;
    phone: string | null;
  };
};

export async function listPendingSellerApplications(limit = 12): Promise<AdminSellerApplication[]> {
  if (!isDatabaseConfigured()) return [];
  const rows = await prisma.sellerApplication.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'asc' },
    take: limit,
    include: {
      user: { select: { fullName: true, email: true, phone: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    shopName: row.shopName,
    ownerName: row.ownerName,
    phone: row.phone,
    address: row.address,
    description: row.description,
    status: row.status,
    rejectionReason: row.rejectionReason,
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    user: row.user,
  }));
}
