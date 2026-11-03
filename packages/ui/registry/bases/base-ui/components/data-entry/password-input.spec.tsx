import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { InputGroupAddon } from '@/registry/bases/base-ui/ui/input-group';

import { PasswordInput, PasswordInputInput, PasswordInputToggle } from './password-input';

afterEach(cleanup);

function root(): HTMLElement {
  // Testing Library mounts each render in a div appended to the body; the component's root is its first child.
  return document.body.firstElementChild?.firstElementChild as HTMLElement;
}

describe('PasswordInput', () => {
  it('toggles the input between hidden and shown, pressing the toggle and carrying data-visible while shown', () => {
    render(
      <PasswordInput>
        <PasswordInputInput aria-label="Password" />
        <InputGroupAddon align="inline-end">
          <PasswordInputToggle aria-label="Show password" />
        </InputGroupAddon>
      </PasswordInput>,
    );
    const input = screen.getByLabelText('Password') as HTMLInputElement;
    const toggle = screen.getByRole('button', { name: 'Show password' });

    expect(input.type).toBe('password');
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    expect(root().hasAttribute('data-visible')).toBe(false);

    fireEvent.click(toggle);
    expect(input.type).toBe('text');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(root().hasAttribute('data-visible')).toBe(true);

    fireEvent.click(toggle);
    expect(input.type).toBe('password');
    expect(root().hasAttribute('data-visible')).toBe(false);
  });

  it('passes the input props through to the input', () => {
    const onChange = vi.fn();
    render(
      <PasswordInput>
        <PasswordInputInput aria-label="Password" name="secret" onChange={onChange} />
      </PasswordInput>,
    );
    const input = screen.getByLabelText('Password') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'hunter2' } });
    expect(input.name).toBe('secret');
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
