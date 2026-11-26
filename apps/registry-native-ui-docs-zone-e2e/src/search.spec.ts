import { expect, test } from './test/fixtures';
import { hydrated } from './test/hydrated';

test("a native page's search finds native text and keeps the page's engine", async ({ page }) => {
  await page.goto('/native/components/uniwind/button');

  await hydrated(page.getByRole('button', { name: 'Search documentation' }).first());
  await page.keyboard.press('ControlOrMeta+k');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('combobox').fill('nativeID');
  const results = page.getByRole('group', { name: 'Search results' });
  await expect(results.getByRole('option').first()).toBeVisible();
  await results.getByRole('option').first().click();

  await expect(page).toHaveURL(/\/native\/components\/uniwind\/[a-z-]+(#.*)?$/);
});
