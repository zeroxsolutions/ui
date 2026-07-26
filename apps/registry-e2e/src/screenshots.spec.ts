import { test, expect } from '@playwright/test';

/**
 * Visual capture for the redesigned docs - home landing + a detail page (light
 * + dark) - written under screenshots/ for human review. Real-browser only.
 */
test.describe('Registry visual capture', () => {
  test('home landing with hero decor', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { level: 1, name: '@zeroxsolutions/ui' }),
    ).toBeVisible();
    await page.waitForTimeout(600);
    await page.screenshot({ fullPage: true, path: 'screenshots/home-light.png' });
  });

  test('split-button detail page', async ({ page }) => {
    await page.goto('/components/split-button');
    await expect(
      page.getByRole('heading', { level: 1, name: 'SplitButton' }),
    ).toBeVisible();
    await page.screenshot({ fullPage: true, path: 'screenshots/detail-light.png' });
  });

  test('split-button detail page in dark mode', async ({ page }) => {
    await page.goto('/components/split-button');
    await page.locator('[data-slot="dark-mode-toggle"]').click();
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    await page.screenshot({ fullPage: true, path: 'screenshots/detail-dark.png' });
  });
});
