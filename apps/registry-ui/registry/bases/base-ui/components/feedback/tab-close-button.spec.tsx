import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TabCloseButton } from './tab-close-button';

afterEach(cleanup);

describe('TabCloseButton', () => {
  it('marks a dirty tab with data-dirty and shows the unsaved mark inside the button', () => {
    render(<TabCloseButton dirty />);
    const button = screen.getByRole('button', { name: 'Close' });
    expect(button.hasAttribute('data-dirty')).toBe(true);
    expect(within(button).getByRole('img', { name: 'Unsaved changes' })).toBeTruthy();
  });

  it('shows no unsaved mark for a clean tab', () => {
    render(<TabCloseButton />);
    const button = screen.getByRole('button', { name: 'Close' });
    expect(button.hasAttribute('data-dirty')).toBe(false);
    expect(within(button).queryByRole('img', { name: 'Unsaved changes' })).toBeNull();
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
