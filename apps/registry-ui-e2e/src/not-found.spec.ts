import { expect, test } from '@playwright/test';

test('an unknown docs path answers 404 with the not-found page', async ({ page }) => {
  const response = await page.goto('/docs/components/nope');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Go to the docs' })).toHaveAttribute('href', '/docs');
});
