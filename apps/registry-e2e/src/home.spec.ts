import { test, expect } from '@playwright/test';

/**
 * Home is a real landing page now (no redirect): a hero over the animated
 * backdrop, a featured grid, and the ecosystem sections, all under the top-nav.
 * No left sidebar.
 */
test('home is a landing page with hero + top-nav (no redirect, no sidebar)', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/$/);

  await expect(
    page.getByRole('heading', { level: 1, name: '@zeroxsolutions/ui' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: /Browse components/ }),
  ).toBeVisible();

  await expect(page.locator('[data-slot="site-header"]')).toBeVisible();
  await expect(page.locator('[data-slot="sidebar"]')).toHaveCount(0);

  await expect(
    page.getByRole('heading', { level: 2, name: 'Featured' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Ecosystem' }),
  ).toBeVisible();
});
