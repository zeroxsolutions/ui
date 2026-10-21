import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { type FrameLocator, type Locator, type Page } from '@playwright/test';

import { expect, test } from './test/fixtures';

const BUTTON = '/native/components/nativewind/button';

/** The EAS project the native preview publishes its updates to, as `eas init` wrote it into the app's config. */
const EXPO_PROJECT_ID = (
  JSON.parse(readFileSync(join(__dirname, '../../native-preview/app.json'), 'utf8')) as {
    expo: { extra: { eas: { projectId: string } } };
  }
).expo.extra.eas.projectId;

// The preview is an Expo web export, which loads its bundle and its fonts before it draws.
const DRAWN = { timeout: 30_000 };

/** The frame drawing the demo a reader knows as `demo`, such as `Button demo`. */
function frame(page: Page, demo: string): Locator {
  return page.getByTitle(`${demo} preview`, { exact: true });
}

function inside(page: Page, demo: string): FrameLocator {
  return frame(page, demo).contentFrame();
}

/** Picks `style` from the header's picker; the menu opens only once the page has hydrated, so it is clicked until it does. */
async function pickStyle(page: Page, style: string): Promise<void> {
  const picker = page.getByRole('button', { name: /^Style/ });
  await expect(async () => {
    await picker.click();
    await expect(page.getByRole('menuitem', { name: style })).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await page.getByRole('menuitem', { name: style }).click();
}

test.describe('in a light colour scheme', () => {
  test.use({ colorScheme: 'light' });

  test("the theme page draws the theme's colours and its font weights", async ({ page }) => {
    await page.goto('/native/components/nativewind/theme');

    const theme = inside(page, 'Theme demo');
    await expect(theme.getByText('primary', { exact: true })).toBeVisible(DRAWN);
    await expect(theme.getByText('Bold 700', { exact: true })).toBeVisible();
  });

  test("a native component page draws its demo in a frame, and the frame grows to the demo's height", async ({
    page,
  }) => {
    for (const [path, demo, label] of [
      [BUTTON, 'Button demo', 'Continue'],
      ['/native/components/uniwind/card', 'Card demo', 'Pay'],
    ] as const) {
      await page.goto(path);

      await expect(inside(page, demo).getByRole('button', { name: label, exact: true })).toBeVisible(DRAWN);
      // Drawn light, on a page that is light.
      await expect(inside(page, demo).getByRole('button', { name: label, exact: true })).toHaveCSS(
        'background-color',
        'rgb(23, 23, 23)',
      );
      // The frame takes the demo's height: nothing in it scrolls, and no empty band sits under the demo.
      await expect
        .poll(
          () =>
            inside(page, demo)
              .locator('body')
              .evaluate<number | undefined>(
                `(() => {
                  const scroller = [...document.querySelectorAll('#root *')].find((element) =>
                    ['auto', 'scroll'].includes(getComputedStyle(element).overflowY),
                  );
                  const content = scroller?.firstElementChild;
                  return scroller && content ? scroller.clientHeight - content.offsetHeight : undefined;
                })()`,
              ),
          { message: path },
        )
        .toBe(0);
    }
  });

  test('picking another style reloads the frame in that style', async ({ page }) => {
    await page.goto(BUTTON);
    const continueButton = inside(page, 'Button demo').getByRole('button', { name: 'Continue', exact: true });
    await expect(continueButton).toHaveCSS('height', '36px', DRAWN);

    await pickStyle(page, 'Nova');

    await expect(frame(page, 'Button demo')).toHaveAttribute('src', /^\/native-preview\/nova\/button-demo\b/);
    await expect(continueButton).toHaveCSS('height', '32px', DRAWN);
  });

  test("the phone link opens the page's style from the project's updates in Expo Go", async ({ page }) => {
    await page.goto(BUTTON);
    await pickStyle(page, 'Nova');

    await page.getByRole('button', { name: 'Open on your phone' }).click();

    const dialog = page.getByRole('dialog', { name: 'Open on your phone' });
    await expect(dialog.getByRole('img', { name: 'QR code that opens this demo in Expo Go' })).toBeVisible();
    await expect(dialog.getByRole('link')).toHaveAttribute(
      'href',
      `exp://u.expo.dev/${EXPO_PROJECT_ID}/--/button-demo?runtime-version=exposdk%3A58.0.0&channel-name=nova`,
    );
  });

  test("the frame shows the demo's source in its Code tab", async ({ page }) => {
    await page.goto(BUTTON);

    await page.getByRole('tab', { name: 'Code' }).click();

    await expect(page.getByText('function ButtonDemo(): ReactNode {')).toBeVisible();
  });

  test('a frame that cannot load says so instead of staying blank', async ({ page }) => {
    await page.route('**/native-preview/**', (route) => route.abort());
    await page.goto(BUTTON);

    // Firefox and WebKit fire no load event for an aborted frame, so there the frame reads as failed only
    // once the 15 seconds it is given to draw have passed.
    await expect(page.getByRole('alert').filter({ hasText: 'The preview did not load' })).toBeVisible({
      timeout: 20_000,
    });
  });

  test('a frame whose page is missing says so at once, not after the wait for a slow draw', async ({ page }) => {
    await page.route('**/native-preview/**', (route) =>
      route.fulfill({ status: 404, contentType: 'text/html', body: '<!doctype html><title>Not found</title>' }),
    );
    await page.goto(BUTTON);

    // Well under the 15 seconds a frame is given to draw before it reads as failed.
    await expect(page.getByRole('alert').filter({ hasText: 'The preview did not load' })).toBeVisible({
      timeout: 5_000,
    });
  });
});

test.describe('in a dark colour scheme', () => {
  test.use({ colorScheme: 'dark' });

  test("the site's dark mode reaches the frame, and switching the site to light redraws it light", async ({ page }) => {
    await page.goto(BUTTON);
    const continueButton = inside(page, 'Button demo').getByRole('button', { name: 'Continue', exact: true });
    await expect(continueButton).toHaveCSS('background-color', 'rgb(229, 229, 229)', DRAWN);

    const toggle = page.getByRole('button', { name: 'Toggle theme' });
    // The switch listens only once the page has hydrated, so it is clicked until the theme changes.
    await expect(async () => {
      await toggle.click();
      await expect(page.locator('html')).not.toHaveClass(/\bdark\b/, { timeout: 1_000 });
    }).toPass();

    await expect(continueButton).toHaveCSS('background-color', 'rgb(23, 23, 23)', DRAWN);
  });
});
