import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { type Page } from '@playwright/test';

import { expect, test } from './test/fixtures';
import { DRAWN, frame, inside } from './test/native-preview';

const BUTTON = '/native/components/nativewind/button';
const UNIWIND_BUTTON = '/native/components/uniwind/button';

/** The EAS project an engine's preview publishes its updates to, as `eas init` wrote it into the app's config. */
function projectIdOf(app: 'native-preview' | 'native-preview-uniwind'): string {
  const config = JSON.parse(readFileSync(join(__dirname, `../../${app}/app.json`), 'utf8')) as {
    expo: { extra: { eas: { projectId: string } } };
  };
  return config.expo.extra.eas.projectId;
}

const EXPO_PROJECT_ID = projectIdOf('native-preview');
const UNIWIND_PROJECT_ID = projectIdOf('native-preview-uniwind');

/** Picks `style` from the header's picker; the menu opens only once the page has hydrated, so it is clicked until it does. */
async function pickStyle(page: Page, style: string): Promise<void> {
  const picker = page.getByRole('button', { name: /^Style/ });
  await expect(async () => {
    await picker.click();
    await expect(page.getByRole('menuitem', { name: style })).toBeVisible({
      timeout: 1_000,
    });
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
    // The same neutral, which the Uniwind export serialises in the lab space Tailwind 4 writes it in.
    for (const [path, demo, label, background] of [
      [BUTTON, 'Button demo', 'Continue', 'rgb(23, 23, 23)'],
      ['/native/components/uniwind/card', 'Card demo', 'Pay', 'lab(7.78201 -0.0000149012 0)'],
    ] as const) {
      await page.goto(path);

      await expect(inside(page, demo).getByRole('button', { name: label, exact: true })).toBeVisible(DRAWN);
      // Drawn light, on a page that is light.
      await expect(inside(page, demo).getByRole('button', { name: label, exact: true })).toHaveCSS(
        'background-color',
        background,
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
    const continueButton = inside(page, 'Button demo').getByRole('button', {
      name: 'Continue',
      exact: true,
    });
    await expect(continueButton).toHaveCSS('height', '36px', DRAWN);

    await pickStyle(page, 'Nova');

    await expect(frame(page, 'Button demo')).toHaveAttribute(
      'src',
      /^\/native-preview\/index\.html\?style=nova&demo=button-demo&/,
    );
    await expect(continueButton).toHaveCSS('height', '32px', DRAWN);
  });

  test("picking Native shows a QR code that opens the page's style from the project's updates in Expo Go", async ({
    page,
  }) => {
    await page.goto(BUTTON);
    await pickStyle(page, 'Nova');

    const platform = page.getByRole('combobox', { name: 'Platform' });
    // The picker opens only once the page has hydrated, so it is clicked until it does.
    await expect(async () => {
      await platform.click();
      await expect(page.getByRole('option', { name: 'Native' })).toBeVisible({
        timeout: 1_000,
      });
    }).toPass();
    await page.getByRole('option', { name: 'Native' }).click();

    await expect(
      page.getByRole('img', {
        name: 'QR code that opens this demo in Expo Go',
      }),
    ).toBeVisible();
    await expect(page.getByText('Scan to preview.')).toBeVisible();
    await expect(frame(page, 'Button demo')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /^exp:/ })).toHaveAttribute(
      'href',
      `exp://u.expo.dev/${EXPO_PROJECT_ID}/--/button-demo?runtime-version=exposdk%3A58.0.0&channel-name=nova`,
    );
  });

  test("a Uniwind page frames the Uniwind export, and its QR opens the Uniwind project's updates", async ({ page }) => {
    await page.goto(`${UNIWIND_BUTTON}?style=nova`);

    await expect(frame(page, 'Button demo')).toHaveAttribute(
      'src',
      /^\/native-preview-uniwind\/index\.html\?style=nova&demo=button-demo&/,
    );
    await expect(
      inside(page, 'Button demo').getByRole('button', {
        name: 'Continue',
        exact: true,
      }),
    ).toBeVisible(DRAWN);

    const platform = page.getByRole('combobox', { name: 'Platform' });
    // The picker opens only once the page has hydrated, so it is clicked until it does.
    await expect(async () => {
      await platform.click();
      await expect(page.getByRole('option', { name: 'Native' })).toBeVisible({
        timeout: 1_000,
      });
    }).toPass();
    await page.getByRole('option', { name: 'Native' }).click();

    await expect(page.getByRole('link', { name: /^exp:/ })).toHaveAttribute(
      'href',
      `exp://u.expo.dev/${UNIWIND_PROJECT_ID}/--/button-demo?runtime-version=exposdk%3A58.0.0&channel-name=nova`,
    );
  });

  for (const engine of ['nativewind', 'uniwind'] as const) {
    test(`the ${engine} dialog demo opens inside its frame and closes on Escape and on Cancel`, async ({ page }) => {
      await page.goto(`/native/components/${engine}/dialog`);
      const demo = inside(page, 'Dialog demo');
      const dialog = demo.getByRole('dialog', { name: 'Edit profile' });

      await demo.getByRole('button', { name: 'Open Dialog', exact: true }).click(DRAWN);
      await expect(dialog).toBeVisible();
      // The frame grows to hold the open dialog, which no part of it is clipped from.
      await expect
        .poll(async () => {
          const [outer, inner] = await Promise.all([frame(page, 'Dialog demo').boundingBox(), dialog.boundingBox()]);
          return (
            outer !== null && inner !== null && inner.y >= outer.y && inner.y + inner.height <= outer.y + outer.height
          );
        })
        .toBe(true);

      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(demo.getByRole('button', { name: 'Open Dialog', exact: true })).toBeFocused();

      await demo.getByRole('button', { name: 'Open Dialog', exact: true }).click();
      await demo.getByRole('button', { name: 'Cancel', exact: true }).click();
      await expect(dialog).toHaveCount(0);
      // Closed, the frame goes back to the demo's own height.
      await expect.poll(async () => (await frame(page, 'Dialog demo').boundingBox())?.height).toBeLessThan(200);
    });

    test(`the ${engine} dropdown menu demo opens, runs a sub-menu's item and closes`, async ({ page }) => {
      await page.goto(`/native/components/${engine}/dropdown-menu`);
      const demo = inside(page, 'Dropdown menu demo');
      const trigger = demo.getByRole('button', { name: 'Open', exact: true });
      const menu = demo.getByRole('menu').first();

      await trigger.click(DRAWN);
      await expect(menu).toBeVisible();

      await demo.getByRole('menuitem', { name: 'Invite users' }).click();
      await demo.getByRole('menuitem', { name: 'Email' }).click();

      await expect(demo.getByRole('menu')).toHaveCount(0);
      await expect(trigger).toBeFocused();
    });
  }

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
      route.fulfill({
        status: 404,
        contentType: 'text/html',
        body: '<!doctype html><title>Not found</title>',
      }),
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
    const continueButton = inside(page, 'Button demo').getByRole('button', {
      name: 'Continue',
      exact: true,
    });
    await expect(continueButton).toHaveCSS('background-color', 'rgb(229, 229, 229)', DRAWN);

    const toggle = page.getByRole('button', { name: 'Toggle theme' });
    // The switch listens only once the page has hydrated, so it is clicked until the theme changes.
    await expect(async () => {
      await toggle.click();
      await expect(page.locator('html')).not.toHaveClass(/\bdark\b/, {
        timeout: 1_000,
      });
    }).toPass();

    await expect(continueButton).toHaveCSS('background-color', 'rgb(23, 23, 23)', DRAWN);
  });
});
