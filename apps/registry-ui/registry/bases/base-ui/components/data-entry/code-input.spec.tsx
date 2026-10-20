import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CodeInput } from './code-input';

afterEach(cleanup);

function groups(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>('[data-slot=input-otp-group]')];
}

function slots(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>('[data-slot=code-input-slot]')];
}

describe('CodeInput', () => {
  it('renders one group of six slots for the pattern "6"', () => {
    const { container } = render(<CodeInput aria-label="Verification code" />);

    expect(groups(container)).toHaveLength(1);
    expect(groups(container)[0]?.querySelectorAll('[data-slot=code-input-slot]')).toHaveLength(6);
    expect(container.querySelector('[data-slot=input-otp-separator]')).toBeNull();
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
  });

  it('renders two groups of three with a separator and one input for the pattern "3-3"', () => {
    const { container } = render(<CodeInput aria-label="Verification code" pattern="3-3" />);

    expect(groups(container).map((group) => group.querySelectorAll('[data-slot=code-input-slot]').length)).toEqual([
      3, 3,
    ]);
    expect(container.querySelectorAll('[data-slot=input-otp-separator]')).toHaveLength(1);
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
  });

  it('fills the slots left to right as the code is typed', () => {
    const onChange = vi.fn();
    const { container } = render(<CodeInput aria-label="Verification code" onChange={onChange} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '1' } });
    fireEvent.change(input, { target: { value: '12' } });

    expect(slots(container).map((slot) => slot.textContent)).toEqual(['1', '2', '', '', '', '']);
    expect(onChange).toHaveBeenLastCalledWith('12');
  });

  // A browser pastes into the one real input, which then changes by the whole code at once; the paste
  // itself is driven in a real browser by the e2e suite.
  it('fills every slot when the whole code arrives at once', () => {
    const { container } = render(<CodeInput aria-label="Verification code" pattern="3-3" />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '482913' } });

    expect(slots(container).map((slot) => slot.textContent)).toEqual(['4', '8', '2', '9', '1', '3']);
  });

  it('refuses a character outside the code', () => {
    const { container } = render(<CodeInput aria-label="Verification code" />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'a' } });

    expect(slots(container).map((slot) => slot.textContent)).toEqual(['', '', '', '', '', '']);
  });

  it('marks the input invalid when the code is', () => {
    render(<CodeInput aria-label="Verification code" aria-invalid />);

    expect(screen.getByRole('textbox').getAttribute('aria-invalid')).toBe('true');
  });
});
