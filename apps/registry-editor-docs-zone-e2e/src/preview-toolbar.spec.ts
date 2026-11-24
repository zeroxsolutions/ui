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

/** The first preview's toggle for the device named `name`. */
function device(page: Page, name: string) {
  return page.getByRole('group', { name: 'Device' }).first().getByRole('button', { name, exact: true });
}

/** The first preview's theme toggle, pressed while its demo is dark. */
function darkTheme(page: Page) {
  return page.getByRole('button', { name: 'Toggle preview theme' }).first();
}

test('a preview draws its demo inline at the desktop width in the site theme', async ({ page }) => {
  test.setTimeout(90_000);
  await openPreview(page);

  await expect(device(page, 'Desktop')).toHaveAttribute('aria-pressed', 'true');
  await expect(darkTheme(page)).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('textbox', { name: 'Email body' })).toBeVisible();
  await expect(page.locator('iframe[data-slot=block-frame]')).toHaveCount(0);
});

for (const [name, width] of [
  ['Tablet', 768],
  ['Mobile', 375],
] as const) {
  test(`${name} frames the demo's page in a ${width}px wide window as tall as the demo, edged by a border`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await openPreview(page);

    await device(page, name).click();

    const frame = page.getByTitle(`${DEMO}, ${name.toLowerCase()}, light`);
    await expect(frame).toBeVisible();
    await expect(frame.contentFrame().getByRole('textbox', { name: 'Email body' })).toBeVisible();
    // The frame's window, inside its border, is the device's width and the demo's height, so nothing scrolls.
    expect(await frame.evaluate((element: { clientWidth: number }) => element.clientWidth)).toBe(width);
    const demo = frame.contentFrame().locator('[data-slot=example-view]');
    await expect
      .poll(
        async () =>
          (await frame.evaluate((element: { clientHeight: number }) => element.clientHeight)) -
          Math.ceil((await demo.boundingBox())?.height ?? 0),
      )
      .toBe(0);
    await expect(frame).toHaveCSS('border-top-width', '1px');
    await expect(frame).toHaveCSS('border-radius', '0px');
  });
}

test("the theme toggle frames the demo dark, leaving the page's theme and its stored choice", async ({ page }) => {
  test.setTimeout(90_000);
  await openPreview(page);

  await darkTheme(page).click();
  await expect(darkTheme(page)).toHaveAttribute('aria-pressed', 'true');

  const frame = page.getByTitle(`${DEMO}, desktop, dark`);
  await expect(frame.contentFrame().locator('html')).toHaveClass(/(^|\s)dark(\s|$)/);
  // The whole stage takes the frame's background, not only the frame.
  const background = (scope: string) => `getComputedStyle(${scope}).backgroundColor`;
  const framed = await frame
    .contentFrame()
    .locator('[data-slot=example-view]')
    .evaluate(`(main) => ${background('main.closest("[data-slot=scroll-area]")')}`);
  await expect
    .poll(() =>
      page
        .locator('[data-slot=example-frame]')
        .evaluate(`(inner) => ${background('inner.closest("[data-slot=scroll-area]")')}`),
    )
    .toBe(framed);
  await expect(frame.contentFrame().getByRole('textbox', { name: 'Email body' })).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/(^|\s)light(\s|$)/);
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull();

  await darkTheme(page).click();
  await expect(page.locator('iframe[data-slot=block-frame]')).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'Email body' })).toBeVisible();
});

test('a view page opened alone draws only its demo, in its `?theme=`, leaving the stored theme', async ({ page }) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(`/docs/editor/view/${DEMO}?theme=dark`);

  await expect(page.getByRole('textbox', { name: 'Email body' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to the docs' })).toHaveCount(0);
  await expect(page.getByRole('banner')).toHaveCount(0);
  await expect(page.locator('html')).toHaveClass(/(^|\s)dark(\s|$)/);
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull();
});
