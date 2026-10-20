import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  PasswordStrength,
  PasswordStrengthMeter,
  PasswordStrengthRequirement,
  PasswordStrengthRequirements,
} from './password-strength';

afterEach(cleanup);

const WORDS = { weak: 'Weak', fair: 'Fair', strong: 'Strong' } as const;

function strengthOf(strength: keyof typeof WORDS): ReactNode {
  return (
    <PasswordStrength strength={strength}>
      <PasswordStrengthMeter valueText={WORDS[strength]}>Password strength</PasswordStrengthMeter>
      <PasswordStrengthRequirements>
        <PasswordStrengthRequirement met>At least 15 characters</PasswordStrengthRequirement>
      </PasswordStrengthRequirements>
    </PasswordStrength>
  );
}

describe('PasswordStrength', () => {
  it.each([
    ['weak', 1],
    ['fair', 2],
    ['strong', 3],
  ] as const)('sets the meter to step %s of three and shows its word', (strength, step) => {
    const { container } = render(strengthOf(strength));
    const meter = screen.getByRole('progressbar', { name: 'Password strength' });

    expect(meter.getAttribute('aria-valuenow')).toBe(String(step));
    expect(meter.getAttribute('aria-valuemax')).toBe('3');
    expect(meter.getAttribute('aria-valuetext')).toBe(WORDS[strength]);
    expect(container.querySelector('[data-slot=password-strength]')?.getAttribute('data-strength')).toBe(strength);
    expect(container.querySelector('[data-slot=progress-value]')?.textContent).toBe(WORDS[strength]);
  });

  it('announces a change of strength politely', () => {
    const { rerender } = render(strengthOf('weak'));
    const status = screen.getByRole('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.textContent).toContain('Weak');

    rerender(strengthOf('fair'));
    expect(screen.getByRole('status').textContent).toContain('Fair');
  });

  it('marks a met requirement with the circle-check and an unmet one with the circle', () => {
    render(
      <PasswordStrengthRequirements>
        <PasswordStrengthRequirement met>At least 15 characters</PasswordStrengthRequirement>
        <PasswordStrengthRequirement met={false}>Not your name or email</PasswordStrengthRequirement>
      </PasswordStrengthRequirements>,
    );
    const [met, unmet] = screen.getAllByRole('listitem');

    expect(met?.textContent).toBe('At least 15 characters');
    expect(met?.hasAttribute('data-met')).toBe(true);
    expect(met?.querySelector('[data-slot=circle-check-icon]')).not.toBeNull();
    expect(met?.querySelector('[data-slot=circle-icon]')).toBeNull();

    expect(unmet?.textContent).toBe('Not your name or email');
    expect(unmet?.hasAttribute('data-met')).toBe(false);
    expect(unmet?.querySelector('[data-slot=circle-icon]')).not.toBeNull();
    expect(unmet?.querySelector('[data-slot=circle-check-icon]')).toBeNull();
  });
});
