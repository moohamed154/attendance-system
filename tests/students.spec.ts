/**
 * students.spec.ts — Students Module
 *
 * Uses pre-loaded storageState (admin session) from auth-setup.
 */
import { test, expect } from './fixtures/app';

test.describe('Students Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/students', { waitUntil: 'domcontentloaded' });
  });

  test('Page loads and filters render', async ({ page }) => {
    await expect(page.getByTestId('student-search')).toBeVisible();
  });

  test('Can open Add Student dialog', async ({ page }) => {
    const btn = page.getByTestId('add-student-button');
    await expect(btn).toBeVisible();
    await btn.click({ force: true });
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10000 });
  });
});
