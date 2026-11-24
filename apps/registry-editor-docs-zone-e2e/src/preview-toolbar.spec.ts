import { type Page } from '@playwright/test';

import { expect, test } from './test/fixtures';
import { waitForHydration } from './test/hydrated';

const DEMO = 'email-editor-demo';

/** Opens the email editor's page in the light theme and waits for it to hydrate. */
async function openPreview(page: Page): Promise<void> {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/docs/editor/email-editor');
  await waitForHydration(page);
}

/** The toggle named `name` in the first preview's `group`. */
function toggle(page: Page, group: 'Device' | 'Theme', name: string) {
  return page.getByRole('group', { name: group }).first().getByRole('button', { name, exact: true });
}

test('a preview draws its demo inline at the desktop width in the site theme', async ({ page }) => {
  test.setTimeout(90_000);
  await openPreview(page);

  await expect(toggle(page, 'Device', 'Desktop')).toHaveAttribute('aria-pressed', 'true');
  await expect(toggle(page, 'Theme', 'Light')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('textbox', { name: 'Email body' })).toBeVisible();
  await expect(page.locator('iframe[data-slot=block-frame]')).toHaveCount(0);
});

for (const [device, width] of [
  ['Tablet', 768],
  ['Mobile', 375],
] as const) {
  test(`${device} frames the demo's page ${width}px wide, as tall as the demo`, async ({ page }) => {
    test.setTimeout(90_000);
    await openPreview(page);

    await toggle(page, 'Device', device).click();

    const frame = page.getByTitle(`${DEMO}, ${device.toLowerCase()}, light`);
    await expect(frame).toBeVisible();
    await expect(frame.contentFrame().getByRole('textbox', { name: 'Email body' })).toBeVisible();
    expect((await frame.boundingBox())?.width).toBe(width);
    const demo = frame.contentFrame().locator('[data-slot=example-view]');
    await expect
      .poll(async () => ((await frame.boundingBox())?.height ?? 0) - Math.ceil((await demo.boundingBox())?.height ?? 0))
      .toBe(0);
  });
}

test("Dark frames the demo in the dark theme, leaving the page's theme and its stored choice", async ({ page }) => {
  test.setTimeout(90_000);
  await openPreview(page);

  await toggle(page, 'Theme', 'Dark').click();

  const frame = page.getByTitle(`${DEMO}, desktop, dark`);
  await expect(frame.contentFrame().locator('html')).toHaveClass(/(^|\s)dark(\s|$)/);
  await expect(frame.contentFrame().getByRole('textbox', { name: 'Email body' })).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/(^|\s)light(\s|$)/);
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull();

  await toggle(page, 'Theme', 'Light').click();
  await expect(page.locator('iframe[data-slot=block-frame]')).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'Email body' })).toBeVisible();
});
