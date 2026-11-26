import { expect, test } from '@playwright/test';

import { DRAWN, openDemo, tabTo } from './test/preview';

test('the arrow keys move a focused carousel a slide at a time', async ({ page }) => {
  await openDemo(page, 'carousel-demo');
  const carousel = page
    .getByRole('region')
    .filter({ has: page.getByRole('button', { name: 'Next slide' }) })
    .first();
  const previous = carousel.getByRole('button', { name: 'Previous slide' });
  await expect(previous).toBeDisabled(DRAWN);

  // Focus inside the carousel is what the keys reach; its one control that takes focus at the start is Next.
  await tabTo(page, carousel.getByRole('button', { name: 'Next slide' }));
  await page.keyboard.press('ArrowRight');
  await expect(previous).toBeEnabled();

  await page.keyboard.press('ArrowLeft');
  await expect(previous).toBeDisabled();
});
