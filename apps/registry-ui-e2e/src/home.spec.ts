import { expect, test } from '@playwright/test';

test('/ says what the registry is and links to its components', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'ZeroXSolutions UI' })).toBeVisible();
  await page.getByRole('main').getByRole('link', { name: 'Browse components' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Components' })).toBeVisible();
});
