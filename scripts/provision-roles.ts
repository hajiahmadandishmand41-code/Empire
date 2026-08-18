import { PrismaClient, Role, SellerStatus } from '@prisma/client';
import { hashPassword } from '../src/lib/auth/password';

const prisma = new PrismaClient();

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
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
      sellerStatus: args.role === Role.seller ? SellerStatus.approved : SellerStatus.none,
    },
    create: {
      email: args.email,
      fullName: args.fullName,
      passwordHash,
      role: args.role,
      isActive: true,
      sellerStatus: args.role === Role.seller ? SellerStatus.approved : SellerStatus.none,
    },
    select: { id: true, email: true, role: true, isActive: true, sellerStatus: true },
  });

  console.log(`${args.role} provisioned: ${user.email}`);
}

async function main() {
  await upsertRoleUser({
    email: required('ADMIN_EMAIL'),
    fullName: process.env.ADMIN_NAME?.trim() || 'Empire Administrator',
    role: Role.admin,
    password: required('ADMIN_PASSWORD'),
  });

  await upsertRoleUser({
    email: required('SELLER_EMAIL'),
    fullName: process.env.SELLER_NAME?.trim() || 'Empire Seller',
    role: Role.seller,
    password: required('SELLER_PASSWORD'),
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
