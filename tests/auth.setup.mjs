import { test as setup, expect } from '@playwright/test';

const base = process.env.BASE_URL ?? 'http://localhost:3000';
const email = process.env.SELLER_E2E_EMAIL;
const password = process.env.SELLER_E2E_PASSWORD;

export const SELLER_AUTH_FILE = 'tests/.auth/seller.json';

/**
 * Authenticates the seller once through the real login form and stores the
 * session for every seller spec. Keeps the suite inside the login rate-limit
 * budget (10 attempts / minute) and removes per-test login flake.
 */
setup('authenticate seller', async ({ page }) => {
  setup.skip(!email || !password, 'SELLER_E2E_EMAIL and SELLER_E2E_PASSWORD are required');
  await page.goto(`${base}/fa/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.next?.version), null, { timeout: 30000 });
  await page.locator('input[type="text"], input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('form[aria-label]').getByRole('button', { name: /ورود|login/i }).click();
  await expect(page).toHaveURL(/\/fa\/seller(?:[/?#]|$)/, { timeout: 30000 });
  await page.context().storageState({ path: SELLER_AUTH_FILE });
});
