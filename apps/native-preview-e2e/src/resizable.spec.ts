import { expect, test } from '@playwright/test';

import { DRAWN, openDemo, tabTo } from './test/preview';

test('the keys move a focused handle along its group, and to either end with Home and End', async ({ page }) => {
  await openDemo(page, 'resizable-demo');
  const handle = page.getByRole('separator').first();
  await expect(handle).toBeVisible(DRAWN);
  await tabTo(page, handle);
  await expect(handle).toHaveAttribute('aria-valuenow', '50');

  await page.keyboard.press('ArrowRight');
  await expect(handle).not.toHaveAttribute('aria-valuenow', '50');
  await page.keyboard.press('ArrowLeft');
  await expect(handle).toHaveAttribute('aria-valuenow', '50');
  await page.keyboard.press('End');
  await expect(handle).toHaveAttribute('aria-valuenow', (await handle.getAttribute('aria-valuemax')) ?? '');
  await page.keyboard.press('Home');
  await expect(handle).toHaveAttribute('aria-valuenow', (await handle.getAttribute('aria-valuemin')) ?? '');
});
