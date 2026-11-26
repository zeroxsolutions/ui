import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { ItemActions, ItemContent } from '@/registry/bases/base-ui/ui/item';

import { EditorTab, EditorTabCloseButton, EditorTabTitle } from './editor-tab';

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

const unsavedMark = () =>
  page
    .getByRole('button', { name: 'Close page.tsx' })
    .getByRole('img', { name: 'Unsaved changes', includeHidden: true });

describe('EditorTab', () => {
  it('shows the unsaved mark in the close button of a dirty tab until the pointer is on the tab', async () => {
    await userEvent.unhover(document.body);
    await render(<Tab dirty />);

    await expect.element(unsavedMark()).toBeVisible();

    await userEvent.hover(page.getByText('page.tsx'));
    await expect.element(unsavedMark()).not.toBeVisible();
  });

  it('shows no unsaved mark on a clean tab', async () => {
    await userEvent.unhover(document.body);
    await render(<Tab />);

    await expect.element(page.getByRole('button', { name: 'Close page.tsx' })).toBeVisible();
    await expect.element(unsavedMark()).not.toBeVisible();
  });

  it('closes without also activating the tab', async () => {
    const onClose = vi.fn();
    const onActivate = vi.fn();
    await render(<Tab onClose={onClose} onActivate={onActivate} />);

    await userEvent.click(page.getByRole('button', { name: 'Close page.tsx' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onActivate).not.toHaveBeenCalled();
  });

  it('names the close button "Close" when the consumer gives no label', async () => {
    await render(
      <EditorTab>
        <EditorTabCloseButton />
      </EditorTab>,
    );

    await expect.element(page.getByRole('button', { name: 'Close', exact: true })).toBeVisible();
  });
});
