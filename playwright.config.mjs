import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for the E2E smoke suites.
 *
 * Seller specs authenticate once through the real login form (auth.setup.mjs)
 * and share the stored session, which keeps the suite inside the login
 * rate-limit budget (10 attempts per minute per client) and removes per-test
 * login flake. The admin spec authenticates on its own.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Browsers attach Origin automatically to unsafe-method requests, but
    // Playwright's APIRequestContext does not. The app's CSRF guard verifies
    // Origin on POST/PUT/PATCH/DELETE, so provide the same-origin value here.
    extraHTTPHeaders: { origin: process.env.BASE_URL ?? 'http://localhost:3000' },
  },
  projects: [
    {
      name: 'seller-setup',
      testMatch: /auth\.setup\.mjs$/,
    },
    {
      name: 'seller-e2e',
      testMatch: /seller-.*-e2e\.spec\.mjs$/,
      dependencies: ['seller-setup'],
      use: { storageState: 'tests/.auth/seller.json' },
    },
    {
      name: 'admin-e2e',
      testMatch: /admin-.*-e2e\.spec\.mjs$/,
    },
  ],
});
