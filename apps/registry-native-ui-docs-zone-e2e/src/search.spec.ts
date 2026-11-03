import { expect, test } from './test/fixtures';

test("a native page's search finds native text and keeps the page's engine", async ({ page }) => {
  await page.goto('/native/components/uniwind/button');

  // The shortcut listens only once the page has hydrated, so it is pressed until the search opens.
  await expect(async () => {
    await page.keyboard.press('ControlOrMeta+k');
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await page.getByRole('combobox').fill('nativeID');
  const results = page.getByRole('group', { name: 'Search results' });
  await expect(results.getByRole('option').first()).toBeVisible();
  await results.getByRole('option').first().click();

  await expect(page).toHaveURL(/\/native\/components\/uniwind\/[a-z-]+(#.*)?$/);
});
