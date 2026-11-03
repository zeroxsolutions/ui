import { render, cleanup, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Popover } from '@/registry/bases/base-ui/ui/popover';
import { RectPopover } from './rect-popover.js';

afterEach(() => {
  cleanup();
});

describe('RectPopover', () => {
  it('positions the popup against the rect it is given', async () => {
    const { getByText } = render(
      <Popover open>
        <RectPopover rect={{ top: 100, bottom: 120, left: 200, right: 210 }} side="bottom" align="start" sideOffset={0}>
          menu
        </RectPopover>
      </Popover>,
    );

    const positioner = getByText('menu').parentElement as HTMLElement;
    // jsdom has no viewport, so the side flips; the anchor's size and x hold.
    await waitFor(() => {
      expect(positioner.style.getPropertyValue('--anchor-width')).toBe('10px');
      expect(positioner.style.getPropertyValue('--anchor-height')).toBe('20px');
      expect(positioner.style.transform).toMatch(/^translate\(200px, /);
    });
  });
});
