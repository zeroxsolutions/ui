import type { ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import {
  UnsavedChangesToolbar,
  UnsavedChangesToolbarActions,
  UnsavedChangesToolbarMessage,
  UnsavedChangesToolbarReset,
  UnsavedChangesToolbarSave,
  type UnsavedChangesToolbarState,
} from './unsaved-changes-toolbar';

function toolbar(state: UnsavedChangesToolbarState, onSave = vi.fn()): ReactNode {
  return (
    <UnsavedChangesToolbar state={state}>
      <UnsavedChangesToolbarMessage>
        {state === 'saving' ? 'Saving your changes...' : 'You have unsaved changes.'}
      </UnsavedChangesToolbarMessage>
      <UnsavedChangesToolbarActions>
        <UnsavedChangesToolbarReset>Reset</UnsavedChangesToolbarReset>
        <UnsavedChangesToolbarSave onClick={onSave}>
          {state === 'saving' ? 'Saving...' : 'Save changes'}
        </UnsavedChangesToolbarSave>
      </UnsavedChangesToolbarActions>
    </UnsavedChangesToolbar>
  );
}

describe('UnsavedChangesToolbar', () => {
  it('is a group named by its message, and the message is a polite live region', async () => {
    await render(toolbar('default'));
    const status = page.getByRole('status');

    await expect.element(status).toHaveAttribute('aria-live', 'polite');
    await expect.element(status).toHaveTextContent('You have unsaved changes.');
    await expect.element(page.getByRole('group', { name: 'You have unsaved changes.' })).toBeVisible();
  });

  it('mounts its live region empty and fills it after, so the first message is announced', async () => {
    const first = document.createElement('div');
    first.innerHTML = renderToString(toolbar('default'));
    expect(first.querySelector('[role=status]')?.textContent).toBe('');

    await render(toolbar('default'));
    await expect.element(page.getByRole('status')).toHaveTextContent('You have unsaved changes.');
  });

  it('while saving disables both actions and shows a spinner in Save, keeping focus on it', async () => {
    const onSave = vi.fn();
    const screen = await render(toolbar('default', onSave));
    await expect
      .element(page.getByRole('button', { name: 'Save changes' }).getByTestId('spinner'))
      .not.toBeInTheDocument();
    await userEvent.tab();
    await userEvent.tab();
    await expect.element(page.getByRole('button', { name: 'Save changes' })).toHaveFocus();

    await screen.rerender(toolbar('saving', onSave));

    const saving = page.getByRole('button', { name: 'Saving...' });
    await expect.element(saving).toHaveAttribute('aria-disabled', 'true');
    await expect.element(saving.getByTestId('spinner')).toBeVisible();
    await expect.element(page.getByRole('button', { name: 'Reset' })).toHaveAttribute('aria-disabled', 'true');
    await expect.element(saving).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    expect(onSave).not.toHaveBeenCalled();
  });

  it.each(['default', 'error', 'attention'] as const)('leaves both actions enabled in the %s state', async (state) => {
    const onSave = vi.fn();
    await render(toolbar(state, onSave));

    await expect.element(page.getByRole('button', { name: 'Reset' })).not.toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(page.getByRole('button', { name: 'Save changes' }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
