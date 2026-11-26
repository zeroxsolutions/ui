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

test.describe('at phone width', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('closing the sidebar sheet gives the focus back to the control that opened it', async ({ page }) => {
    await openDemo(page, 'sidebar-demo');
    const toggle = page.getByRole('button', { name: 'Toggle Sidebar' }).filter({ visible: true }).first();
    await toggle.click(DRAWN);
    const item = page.getByRole('dialog', { name: 'Sidebar' }).getByRole('button', { name: 'Playground' });
    await expect(item).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(item).toBeHidden();
    await expect(toggle).toBeFocused();
  });
});
