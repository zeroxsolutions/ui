import { type FrameLocator, type Locator, type Page } from '@playwright/test';

import { expect, test } from './test/fixtures';

const BUTTON = '/native/components/nativewind/button';

// The preview is an Expo web export, which loads its bundle and its fonts before it draws.
const DRAWN = { timeout: 30_000 };

function frame(page: Page, demo: string): Locator {
  return page.getByTitle(`${demo} preview`);
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

  test("a native component page draws its demo in a frame, and the frame grows to the demo's height", async ({
    page,
  }) => {
    for (const [path, demo, label] of [
      [BUTTON, 'button-demo', 'Continue'],
      ['/native/components/uniwind/card', 'card-demo', 'Pay'],
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
              .evaluate(() => {
                const scroller = [...document.querySelectorAll<HTMLElement>('#root *')].find((element) =>
                  ['auto', 'scroll'].includes(getComputedStyle(element).overflowY),
                );
                const content = scroller?.firstElementChild as HTMLElement | null | undefined;
                return scroller && content ? scroller.clientHeight - content.offsetHeight : undefined;
              }),
          { message: path },
        )
        .toBe(0);
    }
  });

  test('picking another style reloads the frame in that style', async ({ page }) => {
    await page.goto(BUTTON);
    const continueButton = inside(page, 'button-demo').getByRole('button', { name: 'Continue', exact: true });
    await expect(continueButton).toHaveCSS('height', '36px', DRAWN);

    await pickStyle(page, 'Nova');

    await expect(frame(page, 'button-demo')).toHaveAttribute('src', /^\/native-preview\/nova\/button-demo\b/);
    await expect(continueButton).toHaveCSS('height', '32px', DRAWN);
  });

  test("the frame shows the demo's source in its Code tab", async ({ page }) => {
    await page.goto(BUTTON);

    await page.getByRole('tab', { name: 'Code' }).click();

    await expect(page.getByText('function ButtonDemo(): ReactNode {')).toBeVisible();
  });

  test('a frame that cannot load says so instead of staying blank', async ({ page }) => {
    await page.route('**/native-preview/**', (route) => route.abort());
    await page.goto(BUTTON);

    await expect(page.getByRole('alert').filter({ hasText: 'The preview did not load' })).toBeVisible();
  });
});

test.describe('in a dark colour scheme', () => {
  test.use({ colorScheme: 'dark' });

  test("the site's dark mode reaches the frame, and switching the site to light redraws it light", async ({ page }) => {
    await page.goto(BUTTON);
    const continueButton = inside(page, 'button-demo').getByRole('button', { name: 'Continue', exact: true });
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
