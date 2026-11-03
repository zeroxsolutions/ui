import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  UnsavedChangesToolbar,
  UnsavedChangesToolbarActions,
  UnsavedChangesToolbarMessage,
  UnsavedChangesToolbarReset,
  UnsavedChangesToolbarSave,
  type UnsavedChangesToolbarState,
} from './unsaved-changes-toolbar';

afterEach(cleanup);

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

function root(): HTMLElement {
  const element = document.querySelector<HTMLElement>('[data-slot=unsaved-changes-toolbar]');
  if (!element) throw new Error('no toolbar rendered');
  return element;
}

describe('UnsavedChangesToolbar', () => {
  it('sits at the bottom unless told the top', () => {
    const { rerender } = render(<UnsavedChangesToolbar />);
    expect(root().getAttribute('data-side')).toBe('bottom');

    rerender(<UnsavedChangesToolbar side="top" />);
    expect(root().getAttribute('data-side')).toBe('top');
  });

  it.each(['default', 'saving', 'error', 'attention'] as const)('carries the %s state for its tone', (state) => {
    render(toolbar(state));

    expect(root().getAttribute('data-state')).toBe(state);
  });

  it('is a group named by its message, and the message is a polite live region', () => {
    render(toolbar('default'));
    const status = screen.getByRole('status');

    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.textContent).toBe('You have unsaved changes.');
    expect(screen.getByRole('group', { name: 'You have unsaved changes.' })).toBe(root());
  });

  it('mounts its live region empty and fills it after, so the first message is announced', () => {
    const first = document.createElement('div');
    first.innerHTML = renderToString(toolbar('default'));
    expect(first.querySelector('[role=status]')?.textContent).toBe('');

    render(toolbar('default'));
    expect(screen.getByRole('status').textContent).toBe('You have unsaved changes.');
  });

  it('while saving disables both actions and shows a spinner in Save, keeping focus on it', () => {
    const onSave = vi.fn();
    const { rerender } = render(toolbar('default', onSave));
    const save = screen.getByRole('button', { name: 'Save changes' });
    expect(save.querySelector('[data-slot=spinner]')).toBeNull();

    save.focus();
    rerender(toolbar('saving', onSave));

    const saving = screen.getByRole('button', { name: 'Saving...' });
    expect(saving).toBe(save);
    expect(saving.getAttribute('aria-disabled')).toBe('true');
    expect(saving.querySelector('[data-slot=spinner]')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Reset' }).getAttribute('aria-disabled')).toBe('true');
    expect(document.activeElement).toBe(saving);

    fireEvent.click(saving);
    expect(onSave).not.toHaveBeenCalled();
  });

  it.each(['default', 'error', 'attention'] as const)('leaves both actions enabled in the %s state', (state) => {
    const onSave = vi.fn();
    render(toolbar(state, onSave));
    const save = screen.getByRole('button', { name: 'Save changes' });

    expect(save.getAttribute('aria-disabled')).not.toBe('true');
    expect(screen.getByRole('button', { name: 'Reset' }).getAttribute('aria-disabled')).not.toBe('true');
    fireEvent.click(save);
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
