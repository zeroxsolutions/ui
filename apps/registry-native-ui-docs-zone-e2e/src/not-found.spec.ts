import { expect, test } from './test/fixtures';

test('an unknown native path answers 404 with the not-found page', async ({ page }) => {
  const response = await page.goto('/native/components/nativewind/nope');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Go to the native docs' })).toHaveAttribute('href', '/native/docs');
});
