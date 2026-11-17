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
});
