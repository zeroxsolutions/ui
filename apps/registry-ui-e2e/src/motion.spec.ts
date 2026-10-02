import { expect, test, type Page } from '@playwright/test';

// WebKit and Firefox under Playwright do not grant clipboard-write permission the way Chromium does,
// so the real API is replaced with one that records what it was called with on `window`.
const STUB_CLIPBOARD = `(() => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: (text) => { window.__copiedText = text; return Promise.resolve(); } },
  });
})()`;

async function pageIsAtItsEnd(page: Page): Promise<boolean> {
  return Boolean(
    await page.evaluate('window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1'),
  );
}

/** Wheels the page toward its end a step at a time, the way a reader's scroll crosses every cell. */
async function scrollToPageEndInSteps(page: Page): Promise<void> {
  for (let step = 0; step < 40 && !(await pageIsAtItsEnd(page)); step += 1) {
    await page.mouse.wheel(0, 400);
  }
}

/** Every home grid cell's computed opacity. A string expression: the e2e tsconfig has no DOM lib. */
async function homeGridCellOpacities(page: Page): Promise<number[]> {
  const opacities = await page.evaluate(
    "Array.from(document.querySelectorAll('[data-slot=home-grid-cell]')).map((cell) => getComputedStyle(cell).opacity)",
  );
  return (opacities as string[]).map(Number);
}

/**
 * Drives every motion the docs site has to its end state: a sidebar navigation, the TOC marker
 * sliding to a clicked entry, opening and closing "View code", an install tab switch, a copy click,
 * and the home grid's cells arriving on scroll. Run once as is and once under
 * `reducedMotion: 'reduce'` (by the two `test`s below): both must reach the same end states, with no
 * console or page error either way.
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
  await page.goto('/docs/components/collapsible-card');
  const tagInputLink = page.getByRole('navigation', { name: 'Docs' }).getByRole('link', { name: 'Tag Input' });
  // Retries the click itself, not just the read after it: clicked before React hydrates the link, it
  // is a plain DOM anchor with no client-side handler attached, and the first attempt is sometimes that one.
  await expect(async () => {
    await tagInputLink.click();
    await expect(page).toHaveURL(/\/docs\/components\/tag-input$/, { timeout: 1_000 });
  }).toPass();
  await expect(page.getByRole('heading', { level: 1, name: 'Tag Input' })).toBeVisible();

  // 2. The TOC marker slides to the entry a click sends the URL hash to.
  const toc = page.getByRole('navigation', { name: 'On this page' });
  const apiReferenceLink = toc.getByRole('link', { name: 'API reference' });
  await apiReferenceLink.click();
  await expect(page).toHaveURL(/#api-reference$/);
  const marker = page.locator('[data-slot="docs-toc-marker"]');
  // The marker eases to the entry over 200ms; ten seconds covers a cold worker on a shared runner.
  await expect
    .poll(
      async () => {
        const [markerBox, linkBox] = await Promise.all([marker.boundingBox(), apiReferenceLink.boundingBox()]);
        return markerBox && linkBox ? Math.abs(markerBox.y - linkBox.y) : Number.POSITIVE_INFINITY;
      },
      { timeout: 10_000 },
    )
    .toBeLessThanOrEqual(2);

  // 3. "View code" opens the first preview's source panel in place; the header's own trigger closes
  // it again, and the panel leaves the DOM once its 200ms exit finishes.
  const main = page.getByRole('main');
  const viewCode = main.getByRole('button', { name: 'View code' }).first();
  const fullSource = main.getByText('function TagInputDemo');
  // The trigger listens only once the page has hydrated, so it is clicked until the full file shows.
  await expect(async () => {
    await viewCode.click({ timeout: 1_000 });
    await expect(fullSource).toBeVisible({ timeout: 1_000 });
  }).toPass();
  const closeTrigger = main.getByRole('button', { name: 'Toggle', exact: true }).first();
  await closeTrigger.click();
  await expect(fullSource).toBeHidden();
  await expect(viewCode).toBeVisible();

  // 4. The shown install tab's panel eases in on every switch; Base UI unmounts the inactive one.
  await page.getByRole('tab', { name: 'Manual' }).click();
  await expect(page.getByRole('heading', { level: 3, name: 'Add the components it is built from.' })).toBeVisible();
  await page.getByRole('tab', { name: 'Command' }).click();
  const installPanel = page.getByRole('tabpanel', { name: 'Command' });
  await expect(installPanel.getByText('pnpm dlx shadcn@latest add')).toBeVisible();

  // 5. The copy button's check eases in once the install command is copied.
  await expect(async () => {
    await installPanel.getByRole('button', { name: 'Copy code' }).click({ timeout: 1_000 });
    await expect(installPanel.getByRole('button', { name: 'Copied' })).toBeVisible({ timeout: 1_000 });
  }).toPass();

  // 6. The home grid's cells below the fold at hydration ease in as they scroll into view.
  // WebKit reports a prefetch aborted by navigation as a console error, so let this page's own
  // sidebar-link prefetches settle before leaving it for the home page.
  // eslint-disable-next-line playwright/no-networkidle
  await page.waitForLoadState('networkidle');
  await page.goto('/');
  const cells = page.locator('[data-slot="home-grid-cell"]');
  const cellCount = await cells.count();
  expect(cellCount).toBeGreaterThan(0);
  await scrollToPageEndInSteps(page);
  // Each cell eases in over 200ms, a beat after the one before it in its row; ten seconds covers a
  // cold worker on a shared runner.
  await expect.poll(() => homeGridCellOpacities(page), { timeout: 10_000 }).toEqual(Array(cellCount).fill(1));

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
