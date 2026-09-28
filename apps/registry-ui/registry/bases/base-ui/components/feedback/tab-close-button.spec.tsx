import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TabCloseButton } from './tab-close-button';

afterEach(cleanup);

describe('TabCloseButton', () => {
  it('shows the unsaved dot (not the ×) for a dirty tab that is not revealing close', () => {
    const { container } = render(<TabCloseButton dirty revealClose={false} onClose={() => {}} />);
    expect(container.querySelector('[data-slot="unsaved-indicator"]')).toBeTruthy();
    expect(container.querySelector('.lucide-x')).toBeNull();
  });

  it('reveals the × when active/hovered, even while dirty', () => {
    const { container } = render(<TabCloseButton dirty revealClose onClose={() => {}} />);
    expect(container.querySelector('[data-slot="unsaved-indicator"]')).toBeNull();
    expect(container.querySelector('.lucide-x')).toBeTruthy();
  });

  it('fires onClose and stops propagation so the tab is not also activated', () => {
    const onClose = vi.fn();
    const onRowClick = vi.fn();
    render(
      <div onClick={onRowClick}>
        <TabCloseButton dirty={false} revealClose onClose={onClose} />
      </div>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onRowClick).not.toHaveBeenCalled();
  });
});
