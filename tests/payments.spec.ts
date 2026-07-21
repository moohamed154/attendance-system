/**
 * payments.spec.ts — Payments & Settings Modules
 *
 * Uses pre-loaded storageState (admin session) from auth-setup.
 */
import { test, expect } from './fixtures/app';

test.describe('Payments Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/payments', { waitUntil: 'domcontentloaded' });
  });

  test('Page loads and payments render', async ({ page }) => {
    await expect(page.getByTestId('payments-page')).toBeVisible();
  });
});

test.describe('Settings Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });
  });

  test('Settings page loads', async ({ page }) => {
    await expect(page.getByTestId('settings-page')).toBeVisible();
  });
});
