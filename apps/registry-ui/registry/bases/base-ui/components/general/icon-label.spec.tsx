import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';

import { IconLabel } from './icon-label';

beforeAll(() => {
  // Base UI's tooltip positioning needs ResizeObserver, absent in jsdom.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(cleanup);

describe('IconLabel', () => {
  it('holds the icon it is given and sizes an unsized svg to the compact glyph', () => {
    render(
      <IconLabel aria-label="Rotation">
        <svg data-testid="star" />
      </IconLabel>,
    );
    const label = screen.getByLabelText('Rotation');
    expect(label.getAttribute('data-slot')).toBe('icon-label');
    expect(label.contains(screen.getByTestId('star'))).toBe(true);
    expect(label.className).toContain("[&_svg:not([class*='size-'])]:size-3");
  });

  it('merges className and forwards arbitrary props onto the span', () => {
    render(
      <IconLabel className="ml-auto" data-testid="label">
        <svg />
      </IconLabel>,
    );
    const label = screen.getByTestId('label');
    expect(label.className).toContain('text-muted-foreground');
    expect(label.className).toContain('ml-auto');
  });

  it('takes the trigger props of a tooltip the consumer composes around it', () => {
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger render={<IconLabel aria-label="Rotation" />}>
            <svg />
          </TooltipTrigger>
          <TooltipContent>Rotation</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    const label = screen.getByLabelText('Rotation');
    expect(label.className).toContain('text-muted-foreground');
    expect(label.hasAttribute('data-popup-open')).toBe(true);
    expect(screen.getByText('Rotation', { selector: '[data-slot="tooltip-content"]' })).toBeTruthy();
  });
});
