import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TabCloseButton } from './tab-close-button';

afterEach(cleanup);

describe('TabCloseButton', () => {
  it('marks a dirty tab with data-dirty and renders the unsaved dot beside the X', () => {
    render(<TabCloseButton dirty />);
    const button = screen.getByRole('button', { name: 'Close' });
    expect(button.hasAttribute('data-dirty')).toBe(true);
    expect(button.querySelector('[data-slot="unsaved-indicator"]')).toBeTruthy();
    expect(button.querySelector('.lucide-x')).toBeTruthy();
  });

  it('renders only the X for a clean tab', () => {
    render(<TabCloseButton />);
    const button = screen.getByRole('button', { name: 'Close' });
    expect(button.hasAttribute('data-dirty')).toBe(false);
    expect(button.querySelector('[data-slot="unsaved-indicator"]')).toBeNull();
    expect(button.querySelector('.lucide-x')).toBeTruthy();
  });

  it('marks itself with its slot', () => {
    render(<TabCloseButton />);
    expect(screen.getByRole('button', { name: 'Close' }).dataset.slot).toBe('tab-close-button');
  });

  it('calls onClick and stops propagation so the tab is not also activated', () => {
    const onClick = vi.fn();
    const onRowClick = vi.fn();
    render(
      <div onClick={onRowClick}>
        <TabCloseButton onClick={onClick} />
      </div>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onRowClick).not.toHaveBeenCalled();
  });
});
