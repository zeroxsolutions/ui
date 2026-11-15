import { type Page } from '@playwright/test';

import { expect } from './fixtures';

/**
 * Returns once `page` has hydrated, read off the header's style picker, whose menu opens only then. Leaves
 * the menu closed again.
 */
export async function waitForHydration(page: Page): Promise<void> {
  await expect(async () => {
    await page.getByRole('button', { name: /^Style/ }).click();
    await expect(page.getByRole('menu')).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);
}
