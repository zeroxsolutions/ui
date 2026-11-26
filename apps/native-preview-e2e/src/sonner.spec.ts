import { expect, test } from '@playwright/test';

import { DRAWN, openDemo } from './test/preview';

test('Escape in an opened stack of toasts folds the older ones behind the newest', async ({ page }) => {
  await openDemo(page, 'sonner-demo');
  await page.getByRole('button', { name: 'With Description' }).click(DRAWN);
  await page.getByRole('button', { name: 'Success' }).click();
  const undo = page.getByRole('button', { name: 'Undo' });
  // Alt+T opens the stack and moves the focus into it, so every toast in it can be pressed.
  await page.keyboard.press('Alt+KeyT');
  await undo.click({ trial: true });

  await page.keyboard.press('Escape');

  // Folded behind the newest, the older toast's action takes no press.
  await expect(undo.click({ trial: true, timeout: 1_000 })).rejects.toThrow();
});
