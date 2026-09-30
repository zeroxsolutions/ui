import { expect, test } from '@playwright/test';

test.use({ colorScheme: 'dark' });

test('with a dark colour scheme and the app bundles blocked, a page loads dark', async ({ page }) => {
  // Nothing hydrates, so only the theme script inlined in the page can have set the theme.
  await page.route('**/_next/static/**/*.js', (route) => route.abort());
  await page.goto('/docs');

  await expect(page.locator('html')).toHaveClass(/\bdark\b/);
});

test('a click on the theme switch turns the page light, and leaves no focus ring on the switch', async ({ page }) => {
  await page.goto('/docs');
  const toggle = page.getByRole('button', { name: 'Toggle theme' });

  // The switch listens only once the page has hydrated, so it is clicked until the theme changes.
  await expect(async () => {
    await toggle.click();
    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/, { timeout: 1_000 });
  }).toPass();
  // The ring is keyboard focus's; a pointer that clicked and moved on leaves the switch as it was drawn.
  await page.mouse.move(0, 0);

  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveCSS('box-shadow', 'none');
});
