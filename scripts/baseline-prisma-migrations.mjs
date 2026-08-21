#!/usr/bin/env node
/**
 * One-time, non-destructive Prisma baseline bootstrap for an already provisioned
 * Empire database.
 *
 * There are three safe database states:
 *  1. `_prisma_migrations` exists: nothing to bootstrap.
 *  2. No migration history and all required application tables exist: mark only
 *     the canonical historical baseline as applied; newer migrations remain
 *     pending for `prisma migrate deploy`.
 *  3. No migration history and none of the required application tables exist:
 *     the database is empty. Exit with code 10 so the Vercel build can skip the
 *     baseline and let `prisma migrate deploy` create the schema normally.
 *
 * A partially-populated database without migration history is rejected rather
 * than guessed, because automatically choosing a baseline there could hide
 * schema drift or destroy the integrity of the migration history.
 */
import { PrismaClient } from '@prisma/client';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const BASELINE_MIGRATION = '202608210227_baseline_existing_supabase_schema';
const EMPTY_DATABASE_EXIT_CODE = 10;

const REQUIRED_TABLES = [
  'Address',
  'AdminAuditLog',
  'Cart',
  'CartItem',
  'Category',
  'Order',
  'OrderItem',
  'Payout',
  'Product',
  'Review',
  'SellerApplication',
  'SellerNotification',
  'SellerWallet',
  'ShippingMethod',
  'Transaction',
  'User',
  'VerificationToken',
  'WalletTransaction',
  'WishlistItem',
];

function readEnv(name) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : null;
}

function normalizePoolerUrl(value) {
  try {
    const url = new URL(value);
    if (!url.hostname.includes('.pooler.supabase.com')) return null;
    if (url.port === '6543') url.port = '5432';
    if (!url.port) url.port = '5432';
    url.searchParams.delete('pgbouncer');
    if (!url.searchParams.has('connect_timeout')) url.searchParams.set('connect_timeout', '30');
    return url.toString();
  } catch {
    return null;
  }
}

function normalizeAnyUrl(value) {
  const url = new URL(value);
  if (!url.searchParams.has('connect_timeout')) url.searchParams.set('connect_timeout', '30');
  return url.toString();
}

function pickDatabaseUrl() {
  const poolerCandidates = [
    ['STORAGE_POSTGRES_URL_NON_POOLING', readEnv('STORAGE_POSTGRES_URL_NON_POOLING')],
    ['STORAGE_POSTGRES_PRISMA_URL', readEnv('STORAGE_POSTGRES_PRISMA_URL')],
    ['STORAGE_POSTGRES_URL', readEnv('STORAGE_POSTGRES_URL')],
    ['POSTGRES_URL_NON_POOLING', readEnv('POSTGRES_URL_NON_POOLING')],
    ['POSTGRES_PRISMA_URL', readEnv('POSTGRES_PRISMA_URL')],
    ['POSTGRES_URL', readEnv('POSTGRES_URL')],
    ['SUPABASE_DB_URL', readEnv('SUPABASE_DB_URL')],
  ];

  for (const [key, value] of poolerCandidates) {
    if (!value) continue;
    const normalized = normalizePoolerUrl(value);
    if (normalized) return { key, value: normalized };
  }

  const directCandidates = [
    ['DATABASE_URL_UNPOOLED', readEnv('DATABASE_URL_UNPOOLED')],
    ['DIRECT_DATABASE_URL', readEnv('DIRECT_DATABASE_URL')],
    ['DIRECT_URL', readEnv('DIRECT_URL')],
    ['DATABASE_URL', readEnv('DATABASE_URL')],
  ];

  for (const [key, value] of directCandidates) {
    if (value) return { key, value: normalizeAnyUrl(value) };
  }

  return null;
}

function runResolve(migrationName, databaseUrl) {
  const result = spawnSync('npx', ['--no-install', 'prisma', 'migrate', 'resolve', '--applied', migrationName], {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  if (result.error) {
    throw new Error(`Failed to start Prisma for ${migrationName}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`Prisma migration resolve failed for ${migrationName}.`);
  }
}

async function inspectDatabase(databaseUrl) {
  const prisma = new PrismaClient();
  try {
    const migrationTable = await prisma.$queryRaw`
      SELECT to_regclass('public."_prisma_migrations"')::text AS name
    `;
    if (migrationTable[0]?.name) {
      return { hasMigrationHistory: true, tableNames: new Set() };
    }

    const tableRows = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    return {
      hasMigrationHistory: false,
      tableNames: new Set(tableRows.map((row) => row.table_name)),
    };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const picked = pickDatabaseUrl();
  if (!picked) throw new Error('No database URL or Supabase/Vercel pooler URL is configured.');
  process.env.DATABASE_URL = picked.value;

  console.log(`[baseline] Inspecting database using ${picked.key}.`);
  const inspection = await inspectDatabase(picked.value);

  if (inspection.hasMigrationHistory) {
    console.log('[baseline] _prisma_migrations already exists; no baseline needed.');
    return;
  }

  const missing = REQUIRED_TABLES.filter((name) => !inspection.tableNames.has(name));
  const existingRequiredCount = REQUIRED_TABLES.length - missing.length;

  if (existingRequiredCount === 0) {
    console.log('[baseline] No required Empire application tables exist; database is empty.');
    process.exit(EMPTY_DATABASE_EXIT_CODE);
  }

  if (missing.length > 0) {
    throw new Error(
      `Refusing automatic baseline because the database has a partial Prisma schema. Missing tables: ${missing.join(', ')}`,
    );
  }

  const migrationsDir = join(process.cwd(), 'prisma', 'migrations');
  const migrations = readdirSync(migrationsDir)
    .filter((name) => statSync(join(migrationsDir, name)).isDirectory())
    .sort();

  if (migrations.length === 0) throw new Error('No Prisma migrations found in prisma/migrations.');
  const baselineIndex = migrations.indexOf(BASELINE_MIGRATION);
  if (baselineIndex < 0) {
    throw new Error(`Canonical baseline migration not found: ${BASELINE_MIGRATION}`);
  }

  const baselineMigrations = migrations.slice(0, baselineIndex + 1);
  const pendingMigrations = migrations.slice(baselineIndex + 1);
  console.log(`[baseline] Marking ${baselineMigrations.length} pre-baseline migrations as applied; leaving ${pendingMigrations.length} newer migrations pending.`);

  for (const migration of baselineMigrations) {
    console.log(`[baseline] Marking ${migration} as applied.`);
    runResolve(migration, picked.value);
  }

  console.log('[baseline] Prisma migration history bootstrapped successfully.');
}

main().catch((error) => {
  console.error(`[baseline] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
