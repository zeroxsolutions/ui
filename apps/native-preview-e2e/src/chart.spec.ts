import { type Page, expect, test } from '@playwright/test';

import { DRAWN, boxOf, openDemo, tabTo } from './test/preview';

/** The first bar chart of the demo, over six months. */
const monthBars = (page: Page) =>
  page.getByRole('slider', { name: /^Bar chart\. Jan: Desktop 186, Mobile 80/ }).first();

/**
 * The tooltip's desktop figure for a month, which no other chart on the page draws as text: the month's name
 * alone is also a tick of the radar chart below.
 */
const DESKTOP = { January: '186', February: '305', June: '214' } as const;
const tooltipOf = (page: Page, month: keyof typeof DESKTOP) => page.getByText(DESKTOP[month], { exact: true });

test('the arrow keys, Home and End move a focused chart tooltip between categories, and Escape hides it', async ({
  page,
}) => {
  await openDemo(page, 'chart-demo');
  const chart = monthBars(page);
  await expect(chart).toBeVisible(DRAWN);
  await tabTo(page, chart);

  await page.keyboard.press('ArrowRight');
  await expect(tooltipOf(page, 'January')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(tooltipOf(page, 'February')).toBeVisible();
  await page.keyboard.press('End');
  await expect(tooltipOf(page, 'June')).toBeVisible();
  await page.keyboard.press('Home');
  await expect(tooltipOf(page, 'January')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(tooltipOf(page, 'January')).toBeHidden();
});

test('a mouse over a chart shows the category under it, and hides it once the mouse leaves', async ({ page }) => {
  await openDemo(page, 'chart-demo');
  const chart = monthBars(page);
  await expect(chart).toBeVisible(DRAWN);
  const box = await boxOf(chart);

  // February is the second of six categories across the plot.
  await page.mouse.move(box.x + (box.width * 1.5) / 6, box.y + box.height / 2);
  await expect(tooltipOf(page, 'February')).toBeVisible();

  await page.mouse.move(box.x + box.width / 2, box.y + box.height + 150);
  await expect(tooltipOf(page, 'February')).toBeHidden();
});

test('a click on the category a mouse hovers keeps its tooltip shown', async ({ page }) => {
  await openDemo(page, 'chart-demo');
  const chart = monthBars(page);
  await expect(chart).toBeVisible(DRAWN);
  const box = await boxOf(chart);
  const february = { x: box.x + (box.width * 1.5) / 6, y: box.y + box.height / 2 };

  await page.mouse.move(february.x, february.y);
  await expect(tooltipOf(page, 'February')).toBeVisible();
  await page.mouse.click(february.x, february.y);

  await expect(tooltipOf(page, 'February')).toBeVisible();
});
