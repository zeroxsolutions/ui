import { type Page } from '@playwright/test';

import { expect, test } from './test/fixtures';
import { waitForHydration } from './test/hydrated';

// WebKit and Firefox under Playwright do not grant clipboard-write permission the way Chromium does,
// so the real API is replaced with one that records what it was called with on `window`.
const STUB_CLIPBOARD = `(() => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: (text) => { window.__copiedText = text; return Promise.resolve(); } },
  });
})()`;

/**
 * Drives every motion the docs site has to its end state: a sidebar navigation, the TOC marking a
 * clicked entry, opening and closing "View code", an install tab switch and a copy click. Run once as
 * is and once under `reducedMotion: 'reduce'` (by the two `test`s below): both must reach the same end
 * states, with no console or page error either way.
 */
async function drivesEveryDocsMotionToItsEndState(page: Page): Promise<void> {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.addInitScript(STUB_CLIPBOARD);
  await page.setViewportSize({ width: 1440, height: 900 });

  // 1. A sidebar navigation crossfades the docs column.
  await page.goto('/docs/components/base/collapsible-card');
  const tagInputLink = page.getByRole('navigation', { name: 'Docs' }).getByRole('link', { name: 'Tag Input' });
  await waitForHydration(page);
  await tagInputLink.click();
  await expect(page).toHaveURL(/\/docs\/components\/base\/tag-input$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Tag Input' })).toBeVisible();

  // 2. The TOC marker slides to the entry a click sends the URL hash to.
  const toc = page.getByRole('navigation', { name: 'On this page' });
  const apiReferenceLink = toc.getByRole('link', { name: 'API reference' });
  await apiReferenceLink.click();
  await expect(page).toHaveURL(/#api-reference$/);
  await expect(apiReferenceLink).toHaveAttribute('aria-current', 'location');

  // 3. "View code" opens the first preview's source panel in place; the header's own trigger closes it.
  const main = page.getByRole('main');
  const viewCode = main.getByRole('button', { name: 'View code' }).first();
  const fullSource = main.getByText('function TagInputDemo');
  await viewCode.click();
  await expect(fullSource).toBeVisible();
  await main.getByRole('button', { name: 'Toggle content', exact: true }).first().click();
  await expect(fullSource).toBeHidden();
  await expect(viewCode).toBeVisible();

  // 4. The shown install tab's panel eases in on every switch.
  await page.getByRole('tab', { name: 'Manual' }).click();
  await expect(page.getByRole('heading', { level: 3, name: 'Add the components it is built from.' })).toBeVisible();
  await page.getByRole('tab', { name: 'Command' }).click();
  const installPanel = page.getByRole('tabpanel', { name: 'Command' });
  await expect(installPanel.getByText('pnpm dlx shadcn@latest add')).toBeVisible();

  // 5. The copy button's check eases in once the install command is copied.
  await installPanel.getByRole('button', { name: 'Copy code' }).click();
  await expect(installPanel.getByRole('button', { name: 'Copied' })).toBeVisible();

  expect(errors).toEqual([]);
}

test('every docs motion reaches its end state', async ({ page }) => {
  await drivesEveryDocsMotionToItsEndState(page);
});

test.describe('under reduced motion', () => {
  // `reducedMotion` sits on `BrowserContextOptions`, not on this installed Playwright's
  // `PlaywrightTestOptions`, so it reaches the context through `contextOptions`.
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('every docs motion reaches its end state at once', async ({ page }) => {
    await drivesEveryDocsMotionToItsEndState(page);
  });
});
