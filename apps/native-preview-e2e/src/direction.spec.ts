import { expect, test } from '@playwright/test';

import { DRAWN, openDemo, tabTo } from './test/preview';

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-15T10:00:00'));
  await openDemo(page, 'direction-controls-demo');
});

test('ArrowLeft raises a slider laid out right to left', async ({ page }) => {
  const volume = page.getByRole('slider', { name: 'Volume' });
  await expect(volume).toBeVisible(DRAWN);
  await tabTo(page, volume);

  await page.keyboard.press('ArrowLeft');

  await expect(volume).toHaveAttribute('aria-valuenow', '51');
});

test('ArrowLeft moves the focused day of a calendar laid out right to left to the next day', async ({ page }) => {
  await page.getByRole('button', { name: 'Thursday, October 15th, 2026' }).click(DRAWN);

  await page.keyboard.press('ArrowLeft');

  await expect(page.getByRole('button', { name: 'Friday, October 16th, 2026' })).toBeFocused();
});

test('ArrowRight moves a carousel laid out right to left on, as upstream keeps its keys', async ({ page }) => {
  const carousel = page
    .getByRole('region')
    .filter({ has: page.getByRole('button', { name: 'Next slide' }) })
    .first();
  const previous = carousel.getByRole('button', { name: 'Previous slide' });
  await expect(previous).toBeDisabled(DRAWN);
  await tabTo(page, carousel.getByRole('button', { name: 'Next slide' }));

  await page.keyboard.press('ArrowRight');

  await expect(previous).toBeEnabled();
});
