import { type Page } from '@playwright/test';

import { expect, test } from './test/fixtures';
import { waitForHydration } from './test/hydrated';

function picker(page: Page) {
  return page.getByRole('button', { name: /^Style/ });
}

test('a web page opens in the style its URL names', async ({ page }) => {
  await page.goto('/docs/components/base/collapsible-card?style=vega');
  // The page's inline script names the style before it hydrates; the picker keeps naming it once it has.
  await waitForHydration(page);

  await expect(picker(page)).toHaveAccessibleName('Style Vega');
});

test('a page with no style in its URL opens in the one last picked', async ({ page }) => {
  // As text, since the spec compiles without the DOM's types; it runs in the page before its own scripts.
  await page.addInitScript("localStorage.setItem('zui:style:web', 'lyra')");
  await page.goto('/docs/components/base/collapsible-card');
  await waitForHydration(page);

  await expect(picker(page)).toHaveAccessibleName('Style Lyra');
});

test("picking a style redraws the item's source in it", async ({ page }) => {
  await page.goto('/docs/components/base/tree-item');
  await waitForHydration(page);
  const manual = page.getByRole('tab', { name: 'Manual' }).first();
  const source = page.getByRole('tabpanel', { name: 'Manual' }).first();
  await manual.click();
  const inNova = (await source.textContent()) ?? '';
  expect(inNova).toContain('function TreeItem');

  await picker(page).click();
  await page.getByRole('menuitem', { name: 'Lyra' }).click();

  await expect(picker(page)).toHaveAccessibleName('Style Lyra');
  await manual.click();
  await expect(source).toContainText('function TreeItem');
  await expect(source).not.toHaveText(inNova);
});
