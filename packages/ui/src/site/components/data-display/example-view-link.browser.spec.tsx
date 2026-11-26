import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { drawingIn, expectPlaying, playMotion, settled } from '../../../../test/motion';

import { ExampleViewLink } from './example-view-link';

describe('ExampleViewLink', () => {
  playMotion();

  it('opens the demo page in a new tab under a label naming the demo', async () => {
    await render(<ExampleViewLink name="button-demo" href="/view/button-demo" />);

    const link = page.getByRole('link', { name: 'Open button-demo in a new tab' });
    await expect.element(link).toHaveAttribute('href', '/view/button-demo');
    await expect.element(link).toHaveAttribute('target', '_blank');
  });

  it('plays its icon while the pointer or the focus is on it', async () => {
    await render(<ExampleViewLink name="button-demo" href="/view/button-demo" />);
    const link = page.getByRole('link', { name: 'Open button-demo in a new tab' });

    await userEvent.hover(link);
    await expectPlaying(link.element(), drawingIn(link.element()));
    await userEvent.unhover(link);
    const rest = await settled(link.element());

    await userEvent.tab();
    await expect.element(link).toHaveFocus();
    await expectPlaying(link.element(), rest);
  });
});
