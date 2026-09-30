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
  it('holds the icon it is given, named by its aria-label', () => {
    render(
      <IconChip aria-label="Vision input">
        <svg data-testid="glyph" />
      </IconChip>,
    );
    expect(screen.getByLabelText('Vision input').contains(screen.getByTestId('glyph'))).toBe(true);
  });

  it('serves as the trigger of a tooltip the consumer composes around it', () => {
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger render={<IconChip aria-label="Reasoning" />}>
            <svg />
          </TooltipTrigger>
          <TooltipContent>Shows its reasoning</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(screen.getByLabelText('Reasoning')).toBeTruthy();
    expect(screen.getByText('Shows its reasoning')).toBeTruthy();
  });
});
