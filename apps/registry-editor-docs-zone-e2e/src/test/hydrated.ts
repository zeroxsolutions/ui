import { type Locator, type Page } from '@playwright/test';

import { expect } from './fixtures';

/**
 * Returns once React has hydrated `target`. Until then a statically rendered element carries no handler,
 * so a click or a key pressed on it does nothing. React writes its props onto the element under a key
 * starting `__reactProps$` as it hydrates it, and that key is what this waits for.
 */
export async function hydrated(target: Locator): Promise<void> {
  await expect
    .poll(() =>
      target.evaluate((element: object) => Object.keys(element).some((key) => key.startsWith('__reactProps$'))),
    )
    .toBe(true);
}

/** Returns once `page`'s header has hydrated, read off its style picker. */
export async function waitForHydration(page: Page): Promise<void> {
  await hydrated(page.getByRole('button', { name: /^Style/ }));
}
