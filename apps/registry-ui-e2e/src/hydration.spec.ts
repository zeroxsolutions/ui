import { expect, test } from './test/fixtures';

// A page is rendered once at build, with no query, so a page opened with `?style=` is where what the
// browser reads first differs from what the server drew.
const PAGES = [
  '/native/components/nativewind/button?style=nova',
  '/native/docs?style=nova',
  '/docs/installation?style=luma',
];

// React names a mismatch in full in development and only by its number, 418 or 425, in production.
const HYDRATION_ERROR = /hydrat|Minified React error #4(18|25)/i;

for (const path of PAGES) {
  test(`${path} hydrates without a mismatch`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto(path);
    // The header's picker opens its menu only once the page has hydrated, so a menu shown means hydration ran.
    await expect(async () => {
      await page.getByRole('button', { name: /^Style/ }).click();
      await expect(page.getByRole('menu')).toBeVisible({ timeout: 1_000 });
    }).toPass();

    expect(errors.filter((error) => HYDRATION_ERROR.test(error))).toEqual([]);
  });
}
