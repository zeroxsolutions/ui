import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '../../../../test/nova-style.css';
import { drawingIn, expectPlaying, playMotion, settled } from '../../../../test/motion';
import { drawingsOver } from '../../../test/drawings-over';
import { TestHost } from '../../../test/test-host';
import { StylePicker } from '../navigation/style-picker';

import { ExampleViewLink } from './example-view-link';

function Stage({ children }: { children: ReactNode }): ReactNode {
  return (
    <TestHost pathname="/docs/installation">
      <div className="style-nova relative">{children}</div>
    </TestHost>
  );
}

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

describe('the style picker in the docs chrome', () => {
  // The browser project runs as a reader who asked for reduced motion.
  it("leaves the style in use's check as drawn under reduced motion", async () => {
    await render(
      <Stage>
        <StylePicker platform="web" />
      </Stage>,
    );
    await userEvent.click(page.getByRole('button', { name: /^Style/ }));
    const item = page.getByRole('menuitem', { name: 'Nova' });
    await expect.element(item).toBeVisible();
    const drawing = (): string => item.element().querySelector('svg')?.outerHTML ?? '';
    const before = drawing();

    await userEvent.hover(item);
    const drawings = await drawingsOver(drawing, 500);

    expect(before).not.toBe('');
    expect(drawings).toEqual(new Set([before]));
  }, 20_000);

  // The picker starts a row's check on the row's focus, so the arrow keys play it by moving the focus onto it.
  it('moves the focus, which plays the check, onto the style in use as the arrow keys reach it', async () => {
    await render(
      <Stage>
        <StylePicker platform="web" />
      </Stage>,
    );
    await userEvent.click(page.getByRole('button', { name: /^Style/ }));
    const inUse = page.getByRole('menuitem', { name: 'Nova' });
    await expect.element(inUse).toBeVisible();

    for (let press = 0; press < 8 && document.activeElement !== inUse.element(); press += 1) {
      await userEvent.keyboard('{ArrowDown}');
    }

    await expect.element(inUse).toHaveFocus();
  });
});
