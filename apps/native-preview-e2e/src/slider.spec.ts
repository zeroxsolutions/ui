import { expect, test } from '@playwright/test';

import { DRAWN, openDemo, tabTo } from './test/preview';

test('the keys move a focused thumb by a step, by a page, and to either end', async ({ page }) => {
  await openDemo(page, 'slider-demo');
  const volume = page.getByRole('slider', { name: 'Volume' });
  await expect(volume).toBeVisible(DRAWN);
  await tabTo(page, volume);
  const start = Number(await volume.getAttribute('aria-valuenow'));

  await page.keyboard.press('ArrowRight');
  await expect(volume).toHaveAttribute('aria-valuenow', String(start + 1));
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(volume).toHaveAttribute('aria-valuenow', String(start - 1));
  await page.keyboard.press('PageUp');
  await expect(volume).toHaveAttribute('aria-valuenow', String(start + 9));
  await page.keyboard.press('End');
  await expect(volume).toHaveAttribute('aria-valuenow', (await volume.getAttribute('aria-valuemax')) ?? '');
  await page.keyboard.press('Home');
  await expect(volume).toHaveAttribute('aria-valuenow', (await volume.getAttribute('aria-valuemin')) ?? '');
});
