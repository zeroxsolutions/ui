import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { StatusIndicator } from './status-indicator';

afterEach(cleanup);

const dot = (container: HTMLElement): HTMLElement => container.firstChild as HTMLElement;

describe('StatusIndicator', () => {
  it('is hidden from assistive technology, so the text beside it carries the status', () => {
    const { container } = render(<StatusIndicator tone="online" />);
    expect(dot(container).getAttribute('aria-hidden')).toBe('true');
  });

  it('forwards the props it was not asked for', () => {
    const { container } = render(<StatusIndicator tone="online" id="presence" />);
    expect(dot(container).id).toBe('presence');
  });
});
