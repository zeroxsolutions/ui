import { expect, test } from './test/fixtures';

test('a page the native tree lacks answers 404 with its section index', async ({ page }) => {
  // The web switch links to the same slug on native, which a web item not ported yet lacks.
  let response = await page.goto('/native/components/nativewind/no-such-component');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
  const components = page.getByRole('region', { name: 'Components' });
  await expect(components.getByRole('link', { name: 'Button', exact: true })).toHaveAttribute(
    'href',
    '/native/components/nativewind/button',
  );

  response = await page.goto('/native/docs/blocks/ai-provider-picker');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Docs' }).getByRole('link', { name: 'Installation', exact: true }),
  ).toHaveAttribute('href', '/native/docs/installation');

  response = await page.goto('/native/nope');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Go to the native docs' })).toHaveAttribute('href', '/native/docs');
});
