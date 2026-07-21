/**
 * visual.spec.ts — Visual Regression Suite
 *
 * Uses pre-loaded storageState (admin session) from auth-setup.
 * Navigates directly to each page without login in beforeEach.
 */
import { test, expect } from './fixtures/app';

const pagesToSnapshot = [
  { name: 'Login',      url: '/login' },
  { name: 'Dashboard',  url: '/dashboard' },
  { name: 'Students',   url: '/dashboard/students' },
  { name: 'Attendance', url: '/dashboard/attendance' },
  { name: 'Payments',   url: '/dashboard/payments' },
  { name: 'Reports',    url: '/dashboard/reports' },
  { name: 'Settings',   url: '/dashboard/settings' },
];

test.describe('Visual Regression Suite', () => {
  for (const pageInfo of pagesToSnapshot) {
    test(`Visual regression baseline for ${pageInfo.name}`, async ({ page }) => {
      // Navigate directly — session cookie is pre-loaded via storageState
      await page.goto(pageInfo.url, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toBeVisible();

      // Short settle time for fonts/images
      await page.waitForTimeout(1000);

      // Hide dynamic content (dates, animations) for deterministic screenshot
      await page.evaluate(() => {
        const dynamicElements = document.querySelectorAll('.animate-pulse, time, [data-dynamic="true"]');
        dynamicElements.forEach((el) => {
          (el as HTMLElement).style.visibility = 'hidden';
        });
      });

      await expect(page).toHaveScreenshot(`${pageInfo.name.toLowerCase()}-baseline.png`, {
        maxDiffPixelRatio: 0.15, // 15% tolerance for minor rendering differences
      });
    });
  }
});
