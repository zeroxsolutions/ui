import { type Locator, type Page } from '@playwright/test';

import { expect, test } from './test/fixtures';

/** The docs page that runs longest, so its sidebar and its TOC both outrun a short window. */
const LONGEST_PAGE = '/docs/components/base/avatar-picker';

// The e2e tsconfig has no DOM lib, so page-side reads go in as expression strings.
async function pageScrollY(page: Page): Promise<number> {
  return Number(await page.evaluate('window.scrollY'));
}

/** Resolves once the page has drawn two more frames, by which a scroll the last wheel chained has begun. */
async function nextFrames(page: Page): Promise<void> {
  await page.evaluate('new Promise((drawn) => requestAnimationFrame(() => requestAnimationFrame(drawn)))');
}

/** Whether `link`'s bottom edge is inside the window, which a link the list still clips below it is not. */
async function inWindow(link: Locator): Promise<boolean> {
  return link.evaluate(
    (element: {
      getBoundingClientRect(): { bottom: number };
      ownerDocument: { defaultView: { innerHeight: number } };
    }) => element.getBoundingClientRect().bottom <= element.ownerDocument.defaultView.innerHeight,
  );
}

function sidebar(page: Page): Locator {
  return page.getByRole('navigation', { name: 'Docs' });
}

function toc(page: Page): Locator {
  return page.getByRole('navigation', { name: 'On this page' });
}

test('a docs page has no site footer', async ({ page }) => {
  await page.goto(LONGEST_PAGE);

  await expect(page.getByRole('contentinfo')).toBeHidden();
});

test('a page outside the docs keeps the site footer', async ({ page }) => {
  await page.goto('/blocks/base');

  await expect(page.getByRole('contentinfo')).toBeVisible();
});

/**
 * Wheels over `rail` until its last link is in view, then wheels on past the list's end, and reports
 * whether the page moved at any point. Until the list's end every wheel scrolls the list; past it, a
 * wheel either stops at the rail or moves the page.
 */
async function pageMovedWheelingPastRail(page: Page, rail: Locator): Promise<boolean> {
  const last = rail.getByRole('link').last();
  // The list has an end to wheel past only while it clips its last link.
  await expect(last).not.toBeInViewport();
  // A hover scrolls its target into view, which on a short window moves the page first.
  await rail.getByRole('link').first().hover();
  const before = await pageScrollY(page);
  for (let step = 0; step < 40 && !(await inWindow(last)); step += 1) {
    await page.mouse.wheel(0, 400);
    await nextFrames(page);
  }
  await expect(last).toBeInViewport();
  await page.mouse.wheel(0, 400);
  await page.mouse.wheel(0, 400);
  await nextFrames(page);

  return (await pageScrollY(page)) !== before;
}

test('a wheel over the sidebar past the end of its list leaves the page where it was', async ({ page }) => {
  // Short enough that the sidebar's own list overflows its column.
  await page.setViewportSize({ width: 1440, height: 320 });
  await page.goto(LONGEST_PAGE);

  expect(await pageMovedWheelingPastRail(page, sidebar(page))).toBe(false);
});

test('a wheel over the TOC past the end of its list leaves the page where it was', async ({ page }) => {
  // Short enough that this page's TOC overflows its column.
  await page.setViewportSize({ width: 1440, height: 240 });
  await page.goto(LONGEST_PAGE);

  expect(await pageMovedWheelingPastRail(page, toc(page))).toBe(false);
});
