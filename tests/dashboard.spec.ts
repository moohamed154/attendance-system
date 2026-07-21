/**
 * dashboard.spec.ts — Navigation & Rendering
 *
 * Uses pre-loaded storageState (admin session) from auth-setup.
 * Each test navigates directly to the target URL without needing to log in.
 */
import { test, expect } from './fixtures/app';

const pages = [
  { name: 'Dashboard',  url: '/dashboard',            testId: 'dashboard-page' },
  { name: 'Sessions',   url: '/dashboard/sessions',   testId: null },
  { name: 'Payments',   url: '/dashboard/payments',   testId: 'payments-page' },
  { name: 'Reports',    url: '/dashboard/reports',    testId: 'reports-page' },
  { name: 'Settings',   url: '/dashboard/settings',   testId: 'settings-page' },
];

/**
 * Navigate to a URL with automatic retry if the error boundary shows up.
 * This handles intermittent Neon DB connection failures (P1001).
 */
async function gotoWithRetry(page: any, url: string, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const errorBoundary = page.locator('text=Something went wrong');
    const isErrorPage = await errorBoundary.isVisible({ timeout: 3000 }).catch(() => false);

    if (!isErrorPage) return; // success

    // Retry by clicking "Try again" or just re-navigating
    const tryAgain = page.locator('button:has-text("Try again"), button:has-text("Reload page")');
    if (await tryAgain.isVisible({ timeout: 1000 }).catch(() => false)) {
      await tryAgain.click();
      await page.waitForTimeout(1000);
    } else {
      await page.waitForTimeout(1500);
    }
  }
}

test.describe('Navigation & Rendering', () => {
  for (const p of pages) {
    test(`${p.name} loads and renders without error`, async ({ page }) => {
      await gotoWithRetry(page, p.url);

      if (p.testId) {
        await expect(page.getByTestId(p.testId)).toBeVisible({ timeout: 20000 });
      } else {
        await expect(page).toHaveURL(new RegExp(p.url.replace(/\//g, '\\/')));
        await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
      }

      // Must not show React error boundary
      await expect(page.locator('text=Something went wrong')).not.toBeVisible();
    });
  }
});
