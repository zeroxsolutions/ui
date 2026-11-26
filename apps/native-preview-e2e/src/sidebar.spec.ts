import { expect, test } from '@playwright/test';

import { DRAWN, boxOf, openDemo } from './test/preview';

test('Ctrl+B collapses the sidebar to its icons and opens it again', async ({ page }) => {
  await openDemo(page, 'sidebar-demo');
  const team = page.getByRole('button', { name: 'Acme Inc Enterprise' });
  await expect(team).toBeVisible(DRAWN);
  const widthOf = async () => (await boxOf(team)).width;
  const open = await widthOf();

  await page.keyboard.press('Control+b');
  await expect.poll(widthOf).toBeLessThan(open / 2);

  await page.keyboard.press('Control+b');
  await expect.poll(widthOf).toBe(open);
});
