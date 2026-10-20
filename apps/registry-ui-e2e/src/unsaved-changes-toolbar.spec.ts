import { expect, test } from './test/fixtures';

test('the unsaved changes toolbar saves without moving focus, and offers a retry when the save fails', async ({
  page,
}) => {
  await page.goto('/docs/components/unsaved-changes-toolbar');
  const name = page.getByLabel('Display name');
  const toolbar = page.getByRole('group', { name: /changes/ });

  // A value filled before hydration never reaches the demo's state, and filling the same value again
  // changes nothing React sees, so each try clears the field first.
  await expect(async () => {
    await name.fill('');
    await name.fill('Ada King');
    await expect(toolbar).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await expect(page.getByRole('status').filter({ hasText: 'You have unsaved changes.' })).toBeVisible();

  const save = toolbar.getByRole('button', { name: 'Save changes' });
  await save.click();
  const saving = toolbar.getByRole('button', { name: 'Saving...' });
  await expect(saving).toHaveAttribute('aria-disabled', 'true');
  await expect(saving).toBeFocused();
  await expect(toolbar.getByRole('button', { name: 'Reset' })).toHaveAttribute('aria-disabled', 'true');

  // The demo's first save fails.
  await expect(page.getByRole('status').filter({ hasText: "Couldn't save your changes." })).toBeVisible();
  await toolbar.getByRole('button', { name: 'Try again' }).click();
  await expect(toolbar).toBeHidden();
  await expect(name).toHaveValue('Ada King');
});
