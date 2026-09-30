import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ItemActions, ItemContent } from '@/registry/bases/base-ui/ui/item';

import { EditorTab, EditorTabCloseButton, EditorTabTitle } from './editor-tab';

afterEach(cleanup);

function Tab({ dirty, onClose, onActivate }: { dirty?: boolean; onClose?: () => void; onActivate?: () => void }) {
  return (
    <EditorTab dirty={dirty} onClick={onActivate}>
      <ItemContent>
        <EditorTabTitle>page.tsx</EditorTabTitle>
      </ItemContent>
      <ItemActions>
        <EditorTabCloseButton aria-label="Close page.tsx" onClick={onClose} />
      </ItemActions>
    </EditorTab>
  );
}

describe('EditorTab', () => {
  it('shows the unsaved mark inside the close button of a dirty tab', () => {
    render(<Tab dirty />);
    const button = screen.getByRole('button', { name: 'Close page.tsx' });
    expect(within(button).getByRole('img', { name: 'Unsaved changes' })).toBeTruthy();
  });

  it('shows no unsaved mark on a clean tab', () => {
    render(<Tab />);
    expect(screen.queryByRole('img', { name: 'Unsaved changes' })).toBeNull();
  });

  it('closes without also activating the tab', () => {
    const onClose = vi.fn();
    const onActivate = vi.fn();
    render(<Tab onClose={onClose} onActivate={onActivate} />);

    fireEvent.click(screen.getByRole('button', { name: 'Close page.tsx' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onActivate).not.toHaveBeenCalled();
  });

  it('names the close button "Close" when the consumer gives no label', () => {
    render(
      <EditorTab>
        <EditorTabCloseButton />
      </EditorTab>,
    );
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
  });
});
