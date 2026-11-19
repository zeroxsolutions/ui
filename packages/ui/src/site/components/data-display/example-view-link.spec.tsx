import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { forwardRef, useImperativeHandle } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ExampleViewLink } from './example-view-link';

const { startAnimation, stopAnimation } = vi.hoisted(() => ({ startAnimation: vi.fn(), stopAnimation: vi.fn() }));

// The icon's handle is the seam: the link drives it, and the motion behind it is the icon's own.
vi.mock('../../../../registry/bases/base-ui/icons/lucide/maximize-2-icon', () => ({
  Maximize2Icon: forwardRef(function Maximize2Icon(_props, ref) {
    useImperativeHandle(ref, () => ({ startAnimation, stopAnimation }));
    return null;
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ExampleViewLink', () => {
  it('opens the demo page in a new tab under a label naming the demo', () => {
    render(<ExampleViewLink name="button-demo" href="/view/button-demo" />);

    const link = screen.getByRole('link', { name: 'Open button-demo in a new tab' });
    expect(link.getAttribute('href')).toBe('/view/button-demo');
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('plays its icon while the pointer or the focus is on it, and stops it as either leaves', () => {
    render(<ExampleViewLink name="button-demo" href="/view/button-demo" />);
    const link = screen.getByRole('link');

    fireEvent.pointerEnter(link);
    expect(startAnimation).toHaveBeenCalledTimes(1);
    fireEvent.pointerLeave(link);
    expect(stopAnimation).toHaveBeenCalledTimes(1);

    fireEvent.focus(link);
    expect(startAnimation).toHaveBeenCalledTimes(2);
    fireEvent.blur(link);
    expect(stopAnimation).toHaveBeenCalledTimes(2);
  });
});
