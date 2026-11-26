import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { InputGroupAddon } from '@/registry/bases/base-ui/ui/input-group';

import { PasswordInput, PasswordInputInput, PasswordInputToggle } from './password-input';

describe('PasswordInput', () => {
  it('shows the typed password while its toggle is pressed, and hides it again', async () => {
    await render(
      <PasswordInput>
        <PasswordInputInput aria-label="Password" />
        <InputGroupAddon align="inline-end">
          <PasswordInputToggle aria-label="Show password" />
        </InputGroupAddon>
      </PasswordInput>,
    );
    const input = page.getByLabelText('Password', { exact: true });
    const toggle = page.getByRole('button', { name: 'Show password' });

    await expect.element(input).toHaveAttribute('type', 'password');
    await expect.element(toggle).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(toggle);
    await expect.element(input).toHaveAttribute('type', 'text');
    await expect.element(toggle).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(toggle);
    await expect.element(input).toHaveAttribute('type', 'password');
    await expect.element(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  it('passes the input props through to the input', async () => {
    const onChange = vi.fn();
    await render(
      <PasswordInput>
        <PasswordInputInput aria-label="Password" name="secret" onChange={onChange} />
      </PasswordInput>,
    );
    const input = page.getByLabelText('Password', { exact: true });

    await userEvent.fill(input, 'hunter2');
    await expect.element(input).toHaveAttribute('name', 'secret');
    expect(onChange).toHaveBeenCalled();
  });
});
