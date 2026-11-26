import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp, page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

/** What a caller of the hook draws: whether it plays its motion. */
function Motion(): ReactNode {
  return <p>{usePrefersReducedMotion() ? 'Motion reduced' : 'Motion plays'}</p>;
}

function emulate(value: 'reduce' | 'no-preference'): Promise<unknown> {
  return cdp().send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value }] });
}

// The browser project runs as a reader who asked for reduced motion; each case leaves it so.
afterEach(() => emulate('reduce'));

describe('usePrefersReducedMotion', () => {
  it('reads the preference from the first render', async () => {
    await render(<Motion />);

    await expect.element(page.getByText('Motion reduced')).toBeVisible();
  });

  it('reads no preference as motion that plays', async () => {
    await emulate('no-preference');
    await render(<Motion />);

    await expect.element(page.getByText('Motion plays')).toBeVisible();
  });

  it('follows the preference as the reader changes it', async () => {
    await render(<Motion />);
    await expect.element(page.getByText('Motion reduced')).toBeVisible();

    await emulate('no-preference');
    await expect.element(page.getByText('Motion plays')).toBeVisible();

    await emulate('reduce');
    await expect.element(page.getByText('Motion reduced')).toBeVisible();
  });
});
