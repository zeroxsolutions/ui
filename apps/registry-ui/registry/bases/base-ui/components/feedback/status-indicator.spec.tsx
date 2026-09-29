import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { StatusIndicator } from './status-indicator';

afterEach(cleanup);

const dot = (container: HTMLElement): HTMLElement => container.firstChild as HTMLElement;

describe('StatusIndicator', () => {
  it('carries its tone on data-tone', () => {
    const { container } = render(<StatusIndicator tone="busy" />);
    expect(dot(container).dataset.tone).toBe('busy');
  });

  it('carries data-pulse only while pulsing', () => {
    const { container, rerender } = render(<StatusIndicator tone="idle" pulse />);
    expect(dot(container).hasAttribute('data-pulse')).toBe(true);
    rerender(<StatusIndicator tone="idle" />);
    expect(dot(container).hasAttribute('data-pulse')).toBe(false);
  });

  it('marks itself with its slot', () => {
    const { container } = render(<StatusIndicator tone="online" />);
    expect(dot(container).dataset.slot).toBe('status-indicator');
  });

  it('merges a passed className', () => {
    const { container } = render(<StatusIndicator tone="online" className="size-1.5" />);
    expect(dot(container).className).toContain('size-1.5');
  });
});
