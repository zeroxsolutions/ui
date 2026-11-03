import { type Locator, type Page } from '@playwright/test';

import { expect, test } from './test/fixtures';

function platformSwitch(page: Page): Locator {
  return page.getByRole('navigation', { name: 'Platform' });
}

test('the switch points at the same place on native, which the native zone answers, its 404 included', async ({
  page,
}) => {
  for (const [path, native] of [
    ['/', '/native'],
    ['/docs', '/native/docs'],
    ['/docs/components/base/tab-bar', '/native/components/nativewind/tab-bar'],
    // The native tree has no copy button; the native zone's 404 lists its components.
    ['/docs/components/base/copy-button', '/native/components/nativewind/copy-button'],
    ['/blocks/base', '/native/blocks/nativewind'],
  ]) {
    await page.goto(path);

    await expect(platformSwitch(page).getByRole('link', { name: 'Native' }), path).toHaveAttribute('href', native);
    await expect(platformSwitch(page).getByRole('link', { name: 'Web' }), path).toHaveAttribute('aria-current', 'page');
  }
});
