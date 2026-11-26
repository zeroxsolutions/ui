import { expect, test } from './test/fixtures';
import { hydrated } from './test/hydrated';

test.use({ colorScheme: 'dark' });

test('with a dark colour scheme and the app bundles blocked, a page loads dark', async ({ page }) => {
  // Nothing hydrates, so only the theme script inlined in the page can have set the theme.
  await page.route('**/_next/static/**/*.js', (route) => route.abort());
  await page.goto('/docs');

  await expect(page.locator('html')).toHaveClass(/\bdark\b/);
});

test('a click on the theme switch turns the page light', async ({ page }) => {
  await page.goto('/docs');
  const toggle = page.getByRole('button', { name: 'Toggle theme' });
  await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  await hydrated(toggle);

  await toggle.click();

  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
});
