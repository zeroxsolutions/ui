import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PasswordInput } from './password-input';

afterEach(cleanup);

function root(): HTMLElement {
  return document.querySelector<HTMLElement>('[data-slot="input-group"]')!;
}

describe('PasswordInput', () => {
  it('toggles the input between hidden and shown, and carries data-visible while shown', () => {
    render(<PasswordInput aria-label="Password" />);
    const input = screen.getByLabelText('Password') as HTMLInputElement;

    expect(root().getAttribute('data-slot')).toBe('input-group');
    expect(input.type).toBe('password');
    expect(root().hasAttribute('data-visible')).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input.type).toBe('text');
    expect(root().hasAttribute('data-visible')).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(input.type).toBe('password');
    expect(root().hasAttribute('data-visible')).toBe(false);
  });

  it('passes the input props through to the input', () => {
    const onChange = vi.fn();
    render(<PasswordInput aria-label="Password" name="secret" onChange={onChange} />);
    const input = screen.getByLabelText('Password') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'hunter2' } });
    expect(input.name).toBe('secret');
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
