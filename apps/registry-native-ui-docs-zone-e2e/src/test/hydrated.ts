import { type Page } from '@playwright/test';

import { expect } from './fixtures';

/**
 * Returns once `page` has hydrated and run the effects of that pass, so its controls answer the next input. Read
 * off the header's theme switch, which is disabled until then. An open modal sheet takes the header out of the
 * accessibility tree, so the switch is found among hidden elements too.
 */
export async function waitForHydration(page: Page): Promise<void> {
  await expect(
    page
      .getByRole('banner', { includeHidden: true })
      .getByRole('button', { name: 'Toggle theme', includeHidden: true }),
  ).toBeEnabled();
}
