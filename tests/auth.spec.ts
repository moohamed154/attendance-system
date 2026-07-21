/**
 * auth.spec.ts — Authentication Flows
 *
 * These tests use empty storageState to exercise the full login flow.
 */
import { test, expect } from './fixtures/app';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication Flows', () => {

  test('Admin can login successfully', async ({ loginPage, page }) => {
    await loginPage.navigate();
    await loginPage.login('admin_e2e', 'admin_pass_123');
    await loginPage.verifySuccess();
    // dashboard-page div renders after server data loads — allow up to 20s
    await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 20000 });
  });

  test('Assistant can login successfully', async ({ loginPage }) => {
    await loginPage.navigate();
    await loginPage.login('assistant_e2e', 'assist_pass_123');
    await loginPage.verifySuccess();
  });

  test('Invalid credentials show error message', async ({ loginPage }) => {
    await loginPage.navigate();
    await loginPage.login('wrong_user', 'wrong_pass');
    await loginPage.verifyError();
  });

  test('Session persists across navigations', async ({ loginPage, page }) => {
    await loginPage.navigate();
    await loginPage.login('admin_e2e', 'admin_pass_123');
    await loginPage.verifySuccess();

    // Reload and confirm session cookie survives
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('Logout redirects to login', async ({ loginPage, page, isMobile }) => {
    if (isMobile) test.skip();
    await loginPage.navigate();
    await loginPage.login('admin_e2e', 'admin_pass_123');
    await loginPage.verifySuccess();

    // Click logout button in sidebar
    await page.getByTestId('logout-button').click();
    await expect(page).toHaveURL(/\/login/);
  });
});
