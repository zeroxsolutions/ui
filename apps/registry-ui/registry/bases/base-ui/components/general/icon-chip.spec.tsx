import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';

import { IconChip } from './icon-chip';

beforeAll(() => {
  // Base UI's tooltip positioning needs ResizeObserver, absent in jsdom.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(cleanup);

describe('IconChip', () => {
  it('renders the icon inside a chip tinted by className', () => {
    render(
      <IconChip aria-label="Vision input" className="bg-muted text-muted-foreground">
        <svg data-testid="glyph" />
      </IconChip>,
    );
    const chip = screen.getByLabelText('Vision input');
    expect(chip.getAttribute('data-slot')).toBe('icon-chip');
    expect(chip.contains(screen.getByTestId('glyph'))).toBe(true);
    expect(chip.className).toContain('rounded-sm');
    expect(chip.className).toContain('bg-muted');
  });

  it('sizes an unsized svg to the compact glyph', () => {
    render(
      <IconChip aria-label="Chat">
        <svg />
      </IconChip>,
    );
    expect(screen.getByLabelText('Chat').className).toContain("[&_svg:not([class*='size-'])]:size-3");
  });

  it('takes the trigger props of a tooltip the consumer composes around it', () => {
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger render={<IconChip aria-label="Reasoning" />}>
            <svg />
          </TooltipTrigger>
          <TooltipContent>Reasoning</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    const chip = screen.getByLabelText('Reasoning');
    expect(chip.className).toContain('size-5');
    expect(chip.hasAttribute('data-popup-open')).toBe(true);
    expect(screen.getByText('Reasoning', { selector: '[data-slot="tooltip-content"]' })).toBeTruthy();
  });
});
