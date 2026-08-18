import { PrismaClient, Role, SellerStatus } from '@prisma/client';
import { hashPassword } from '../src/lib/auth/password';

const prisma = new PrismaClient();

function required(primary: string, ...aliases: string[]): string {
  for (const name of [primary, ...aliases]) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  throw new Error(`Missing required environment variable: ${primary}`);
}

async function upsertRoleUser(args: {
  email: string;
  fullName: string;
  role: Role;
  password: string;
}) {
  const passwordHash = await hashPassword(args.password);
  const user = await prisma.user.upsert({
    where: { email: args.email },
    update: {
      fullName: args.fullName,
      passwordHash,
      role: args.role,
      isActive: true,
      emailVerified: true,
      sellerStatus: args.role === Role.seller ? SellerStatus.approved : SellerStatus.none,
    },
    create: {
      email: args.email,
      fullName: args.fullName,
      passwordHash,
      role: args.role,
      isActive: true,
      emailVerified: true,
      sellerStatus: args.role === Role.seller ? SellerStatus.approved : SellerStatus.none,
    },
    select: { id: true, role: true, isActive: true, sellerStatus: true },
  });

  console.log(`${user.role} account provisioned.`);
}

async function main() {
  await upsertRoleUser({
    email: required('EMPIRE_ADMIN_EMAIL', 'ADMIN_EMAIL'),
    fullName:
      process.env.EMPIRE_ADMIN_NAME?.trim() || process.env.ADMIN_NAME?.trim() || 'Empire Administrator',
    role: Role.admin,
    password: required('EMPIRE_ADMIN_PASSWORD', 'ADMIN_PASSWORD'),
  });

  await upsertRoleUser({
    email: required('EMPIRE_SELLER_EMAIL', 'SELLER_EMAIL'),
    fullName:
      process.env.EMPIRE_SELLER_NAME?.trim() || process.env.SELLER_NAME?.trim() || 'Empire Seller',
    role: Role.seller,
    password: required('EMPIRE_SELLER_PASSWORD', 'SELLER_PASSWORD'),
  });
}

main()
  .catch((error) => {
    console.error('Role provisioning failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
