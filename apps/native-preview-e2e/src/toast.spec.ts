import { expect, test } from '@playwright/test';

import { DRAWN, openDemo } from './test/preview';

test('F6 moves focus to the stack of toasts while one is shown', async ({ page }) => {
  await openDemo(page, 'toast-demo');
  const stack = page.getByRole('region', { name: 'Notifications', exact: true });

  await page.getByRole('button', { name: 'Show Toast' }).click(DRAWN);
  await expect(stack.getByText('Event created')).toBeVisible();
  await page.keyboard.press('F6');

  await expect(stack).toBeFocused();
});
