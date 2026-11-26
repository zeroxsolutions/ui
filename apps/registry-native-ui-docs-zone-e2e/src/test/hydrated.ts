import { type Locator, type Page } from '@playwright/test';

import { expect } from './fixtures';

/**
 * Returns once React has hydrated `element` and run the effects of that commit, so a handler or a listener
 * its component attaches answers the next input. Before then a click on a server-drawn control does nothing.
 */
export async function hydrated(element: Locator): Promise<void> {
  // React keeps a hydrated node's props on the node under a key named `__reactProps$<id>`.
  await expect
    .poll(() => element.evaluate((node: object) => Object.keys(node).some((key) => key.startsWith('__reactProps$'))))
    .toBe(true);
  // A commit's effects run in a task React schedules after the frame it painted in.
  await element.evaluate(
    () =>
      new Promise<void>((settled) => {
        const scope = globalThis as unknown as {
          requestAnimationFrame: (callback: () => void) => void;
          MessageChannel: new () => {
            port1: { onmessage: (() => void) | null };
            port2: { postMessage: (message: null) => void };
          };
        };
        scope.requestAnimationFrame(() => {
          const channel = new scope.MessageChannel();
          channel.port1.onmessage = () => settled();
          channel.port2.postMessage(null);
        });
      }),
  );
}

/** Returns once `page` has hydrated, read off the header's style picker. */
export async function waitForHydration(page: Page): Promise<void> {
  await hydrated(page.getByRole('button', { name: /^Style/ }));
}
