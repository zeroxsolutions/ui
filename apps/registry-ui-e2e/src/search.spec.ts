import { expect, test } from '@playwright/test';

test('the command menu finds a page and goes to it', async ({ page }) => {
  await page.goto('/docs');

  // The shortcut listens only once the page has hydrated, so it is pressed until the search opens.
  await expect(async () => {
    await page.keyboard.press('ControlOrMeta+k');
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await page.getByRole('combobox').fill('status');
  // The page list filters to the page by its title, and the index's own hit for that page is dropped, so it is listed once.
  const option = page.getByRole('option', { name: 'Status Indicator', exact: true });
  await expect(option).toHaveCount(1);
  await option.click();

  await expect(page).toHaveURL(/\/docs\/components\/status-indicator$/);
});

test('the command menu logs no error while it is opened, arrowed through and typed in', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/docs');

  await expect(async () => {
    await page.keyboard.press('ControlOrMeta+k');
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.getByRole('combobox').fill('status');
  await expect(page.getByRole('group', { name: 'Search results' })).toBeVisible();

  expect(errors).toEqual([]);
});

test.describe('on a phone-width header', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the icon-only search trigger opens the command menu', async ({ page }) => {
    await page.goto('/docs');

    // The trigger listens only once the page has hydrated, so it is clicked until the search opens.
    await expect(async () => {
      await page.getByRole('button', { name: 'Search documentation' }).filter({ visible: true }).click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 1_000 });
    }).toPass();
  });
});
