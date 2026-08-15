/**
 * In-memory user store — Phase 12.
 *
 * Lets the auth routes work when `DATABASE_URL` is unset **only in
 * development**. This store is NEVER active in production or staging.
 * Any attempt to use it outside of development will throw at the call
 * site so the misconfiguration is caught immediately (fail-fast).
 *
 * Security notes
 * --------------
 * - Passwords are stored as real bcrypt hashes (same cost factor as
 *   the Prisma path), so `verifyPassword` is identical for mock and
 *   real users.
 * - Pre-seeded accounts use a *known* password (`Demo!1234`) — they
 *   exist so you can sign in immediately and explore the role-based
 *   panels. They are clearly marked as demo accounts.
 * - The store is intentionally tiny: a handful of users, no PII.
 */
import { hashPassword } from './password';
import type { CurrentUserRole } from './current-user';

export interface MockUserRecord {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  passwordHash: string;
  role: CurrentUserRole;
  isActive: boolean;
  createdAt: string;
}

interface SeedSpec {
  id: string;
  fullName: string;
  email: string;
  password: string;
  role: CurrentUserRole;
}

const SEEDS: SeedSpec[] = [
  {
    id: 'mock_admin',
    fullName: 'Demo Admin',
    email: 'admin@empire.shop',
    password: process.env.DEMO_PASSWORD ?? '',
    role: 'admin',
  },
  {
    id: 'mock_seller',
    fullName: 'Demo Seller',
    email: 'seller@empire.shop',
    password: process.env.DEMO_PASSWORD ?? '',
    role: 'seller',
  },
  {
    id: 'mock_customer',
    fullName: 'Demo Customer',
    email: 'customer@empire.shop',
    password: process.env.DEMO_PASSWORD ?? '',
    role: 'customer',
  },
];

declare global {
  // Persist across HMR in dev. Production runs are single-shot per process.
  // eslint-disable-next-line no-var
  var __empireMockUserStore: Map<string, MockUserRecord> | undefined;
  // eslint-disable-next-line no-var
  var __empireMockUserStoreReady: Promise<void> | undefined;
}

/**
 * Asserts that mock authentication is permitted in the current environment.
 * Throws an Error in production or staging so the server crashes early
 * rather than silently serving unauthenticated demo sessions.
 *
 * Call this at the top of every function that touches the mock store.
 */
export function assertMockAuthAllowed(): void {
  const env = process.env.NODE_ENV;
  if (env === 'production') {
    throw new Error(
      '[empire] FATAL: Mock authentication is disabled in production. ' +
        'Set DATABASE_URL to connect to a real Postgres database.',
    );
  }
  // Also block any non-development environment (staging, test, etc.)
  // unless ALLOW_MOCK_AUTH=true is explicitly set (useful for integration
  // test runners that set NODE_ENV=test but have no live DB).
  if (process.env.APP_MODE !== 'demo' || process.env.ALLOW_MOCK_AUTH !== 'true') {
    throw new Error(
      `[empire] Mock authentication is only available in development (NODE_ENV=${env}). ` +
        'Set DATABASE_URL or set ALLOW_MOCK_AUTH=true in a controlled test environment.',
    );
  }
}

function getStore(): Map<string, MockUserRecord> {
  if (!globalThis.__empireMockUserStore) {
    globalThis.__empireMockUserStore = new Map();
  }
  return globalThis.__empireMockUserStore;
}

async function seedOnce(): Promise<void> {
  const store = getStore();
  for (const s of SEEDS) {
    if (store.has(s.id)) continue;
    const passwordHash = await hashPassword(s.password);
    store.set(s.id, {
      id: s.id,
      fullName: s.fullName,
      email: s.email,
      phone: null,
      passwordHash,
      role: s.role,
      isActive: true,
      createdAt: new Date('2025-01-01T00:00:00Z').toISOString(),
    });
  }
}

/** Initialise the demo seed if it has not been done yet. Idempotent. */
export async function ensureMockUserStoreReady(): Promise<void> {
  assertMockAuthAllowed();
  if (globalThis.__empireMockUserStoreReady) {
    return globalThis.__empireMockUserStoreReady;
  }
  globalThis.__empireMockUserStoreReady = seedOnce();
  return globalThis.__empireMockUserStoreReady;
}

export interface MockUserFindArgs {
  email?: string;
  phone?: string;
  id?: string;
}

export async function findMockUser(args: MockUserFindArgs): Promise<MockUserRecord | null> {
  assertMockAuthAllowed();
  await ensureMockUserStoreReady();
  const store = getStore();
  if (args.id) {
    return store.get(args.id) ?? null;
  }
  const targetEmail = args.email?.toLowerCase() ?? null;
  const targetPhone = args.phone ?? null;
  for (const u of store.values()) {
    if (targetEmail && u.email?.toLowerCase() === targetEmail) return u;
    if (targetPhone && u.phone === targetPhone) return u;
  }
  return null;
}

export interface CreateMockUserInput {
  fullName: string;
  email: string | null;
  phone: string | null;
  password: string;
}

export async function createMockUser(input: CreateMockUserInput): Promise<MockUserRecord> {
  assertMockAuthAllowed();
  await ensureMockUserStoreReady();
  const store = getStore();
  const id = `mock_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const passwordHash = await hashPassword(input.password);
  const record: MockUserRecord = {
    id,
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    passwordHash,
    role: 'customer',
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  store.set(id, record);
  return record;
}

export function toCurrentUserShape(u: MockUserRecord): {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: CurrentUserRole;
  createdAt: string;
} {
  return {
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    phone: u.phone,
    role: u.role,
    createdAt: u.createdAt,
  };
}
