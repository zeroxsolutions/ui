import { expect, test } from './test/fixtures';

const PAGE = '/docs/components/base/code-input';

test('a code input fills its slots as the code is typed, the next slot active', async ({ page }) => {
  await page.goto(PAGE);
  const code = page.getByLabel('Verification code');
  const slots = page.locator('[data-slot=code-input-slot]');

  // The slots follow the input only once the page has hydrated, so the first digit is typed until one lands.
  await expect(async () => {
    await code.fill('');
    await code.pressSequentially('4');
    await expect(slots.nth(0)).toHaveText('4', { timeout: 1_000 });
  }).toPass();
  await code.pressSequentially('82');

  await expect(slots).toHaveText(['4', '8', '2', '', '', '']);
  await expect(slots.nth(3)).toHaveAttribute('data-active', 'true');
  await expect(slots.nth(2)).toHaveAttribute('data-active', 'false');
  await expect(page.getByRole('button', { name: 'Verify' })).toBeDisabled();

  await code.pressSequentially('913');
  await expect(slots).toHaveText(['4', '8', '2', '9', '1', '3']);
  await expect(page.getByRole('button', { name: 'Verify' })).toBeEnabled();
});

test('a code input fills every slot from one paste', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'only Chromium grants a page clipboard access under Playwright');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(PAGE);
  const code = page.getByLabel('Verification code');
  const slots = page.locator('[data-slot=code-input-slot]');

  await page.evaluate("navigator.clipboard.writeText('482913')");
  await expect(async () => {
    await code.fill('');
    await code.press('ControlOrMeta+V');
    await expect(slots).toHaveText(['4', '8', '2', '9', '1', '3'], { timeout: 1_000 });
  }).toPass();
});
