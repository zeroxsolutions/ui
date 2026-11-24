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
  test(`${name} frames the demo's page ${width}px wide, as tall as the demo`, async ({ page }) => {
    test.setTimeout(90_000);
    await openPreview(page);

    await device(page, name).click();

    const frame = page.getByTitle(`${DEMO}, ${name.toLowerCase()}, light`);
    await expect(frame).toBeVisible();
    await expect(frame.contentFrame().getByRole('textbox', { name: 'Email body' })).toBeVisible();
    expect((await frame.boundingBox())?.width).toBe(width);
    const demo = frame.contentFrame().locator('[data-slot=example-view]');
    await expect
      .poll(async () => ((await frame.boundingBox())?.height ?? 0) - Math.ceil((await demo.boundingBox())?.height ?? 0))
      .toBe(0);
  });
}

test("the theme toggle frames the demo dark, leaving the page's theme and its stored choice", async ({ page }) => {
  test.setTimeout(90_000);
  await openPreview(page);

  await darkTheme(page).click();
  await expect(darkTheme(page)).toHaveAttribute('aria-pressed', 'true');

  const frame = page.getByTitle(`${DEMO}, desktop, dark`);
  await expect(frame.contentFrame().locator('html')).toHaveClass(/(^|\s)dark(\s|$)/);
  await expect(frame.contentFrame().getByRole('textbox', { name: 'Email body' })).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/(^|\s)light(\s|$)/);
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull();

  await darkTheme(page).click();
  await expect(page.locator('iframe[data-slot=block-frame]')).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'Email body' })).toBeVisible();
});

test('a view page opened alone has a bar back to its docs page over its demo, and switches its theme in place', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(`/docs/editor/view/${DEMO}`);

  await expect(page.getByRole('heading', { name: DEMO })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to the docs' })).toHaveAttribute(
    'href',
    '/docs/editor/email-editor',
  );
  await expect(page.getByRole('textbox', { name: 'Email body' })).toBeVisible();

  await darkTheme(page).click();
  await expect(page.locator('html')).toHaveClass(/(^|\s)dark(\s|$)/);
  await expect(page).toHaveURL(/[?&]theme=dark/);
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull();
});

test('a view page embedded draws the demo alone, with no bar', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto(`/docs/editor/view/${DEMO}?embed=1`);

  await expect(page.getByRole('textbox', { name: 'Email body' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to the docs' })).toBeHidden();
  await expect(page.getByRole('heading', { name: DEMO })).toBeHidden();
});
