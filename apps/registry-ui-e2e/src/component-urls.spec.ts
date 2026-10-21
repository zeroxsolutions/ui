import { expect, test } from './test/fixtures';

test('an old component, components index or blocks URL answers 301 with its page under the base', async ({
  request,
}) => {
  for (const [from, to] of [
    ['/docs/components/status-indicator', '/docs/components/base/status-indicator'],
    ['/docs/components', '/docs/components/base'],
    ['/blocks', '/blocks/base'],
  ]) {
    const response = await request.get(from, { maxRedirects: 0 });

    expect(response.status(), from).toBe(301);
    expect(new URL(response.headers()['location'] ?? '', 'http://localhost').pathname, from).toBe(to);
  }
});

test('the components index, a component and the blocks render under the base, and the header and sidebar link there', async ({
  page,
}) => {
  await page.goto('/docs/components/base');
  await expect(page.getByRole('heading', { level: 1, name: 'Components' })).toBeVisible();

  await page.goto('/docs/components/base/status-indicator');
  await expect(page.getByRole('heading', { level: 1, name: 'Status Indicator' })).toBeVisible();
  const header = page.getByRole('navigation', { name: 'Main' });
  await expect(header.getByRole('link', { name: 'Components', exact: true })).toHaveAttribute(
    'href',
    '/docs/components/base',
  );
  await expect(header.getByRole('link', { name: 'Blocks', exact: true })).toHaveAttribute('href', '/blocks/base');
  const sidebar = page.getByRole('navigation', { name: 'Docs' });
  await expect(sidebar.getByRole('link', { name: 'Status Indicator', exact: true })).toHaveAttribute(
    'href',
    '/docs/components/base/status-indicator',
  );
  await expect(sidebar.getByRole('link', { name: 'Tag Input', exact: true })).toHaveAttribute(
    'href',
    '/docs/components/base/tag-input',
  );

  await page.goto('/blocks/base');
  await expect(page.getByRole('heading', { level: 1, name: 'Blocks' })).toBeVisible();
});

test('a base the registry does not publish answers 404', async ({ page }) => {
  for (const path of ['/blocks/radix', '/docs/components/radix', '/docs/components/radix/status-indicator']) {
    const response = await page.goto(path);

    expect(response?.status(), path).toBe(404);
  }
});
