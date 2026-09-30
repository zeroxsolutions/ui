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
  it('holds the icon it is given, named by its aria-label', () => {
    render(
      <IconLabel aria-label="Rotation">
        <svg data-testid="star" />
      </IconLabel>,
    );
    expect(screen.getByLabelText('Rotation').contains(screen.getByTestId('star'))).toBe(true);
  });

  it('forwards the props it was not asked for onto the span', () => {
    render(
      <IconLabel id="rotation" aria-label="Rotation">
        <svg />
      </IconLabel>,
    );
    expect(screen.getByLabelText('Rotation').id).toBe('rotation');
  });

  it('serves as the trigger of a tooltip the consumer composes around it', () => {
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger render={<IconLabel aria-label="Rotation" />}>
            <svg />
          </TooltipTrigger>
          <TooltipContent>Rotate the layer</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(screen.getByLabelText('Rotation')).toBeTruthy();
    expect(screen.getByText('Rotate the layer')).toBeTruthy();
  });
});
