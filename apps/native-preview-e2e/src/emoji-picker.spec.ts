import { expect, test } from '@playwright/test';

import { DRAWN, openDemo } from './test/preview';

test("choosing a category scrolls the list to that category's heading", async ({ page }) => {
  await openDemo(page, 'emoji-picker-demo');
  const flags = page.getByText('Flags', { exact: true });
  await expect(page.getByRole('radio', { name: 'Flags' })).toBeVisible(DRAWN);
  await expect(flags).not.toBeInViewport();

  await page.getByRole('radio', { name: 'Flags' }).click();

  await expect(flags).toBeInViewport();
});
