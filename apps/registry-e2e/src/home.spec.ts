import { test, expect } from '@playwright/test';

/** Root smoke: the registry index renders and links into a component preview. */
test('home renders and links to the button preview', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { level: 1, name: '@zeroxsolutions/ui registry' })
  ).toBeVisible();

  const previewLink = page.getByRole('link', { name: 'Button preview' });
  await expect(previewLink).toBeVisible();

  await previewLink.click();
  await expect(page).toHaveURL(/\/preview\/button\/?$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Button' })
  ).toBeVisible();
});
