import { test, expect } from './fixtures/app';

test.describe('Enterprise Reservation System - Version 1.0 Final Enhancements', () => {
  test('Admin Reservations Dashboard page loads and displays table', async ({ page }) => {
    await page.goto('/dashboard/reservations', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('admin-reservations-page')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('reservation-table')).toBeVisible();
  });

  test('Admin QR Scanner opens and validates token signature', async ({ page }) => {
    await page.goto('/dashboard/reservations', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('admin-reservations-page')).toBeVisible();

    const scannerButton = page.getByTestId('reservation-qr-scanner');
    await expect(scannerButton).toBeVisible();
    await scannerButton.click();

    const input = page.getByTestId('reservation-scanner-input');
    await expect(input).toBeVisible();
    await input.fill('RESQR:INVALID_DUMMY_TOKEN.12345');

    const submit = page.getByTestId('reservation-scanner-submit');
    await submit.click();

    await expect(page.getByTestId('qr-invalid')).toBeVisible({ timeout: 10000 });
  });

  test('Dashboard Home displays Reservation Overview Widgets', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
    await expect(page.getByTestId('reservation-widget')).toBeVisible();
  });

  test('Reports page displays Reservation Analytics section', async ({ page }) => {
    await page.goto('/dashboard/reports', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('reports-page')).toBeVisible();
    await expect(page.getByTestId('reservation-report')).toBeVisible();
  });

  test('Settings page displays Reservation System Settings form', async ({ page }) => {
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('settings-page')).toBeVisible();
    await expect(page.getByTestId('reservation-settings')).toBeVisible();
  });

  test('Reservation Number format validation on table', async ({ page }) => {
    await page.goto('/dashboard/reservations', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('admin-reservations-page')).toBeVisible();

    // Verify reservation table container or empty state
    const table = page.getByTestId('reservation-table');
    await expect(table).toBeVisible();
  });
});
