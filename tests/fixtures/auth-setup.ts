/**
 * auth-setup.ts
 * Playwright "setup" test that logs in once and saves the session cookie.
 * All other projects depend on this via playwright.config.ts `dependencies`.
 */
import { test as setup, expect } from '@playwright/test';
import * as path from 'path';

const authFile = path.join(__dirname, '../../.auth/admin.json');

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('username-input').fill('admin_e2e');
  await page.getByTestId('password-input').fill('admin_pass_123');
  await page.getByTestId('login-button').click();
  // Wait for redirect to dashboard
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
  // Persist cookies + localStorage to disk
  await page.context().storageState({ path: authFile });
});
