import { type Page } from '@playwright/test';

import { expect } from './fixtures';

/**
 * Returns once `page` has hydrated and run the effects of that pass, so its controls answer the next input. Read
 * off the header's theme switch, which is disabled until then.
 */
export async function waitForHydration(page: Page): Promise<void> {
  await expect(page.getByRole('banner').getByRole('button', { name: 'Toggle theme' })).toBeEnabled();
}
