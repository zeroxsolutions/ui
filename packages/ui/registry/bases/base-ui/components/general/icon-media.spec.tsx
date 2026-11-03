import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';

import { IconMedia } from './icon-media';

beforeAll(() => {
  // Base UI's tooltip positioning needs ResizeObserver, absent in jsdom.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(cleanup);

describe('IconMedia', () => {
  it('holds the icon it is given, named by its aria-label', () => {
    render(
      <IconMedia aria-label="Vision input">
        <svg data-testid="glyph" />
      </IconMedia>,
    );
    expect(screen.getByLabelText('Vision input').contains(screen.getByTestId('glyph'))).toBe(true);
  });

  it('serves as the trigger of a tooltip the consumer composes around it', () => {
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger render={<IconMedia aria-label="Reasoning" />}>
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
