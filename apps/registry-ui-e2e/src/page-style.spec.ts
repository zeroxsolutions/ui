import { expect, test } from './test/fixtures';
import { waitForHydration } from './test/hydrated';

test('a web page is drawn in the style its URL names, the popups it opens included', async ({ page }) => {
  await page.goto('/docs/components/base/collapsible-card?style=vega');

  await expect(page.locator('html')).toHaveClass(/\bstyle-vega\b/);
  await expect(page.locator('html')).not.toHaveClass(/\bstyle-nova\b/);
  // Vega's card spacing is 6, so the header sits one step in at 5.
  const header = page.locator('[data-slot="collapsible-card-header"]').first();
  await expect(header).toHaveCSS('padding-left', '20px');

  await waitForHydration(page);
  await page.getByRole('button', { name: /^Style/ }).click();
  // Vega's menus are rounded-md, 8px under the theme's radius; Nova's rounded-lg is 10px.
  await expect(page.locator('[data-slot="dropdown-menu-content"]')).toHaveCSS('border-top-left-radius', '8px');
});

test('a page with no style in its URL is drawn in the one last picked, from its first paint', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('zui:style:web', 'lyra'));
  await page.goto('/docs/components/base/collapsible-card', { waitUntil: 'commit' });

  await expect(page.locator('html')).toHaveClass(/\bstyle-lyra\b/);
  await expect(page.locator('[data-slot="collapsible-card"]').first()).toHaveCSS('border-top-left-radius', '0px');
});

test("picking a style redraws the page and the item's source in it", async ({ page }) => {
  await page.goto('/docs/components/base/tree-item');
  await expect(page.locator('html')).toHaveClass(/\bstyle-nova\b/);

  await waitForHydration(page);
  await page.getByRole('button', { name: /^Style/ }).click();
  await page.getByRole('menuitem', { name: 'Lyra' }).click();

  await expect(page.locator('html')).toHaveClass(/\bstyle-lyra\b/);
  await page.getByRole('tab', { name: 'Manual' }).first().click();
  await expect(page.getByRole('main')).toContainText('min-h-8 rounded-none text-xs');
});
