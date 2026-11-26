import { expect, test } from '@playwright/test';

import { DRAWN, openDemo } from './test/preview';

test('the arrow keys move the focused day, and past the last day of a month into the next', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-15T10:00:00'));
  await openDemo(page, 'calendar-demo');

  await page.getByRole('button', { name: 'Saturday, October 31st, 2026' }).click(DRAWN);
  await page.keyboard.press('ArrowRight');

  await expect(page.getByRole('grid', { name: 'November 2026' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sunday, November 1st, 2026' })).toBeFocused();
});
