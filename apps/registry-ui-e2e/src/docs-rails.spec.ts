import { expect, test, type Locator, type Page } from '@playwright/test';

/** The docs page that runs longest, so its end is furthest below the rails' sticky start. */
const LONGEST_PAGE = '/docs/components/status-indicator';

// The e2e tsconfig has no DOM lib, so page-side reads go in as expression strings.
async function pageScrollY(page: Page): Promise<number> {
  return Number(await page.evaluate('window.scrollY'));
}

async function scrollToPageEnd(page: Page): Promise<void> {
  await page.keyboard.press('End');
  await expect
    .poll(() => page.evaluate('window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1'))
    .toBe(true);
}

function sidebar(page: Page): Locator {
  return page.getByRole('navigation', { name: 'Docs' });
}

function toc(page: Page): Locator {
  return page.getByRole('navigation', { name: 'On this page' });
}

for (const size of [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
]) {
  test(`at ${size.width}x${size.height} the sidebar stays under the header to the end of a docs page`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    await page.goto(LONGEST_PAGE);
    await scrollToPageEnd(page);

    const [rail, header] = await Promise.all([sidebar(page).boundingBox(), page.getByRole('banner').boundingBox()]);
    expect(rail?.y).toBeGreaterThanOrEqual((header?.y ?? 0) + (header?.height ?? Infinity));
  });
}

test('a docs page has no site footer', async ({ page }) => {
  await page.goto(LONGEST_PAGE);
  await scrollToPageEnd(page);

  await expect(page.getByRole('contentinfo')).toBeHidden();
});

test('a page outside the docs keeps the site footer', async ({ page }) => {
  await page.goto('/blocks');

  await expect(page.getByRole('contentinfo')).toBeVisible();
});

test('the page never rubber-bands', async ({ page }) => {
  await page.goto(LONGEST_PAGE);

  expect(await page.evaluate('getComputedStyle(document.scrollingElement).overscrollBehaviorY')).toBe('none');
});

/**
 * Wheels over `rail` until its last link is in view, then wheels on past the list's end, and reports
 * whether the page moved at any point. Until the list's end every wheel scrolls the list; past it, a
 * wheel either stops at the rail or moves the page.
 */
async function pageMovedWheelingPastRail(page: Page, rail: Locator): Promise<boolean> {
  const before = await pageScrollY(page);

  const last = rail.getByRole('link').last();
  await rail.getByRole('link').first().hover();
  // The list clips its links, so the last one is in the viewport only once the list has scrolled to it.
  await expect(async () => {
    await page.mouse.wheel(0, 400);
    await expect(last).toBeInViewport({ timeout: 500 });
  }).toPass();
  await page.mouse.wheel(0, 400);
  await page.mouse.wheel(0, 400);
  // This asserts an absence: no event marks a chained scroll that never comes, so wait for one to land.
  // eslint-disable-next-line playwright/no-wait-for-timeout
  await page.waitForTimeout(500);

  return (await pageScrollY(page)) !== before;
}

test('a wheel over the sidebar past the end of its list leaves the page where it was', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(LONGEST_PAGE);

  expect(await pageMovedWheelingPastRail(page, sidebar(page))).toBe(false);
});

test('a wheel over the TOC past the end of its list leaves the page where it was', async ({ page }) => {
  // Short enough that this page's headings overflow the TOC column, so its list has an end to wheel past.
  await page.setViewportSize({ width: 1440, height: 320 });
  await page.goto(LONGEST_PAGE);

  expect(await pageMovedWheelingPastRail(page, toc(page))).toBe(false);
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`in ${colorScheme} the rails show the page's own background`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ colorScheme });
    await page.goto(LONGEST_PAGE);

    await expect(sidebar(page)).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(toc(page)).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  });
}
