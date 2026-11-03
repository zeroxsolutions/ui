import { type Locator, type Page } from '@playwright/test';

import { expect, test } from './test/fixtures';

function platformSwitch(page: Page): Locator {
  return page.getByRole('navigation', { name: 'Platform' });
}

test("the switch points at the same page on the web, which the web's zone answers", async ({ page }) => {
  for (const [path, web] of [
    ['/native', '/'],
    ['/native/docs', '/docs'],
    ['/native/components/nativewind/tab-bar', '/docs/components/base/tab-bar'],
  ]) {
    await page.goto(path);

    await expect(platformSwitch(page).getByRole('link', { name: 'Web' }), path).toHaveAttribute('href', web);
    await expect(platformSwitch(page).getByRole('link', { name: 'Native' }), path).toHaveAttribute(
      'aria-current',
      'page',
    );
  }
});

test("the header's sections point into the native tree, and the engine tabs under the title move the page", async ({
  page,
}) => {
  await page.goto('/native/components/nativewind/button');
  const main = page.getByRole('navigation', { name: 'Main' });
  await expect(main.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/native/docs');
  await expect(main.getByRole('link', { name: 'Blocks' })).toHaveAttribute('href', '/native/blocks/nativewind');

  await page
    .getByRole('main')
    .getByRole('navigation', { name: 'Engine' })
    .getByRole('link', { name: 'Uniwind' })
    .click();

  await expect(page).toHaveURL('/native/components/uniwind/button');
  await expect(main.getByRole('link', { name: 'Components' })).toHaveAttribute('href', '/native/components/uniwind');
});

test('a native docs page opens its engine tabs on the engine last read', async ({ page }) => {
  await page.goto('/native/components/uniwind/button');
  // The page remembers its engine once it has hydrated, which a reader who stays to read it waits for.
  await expect.poll(() => page.evaluate("localStorage.getItem('zui:native-engine')")).toBe('uniwind');

  await page.goto('/native/docs/installation');

  await expect(page.getByRole('tab', { name: 'Uniwind' }).first()).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText('npx uniwind generate-artifacts --css ./global.css')).toBeVisible();
});
