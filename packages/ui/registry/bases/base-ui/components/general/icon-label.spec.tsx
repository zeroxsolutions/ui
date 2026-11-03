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
  it('names the control it is tied to with the words beside its icon', () => {
    render(
      <>
        <IconLabel htmlFor="rotation">
          <svg aria-hidden />
          <span className="sr-only">Rotation</span>
        </IconLabel>
        <input id="rotation" type="number" />
      </>,
    );
    expect(screen.getByRole('spinbutton', { name: 'Rotation' })).toBeTruthy();
  });

  it('serves as the trigger of a tooltip the consumer composes around it', () => {
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger render={<IconLabel htmlFor="rotation" />}>
            <svg aria-hidden />
            <span className="sr-only">Rotation</span>
          </TooltipTrigger>
          <TooltipContent>Rotate the layer</TooltipContent>
        </Tooltip>
        <input id="rotation" type="number" />
      </TooltipProvider>,
    );
    expect(screen.getByRole('spinbutton', { name: 'Rotation' })).toBeTruthy();
    expect(screen.getByText('Rotate the layer')).toBeTruthy();
  });
});
