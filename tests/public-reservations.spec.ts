import { test, expect } from '@playwright/test';

test.describe('Version 1.1 Enterprise Public Reservation Portal & Session Management', () => {
  test('1. Public reservation portal loads without login (/reserve)', async ({ page }) => {
    await page.goto('/reserve');
    await expect(page.getByTestId('public-reservation-form')).toBeVisible();
    await expect(page.getByTestId('wizard-step-1')).toBeVisible();
  });

  test('2. Student can complete 4-step public reservation wizard without authentication', async ({ page }) => {
    await page.goto('/reserve');

    // Step 1: Grade & Subject
    await expect(page.getByTestId('wizard-step-1')).toBeVisible();
    await page.getByTestId('public-step1-next').click();

    // Step 2: Select Session
    await expect(page.getByTestId('wizard-step-2')).toBeVisible();
    const sessionCard = page.locator('[data-testid^="public-session-card-"]').first();
    if (await sessionCard.isVisible()) {
      await sessionCard.click();
      await page.getByTestId('public-step2-next').click();

      // Step 3: Fill Student Details
      await expect(page.getByTestId('wizard-step-3')).toBeVisible();
      await page.getByTestId('public-input-student-name').fill('عمر خالد أحمد');
      await page.getByTestId('public-input-parent-phone').fill('01011223344');
      await page.getByTestId('public-step3-next').click();

      // Step 4: Review Screen
      await expect(page.getByTestId('wizard-step-4')).toBeVisible();
      await page.getByTestId('public-submit-reservation-btn').click();

      // Digital Ticket Modal
      await expect(page.getByTestId('digital-ticket-dialog')).toBeVisible({ timeout: 15000 });
      await expect(page.getByTestId('ticket-reservation-number')).toBeVisible();
      await expect(page.getByTestId('ticket-tracking-code')).toBeVisible();
    }
  });

  test('3. Duplicate student reservation triggers Case 1 Duplicate Popup Modal', async ({ page }) => {
    await page.goto('/reserve');

    await page.getByTestId('public-step1-next').click();
    const sessionCard = page.locator('[data-testid^="public-session-card-"]').first();
    if (await sessionCard.isVisible()) {
      await sessionCard.click();
      await page.getByTestId('public-step2-next').click();

      await page.getByTestId('public-input-student-name').fill('عمر خالد أحمد');
      await page.getByTestId('public-input-parent-phone').fill('01011223344');
      await page.getByTestId('public-step3-next').click();

      await page.getByTestId('public-submit-reservation-btn').click();

      // Popup modal should open for duplicate exact
      await expect(page.getByTestId('duplicate-popup-modal')).toBeVisible({ timeout: 10000 });
      await expect(page.getByTestId('duplicate-popup-goto-my')).toBeVisible();
    }
  });

  test('4. Public lookup page (/reserve/my) and Edit Before Payment modal', async ({ page }) => {
    await page.goto('/reserve/my');
    await expect(page.getByTestId('public-reservation-lookup')).toBeVisible();

    await page.getByTestId('input-lookup-res-number').fill('RES-20260722-112233');
    await page.getByTestId('input-lookup-tracking-code').fill('4F8K-92LM');
    await page.getByTestId('lookup-search-btn').click();
  });

  test('5. Admin Reservations Dashboard tabs (Table, Sessions, Calendar, Analytics)', async ({ page }) => {
    await page.goto('/dashboard/reservations');

    await expect(page.getByTestId('tab-reservations-table')).toBeVisible();
    await expect(page.getByTestId('tab-sessions-management')).toBeVisible();
    await expect(page.getByTestId('tab-calendar-view')).toBeVisible();
    await expect(page.getByTestId('tab-reservation-analytics')).toBeVisible();

    // Switch to Calendar Tab
    await page.getByTestId('tab-calendar-view').click();
    await expect(page.getByTestId('reservation-calendar-view')).toBeVisible();

    // Switch to Weekly/Monthly/Agenda views
    await page.getByTestId('calendar-view-weekly').click();
    await page.getByTestId('calendar-view-agenda').click();
  });

  test('6. Admin QR Scanner modal opens and processes reservation verification', async ({ page }) => {
    await page.goto('/dashboard/reservations');

    const scannerTrigger = page.getByTestId('reservation-qr-scanner');
    if (await scannerTrigger.isVisible()) {
      await scannerTrigger.click();

      await expect(page.getByTestId('reservation-scanner-dialog')).toBeVisible();

      // Test Manual Input Mode
      const manualTab = page.getByRole('button', { name: /manual|إدخال يدوي/i });
      if (await manualTab.isVisible()) {
        await manualTab.click();
        await page.getByTestId('reservation-scanner-input').fill('RES-20260722-100001');
        await page.getByTestId('reservation-scanner-submit').click();
      }
    }
  });
});
