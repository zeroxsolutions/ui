import { type Locator, type Page } from '@playwright/test';

import { expect, test } from './test/fixtures';

function platformSwitch(page: Page): Locator {
  return page.getByRole('navigation', { name: 'Platform' });
}

test('the switch goes to the same component on the other platform where it has one', async ({ page }) => {
  await page.goto('/docs/components/base/tab-bar');

  await platformSwitch(page).getByRole('link', { name: 'Native' }).click();

  await expect(page).toHaveURL('/native/components/nativewind/tab-bar');
  await expect(page.getByRole('heading', { level: 1, name: 'Tab bar', exact: true })).toBeVisible();
});

test('the switch on a home page lands on the other platform home page', async ({ page }) => {
  await page.goto('/');

  await platformSwitch(page).getByRole('link', { name: 'Native' }).click();

  await expect(page).toHaveURL('/native');
  await expect(page.getByRole('heading', { level: 1, name: /^Composed React Native components/ })).toBeVisible();

  await platformSwitch(page).getByRole('link', { name: 'Web' }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { level: 1, name: /^Composed React components/ })).toBeVisible();
});

test('the switch from a page the other platform lacks lands on that section index', async ({ page }) => {
  await page.goto('/native/components/nativewind/button');

  await platformSwitch(page).getByRole('link', { name: 'Web' }).click();

  await expect(page).toHaveURL('/docs/components/base');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  await page.goto('/docs/blocks/ai-provider-picker');
  await platformSwitch(page).getByRole('link', { name: 'Native' }).click();

  await expect(page).toHaveURL('/native/docs');
  await expect(page.getByRole('heading', { level: 1, name: 'Introduction' })).toBeVisible();
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
