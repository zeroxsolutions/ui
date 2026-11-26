import { type Page } from '@playwright/test';

import { expect, test } from './test/fixtures';
import { hydrated } from './test/hydrated';

/** Opens the command menu from its shortcut, which listens once the header's search trigger has hydrated. */
async function openSearch(page: Page): Promise<void> {
  await hydrated(page.getByRole('button', { name: 'Search documentation' }).first());
  await page.keyboard.press('ControlOrMeta+k');
  await expect(page.getByRole('dialog')).toBeVisible();
}

// The editor zone answers `/docs/editor/api/search`, which the menu asks beside this app's own; no zone runs
// under this project, so that request is answered with an empty index.
test.beforeEach(async ({ page }) => {
  await page.route('**/docs/editor/api/search', (route) => route.fulfill({ json: [] }));
});

test('the command menu finds a page and goes to it', async ({ page }) => {
  await page.goto('/docs');

  await openSearch(page);
  await page.getByRole('combobox').fill('status');
  // The page list filters to the page by its title, and the index's own hit for that page is dropped, so it is listed once.
  const option = page.getByRole('option', { name: 'Status Indicator', exact: true });
  await expect(option).toHaveCount(1);
  await option.click();

  await expect(page).toHaveURL(/\/docs\/components\/base\/status-indicator$/);
});

test('the command menu logs no error while it is opened, arrowed through and typed in', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/docs');

  await openSearch(page);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.getByRole('combobox').fill('status');
  await expect(page.getByRole('group', { name: 'Search results' })).toBeVisible();

  expect(errors).toEqual([]);
});

test.describe('on a phone-width header', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the icon-only search trigger opens the command menu', async ({ page }) => {
    await page.goto('/docs');

    const trigger = page.getByRole('button', { name: 'Search documentation' }).filter({ visible: true });
    await hydrated(trigger);
    await trigger.click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});

test.describe('the index is split by platform', () => {
  test("a web page's search leaves the native pages' text out", async ({ page }) => {
    await page.goto('/docs');

    await openSearch(page);
    // A hit first, so the index has loaded before the absence below is read.
    await page.getByRole('combobox').fill('status');
    const results = page.getByRole('group', { name: 'Search results' });
    await expect(results).toBeVisible();
    await page.getByRole('combobox').fill('nativeID');

    await expect(results).toHaveCount(0);
  });
});
