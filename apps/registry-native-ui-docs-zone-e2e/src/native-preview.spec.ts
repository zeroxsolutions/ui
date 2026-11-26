import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { type Page } from '@playwright/test';

import { expect, test } from './test/fixtures';
import { hydrated } from './test/hydrated';
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

/** Picks `style` from the header's picker. */
async function pickStyle(page: Page, style: string): Promise<void> {
  const picker = page.getByRole('button', { name: /^Style/ });
  await hydrated(picker);
  await picker.click();
  await page.getByRole('menuitem', { name: style }).click();
}

/** Picks `platform` from the first preview's platform picker. */
async function pickPlatform(page: Page, platform: string): Promise<void> {
  const picker = page.getByRole('combobox', { name: 'Platform' });
  await hydrated(picker);
  await picker.click();
  await page.getByRole('option', { name: platform }).click();
}

test.slow(true, 'a frame may take all of DRAWN to draw, outlasting the default');

test.use({ colorScheme: 'light' });

test("the theme page draws the theme's colours and its font weights", async ({ page }) => {
  await page.goto('/native/components/nativewind/theme');

  const theme = inside(page, 'Theme demo');
  await expect(theme.getByText('primary', { exact: true })).toBeVisible(DRAWN);
  await expect(theme.getByText('Bold 700', { exact: true })).toBeVisible();
});

test('a native component page draws its demo in a frame, under either engine', async ({ page }) => {
  for (const [path, demo, label] of [
    [BUTTON, 'Button demo', 'Continue'],
    ['/native/components/uniwind/card', 'Card demo', 'Pay'],
  ] as const) {
    await page.goto(path);

    await expect(inside(page, demo).getByRole('button', { name: label, exact: true }), path).toBeVisible(DRAWN);
  }
});

test('a demo in its frame opens a dialog, which Escape closes back onto its trigger', async ({ page }) => {
  await page.goto('/native/components/nativewind/dialog');
  const demo = inside(page, 'Dialog demo');
  const trigger = demo.getByRole('button', { name: 'Open Dialog', exact: true });
  const dialog = demo.getByRole('dialog', { name: 'Edit profile' });

  await trigger.click(DRAWN);
  await expect(dialog).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("picking Native shows a QR code that opens the page's style from the project's updates in Expo Go", async ({
  page,
}) => {
  await page.goto(BUTTON);
  await pickStyle(page, 'Nova');

  await pickPlatform(page, 'Native');

  await expect(page.getByRole('img', { name: 'QR code that opens this demo in Expo Go' })).toBeVisible();
  await expect(page.getByText('Scan to preview.')).toBeVisible();
  await expect(frame(page, 'Button demo')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /^exp:/ })).toHaveAttribute(
    'href',
    `exp://u.expo.dev/${EXPO_PROJECT_ID}/--/button-demo?runtime-version=exposdk%3A58.0.0&channel-name=nova`,
  );
});

test("a Uniwind page draws the Uniwind export, and its QR opens the Uniwind project's updates", async ({ page }) => {
  const uniwindExport = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/native-preview-uniwind/index.html' && response.ok(),
  );
  await page.goto(`${UNIWIND_BUTTON}?style=nova`);

  await uniwindExport;
  await expect(inside(page, 'Button demo').getByRole('button', { name: 'Continue', exact: true })).toBeVisible(DRAWN);

  await pickPlatform(page, 'Native');

  await expect(page.getByRole('link', { name: /^exp:/ })).toHaveAttribute(
    'href',
    `exp://u.expo.dev/${UNIWIND_PROJECT_ID}/--/button-demo?runtime-version=exposdk%3A58.0.0&channel-name=nova`,
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
