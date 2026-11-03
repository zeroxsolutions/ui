import { expect, test } from './test/fixtures';

test('a page the web docs lack answers 404 with its section index', async ({ page }) => {
  // The native switch links here from the native button, which the web documents as a primitive only.
  let response = await page.goto('/docs/components/base/button');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Components' }).getByRole('link', { name: 'Status Indicator', exact: true }),
  ).toHaveAttribute('href', '/docs/components/base/status-indicator');

  response = await page.goto('/docs/nope');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Docs' }).getByRole('link', { name: 'Installation', exact: true }),
  ).toHaveAttribute('href', '/docs/installation');

  response = await page.goto('/nope');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Go to the docs' })).toHaveAttribute('href', '/docs');
});
