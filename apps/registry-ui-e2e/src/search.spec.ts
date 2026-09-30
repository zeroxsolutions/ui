import { expect, test } from '@playwright/test';

test('the command menu finds a page and goes to it', async ({ page }) => {
  await page.goto('/docs');

  // The shortcut listens only once the page has hydrated, so it is pressed until the search opens.
  await expect(async () => {
    await page.keyboard.press('ControlOrMeta+k');
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await page.getByRole('combobox').fill('status');
  await page.getByRole('option', { name: 'Status Indicator', exact: true }).click();

  await expect(page).toHaveURL(/\/docs\/components\/status-indicator$/);
});

test.describe('on a phone-width header', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the icon-only search trigger opens the command menu', async ({ page }) => {
    await page.goto('/docs');

    // The trigger listens only once the page has hydrated, so it is clicked until the search opens.
    await expect(async () => {
      await page.getByRole('button', { name: 'Search docs', exact: true }).click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 1_000 });
    }).toPass();
  });
});
