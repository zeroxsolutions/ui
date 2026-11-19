import {
  CheckIcon as LucideCheckIcon,
  ChevronDownIcon as LucideChevronDownIcon,
  Maximize2Icon as LucideMaximize2Icon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '../../../../test/nova-style.css';
import { Button } from '../../../../registry/bases/base-ui/ui/button';
import { TestHost } from '../../../test/test-host';
import { StylePicker } from '../navigation/style-picker';

import { ExampleViewLink } from './example-view-link';

function sizeOf(element: Element): { width: number; height: number } {
  const { width, height } = element.getBoundingClientRect();
  return { width, height };
}

function Stage({ children }: { children: ReactNode }): ReactNode {
  return (
    <TestHost pathname="/docs/installation">
      <div className="style-nova relative">{children}</div>
    </TestHost>
  );
}

// An icon inside its control keeps the size lucide-react's drew at there, which the control's own rule sets.
describe('the docs chrome icons', () => {
  it("draws the preview link's icon at the size lucide-react's drew at", async () => {
    await render(
      <Stage>
        <ExampleViewLink name="x-demo" href="/view/x-demo" />
        <Button variant="ghost" size="icon-sm" aria-label="reference">
          <LucideMaximize2Icon />
        </Button>
      </Stage>,
    );

    const ours = page
      .getByRole('link', { name: /Open x-demo/ })
      .element()
      .querySelector('svg');
    const reference = page.getByRole('button', { name: 'reference' }).element().querySelector('svg');
    expect(sizeOf(ours as Element)).toEqual(sizeOf(reference as Element));
    expect(sizeOf(ours as Element).width).toBeGreaterThan(0);
  });

  it("draws the style picker's chevron at the size lucide-react's drew at", async () => {
    await render(
      <Stage>
        <StylePicker platform="web" />
        <Button variant="ghost" size="sm" aria-label="reference">
          Style
          <LucideChevronDownIcon />
        </Button>
      </Stage>,
    );

    const ours = page
      .getByRole('button', { name: /^Style/ })
      .first()
      .element()
      .querySelector('svg');
    const reference = page.getByRole('button', { name: 'reference' }).element().querySelector('svg');
    expect(sizeOf(ours as Element)).toEqual(sizeOf(reference as Element));
    expect(sizeOf(ours as Element).width).toBeGreaterThan(0);
  });

  it("draws the style picker's check at the size lucide-react's drew at", async () => {
    await render(
      <Stage>
        <StylePicker platform="web" />
        <LucideCheckIcon className="size-4" data-testid="reference" />
      </Stage>,
    );
    await userEvent.click(page.getByRole('button', { name: /^Style/ }));

    const item = page.getByRole('menuitem', { name: 'Nova' });
    await expect.element(item).toBeVisible();
    const ours = item.element().querySelector('svg');
    const reference = page.getByTestId('reference').element();
    expect(sizeOf(ours as Element)).toEqual(sizeOf(reference));
    expect(sizeOf(reference).width).toBe(16);
  });

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
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(before).not.toBe('');
    expect(drawing()).toBe(before);
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
