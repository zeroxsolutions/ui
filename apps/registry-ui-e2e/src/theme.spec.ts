import { expect, test } from '@playwright/test';

test.use({ colorScheme: 'dark' });

test('with a dark colour scheme and the app bundles blocked, a page loads dark', async ({ page }) => {
  // Nothing hydrates, so only the theme script inlined in the page can have set the theme.
  await page.route('**/_next/static/**/*.js', (route) => route.abort());
  await page.goto('/docs');

  await expect(page.locator('html')).toHaveClass(/\bdark\b/);
});
