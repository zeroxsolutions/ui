import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { UnsavedChangesToolbarDemo } from './unsaved-changes-toolbar-demo';

/** Covers the demo's save delay, which a save waits out before it settles. */
const SAVED = { timeout: 5_000 };

describe('UnsavedChangesToolbarDemo', () => {
  it('resets to the saved name, saves without moving focus, offers a retry when the save fails, and hands focus back to the field', async () => {
    await render(<UnsavedChangesToolbarDemo />);
    const name = page.getByLabelText('Display name');
    const toolbar = page.getByRole('group', { name: /changes/ });

    await userEvent.fill(name, 'Ada King');
    await expect.element(page.getByRole('status')).toHaveTextContent('You have unsaved changes.');

    await userEvent.click(toolbar.getByRole('button', { name: 'Reset' }));
    await expect.element(toolbar).not.toBeInTheDocument();
    await expect.element(name).toHaveValue('Ada Lovelace');
    await expect.element(name).toHaveFocus();

    await userEvent.fill(name, 'Ada King');
    await userEvent.click(toolbar.getByRole('button', { name: 'Save changes' }));
    const saving = toolbar.getByRole('button', { name: 'Saving...' });
    await expect.element(saving).toHaveAttribute('aria-disabled', 'true');
    await expect.element(saving).toHaveFocus();
    await expect.element(toolbar.getByRole('button', { name: 'Reset' })).toHaveAttribute('aria-disabled', 'true');

    // The demo's first save fails.
    await expect.element(page.getByRole('status'), SAVED).toHaveTextContent("Couldn't save your changes.");
    await userEvent.click(toolbar.getByRole('button', { name: 'Try again' }));
    await expect.element(toolbar, SAVED).not.toBeInTheDocument();
    await expect.element(name).toHaveValue('Ada King');
    await expect.element(name).toHaveFocus();
  });
});
