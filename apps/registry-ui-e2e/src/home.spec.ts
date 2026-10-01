import { expect, test } from '@playwright/test';

test('/ says what the registry is and links to its components', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'ZeroXSolutions UI' })).toBeVisible();
  await page.getByRole('main').getByRole('link', { name: 'Browse components' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Components' })).toBeVisible();
});

test('the site carries its logo: the header link home, and the icons', async ({ page, request }) => {
  await page.goto('/docs');
  const home = page.getByRole('banner').getByRole('link', { name: 'ZeroXSolutions UI' });
  await expect(home).toBeVisible();
  await home.click();
  await expect(page).toHaveURL(/\/$/);

  const icon = await request.get('/icon.svg');
  expect(icon.ok()).toBe(true);
  const svg = await icon.text();
  expect(svg).toContain('prefers-color-scheme: dark');
  expect(svg.match(/<rect /g)).toHaveLength(6);
  expect((await request.get('/favicon.ico')).ok()).toBe(true);
  expect((await request.get('/apple-icon.png')).ok()).toBe(true);
});
