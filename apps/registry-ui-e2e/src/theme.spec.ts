import { expect, test } from '@playwright/test';

/** `--background` under `.dark`, `oklch(0.145 0 0)` in the stylesheet, which the build compiles to `lab()`. */
const DARK_BACKGROUND = 'lab(2.75381 0 0)';

test.use({ colorScheme: 'dark' });

test('with a dark colour scheme and the app bundles blocked, a page loads dark', async ({ page }) => {
  // Nothing hydrates, so only the theme script inlined in the page can have set the theme.
  await page.route('**/_next/static/**/*.js', (route) => route.abort());
  await page.goto('/docs');

  await expect(page.getByRole('banner')).toHaveCSS('background-color', DARK_BACKGROUND);
});
