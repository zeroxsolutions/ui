import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { PopoverIconButton } from './popover-icon-button';

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.getAnimations ??= () => [];
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(cleanup);

describe('PopoverIconButton', () => {
  it('names the trigger and opens the popover body on click', async () => {
    render(
      <PopoverIconButton tooltip="Settings" icon={<span>icon</span>} ariaLabel="Open settings">
        <div>Popover body</div>
      </PopoverIconButton>,
    );

    const trigger = screen.getByRole('button', { name: 'Open settings' });
    expect(trigger).toBeTruthy();
    expect(screen.queryByText('Popover body')).toBeNull();

    fireEvent.click(trigger);
    await waitFor(() => expect(screen.getByText('Popover body')).toBeTruthy());
  });
});
