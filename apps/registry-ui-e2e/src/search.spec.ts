import { expect, test } from '@playwright/test';

test('the command menu finds a heading and goes to it', async ({ page }) => {
  await page.goto('/docs');

  // The shortcut listens only once the page has hydrated, so it is pressed until the search opens.
  await expect(async () => {
    await page.keyboard.press('ControlOrMeta+k');
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await page.getByRole('combobox').fill('install');
  await page.getByRole('option', { name: 'Install an item' }).click();

  await expect(page).toHaveURL(/\/docs#install-an-item$/);
});
