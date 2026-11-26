import { type Page } from '@playwright/test';

import { expect, test } from './test/fixtures';

const DEMO = 'email-editor-demo';

/** The first preview's toggle for the device named `name`. */
function device(page: Page, name: string) {
  return page.getByRole('group', { name: 'Device' }).first().getByRole('button', { name, exact: true });
}

/** The first preview's theme toggle, pressed while its demo is dark. */
function darkTheme(page: Page) {
  return page.getByRole('button', { name: 'Toggle preview theme' }).first();
}

/** Opens the email editor's page in the light theme, once its preview's controls have hydrated. */
async function openPreview(page: Page): Promise<void> {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/docs/editor/email-editor');
  await expect(darkTheme(page)).toBeEnabled();
}

/** The width of the window the frame titled `title` gives the page it holds, which that page's breakpoints read. */
async function frameWidth(page: Page, title: string): Promise<number> {
  return page
    .getByTitle(title)
    .contentFrame()
    .locator('body')
    .evaluate(
      (element: { ownerDocument: { defaultView: { innerWidth: number } } }) =>
        element.ownerDocument.defaultView.innerWidth,
    );
}

test('a preview draws its demo inline at the desktop width in the site theme', async ({ page }) => {
  test.setTimeout(90_000);
  await openPreview(page);

  await expect(device(page, 'Desktop')).toHaveAttribute('aria-pressed', 'true');
  await expect(darkTheme(page)).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('textbox', { name: 'Email body' })).toBeVisible();
  await expect(page.getByTitle(new RegExp(`^${DEMO}, `))).toHaveCount(0);
});

for (const [name, width] of [
  ['Tablet', 768],
  ['Mobile', 375],
] as const) {
  test(`${name} frames the demo's page in a window ${width}px wide`, async ({ page }) => {
    test.setTimeout(90_000);
    await openPreview(page);

    await device(page, name).click();

    const title = `${DEMO}, ${name.toLowerCase()}, light`;
    await expect(device(page, name)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTitle(title).contentFrame().getByRole('textbox', { name: 'Email body' })).toBeVisible();
    expect(await frameWidth(page, title)).toBe(width);
  });
}

test("the theme toggle frames the demo dark, leaving the site's stored theme", async ({ page }) => {
  test.setTimeout(90_000);
  await openPreview(page);

  await darkTheme(page).click();
  await expect(darkTheme(page)).toHaveAttribute('aria-pressed', 'true');

  const frame = page.getByTitle(`${DEMO}, desktop, dark`).contentFrame();
  await expect(frame.getByRole('textbox', { name: 'Email body' })).toBeVisible();
  // The stage has the controls, so the framed page draws none of its own.
  await expect(frame.getByRole('group', { name: 'Device' })).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull();

  await darkTheme(page).click();
  await expect(page.getByTitle(new RegExp(`^${DEMO}, `))).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'Email body' })).toBeVisible();
});

test('a view page opened alone carries its device and theme controls, and no docs chrome', async ({ page }) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(`/docs/editor/view/${DEMO}`);

  await expect(page.getByRole('textbox', { name: 'Email body' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to the docs' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: DEMO })).toHaveCount(0);
  await expect(page.getByRole('group', { name: 'Device' }).first()).toBeVisible();

  // The theme toggle rewrites `?theme=` in place, leaving the stored theme; it is enabled once the page hydrates.
  await expect(darkTheme(page)).toBeEnabled();
  await darkTheme(page).click();
  await expect(page).toHaveURL(/[?&]theme=dark/);
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull();

  // Mobile frames the page itself at 375px, in its theme, with no controls of its own.
  await device(page, 'Mobile').click();
  const title = `${DEMO}, mobile, dark`;
  const frame = page.getByTitle(title).contentFrame();
  await expect(frame.getByRole('textbox', { name: 'Email body' })).toBeVisible();
  expect(await frameWidth(page, title)).toBe(375);
  await expect(frame.getByRole('group', { name: 'Device' })).toHaveCount(0);
});

test('a view page embedded, as a docs frame loads it, draws no controls and stores no theme', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto(`/docs/editor/view/${DEMO}?embed=1&theme=dark`);

  await expect(page.getByRole('textbox', { name: 'Email body' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Device' })).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull();
});
