import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createElement, forwardRef, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  PasswordStrength,
  PasswordStrengthMeter,
  PasswordStrengthRequirement,
  PasswordStrengthRequirements,
} from './password-strength';

/**
 * Motion's hooks are replaced by recording stand-ins: jsdom runs no animation frame, so a case asserts
 * which controls an icon started, not a value it never animates.
 */
const motionState = vi.hoisted(() => ({ starts: [] as unknown[] }));

vi.mock('motion/react', () => {
  const MOTION_PROPS = new Set(['animate', 'initial', 'variants', 'transition']);
  const motion = new Proxy(
    {},
    {
      get: (_, tag: string) =>
        forwardRef<Element, Record<string, unknown>>(function MotionStandIn(props, ref) {
          const rest = Object.fromEntries(Object.entries(props).filter(([key]) => !MOTION_PROPS.has(key)));
          return createElement(tag, { ...rest, ref });
        }),
    },
  );
  return {
    motion,
    useAnimation: () => ({
      start: (variant: unknown) => {
        motionState.starts.push(variant);
        return Promise.resolve();
      },
      stop: () => undefined,
      set: () => undefined,
      mount: () => () => undefined,
    }),
    useReducedMotion: () => false,
  };
});

/** The starts that play something, leaving out the resets an icon makes on leave. */
function playStarts(): unknown[] {
  return motionState.starts.filter((variant) => variant !== 'normal');
}

beforeEach(() => {
  motionState.starts = [];
});

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

    expect(met?.textContent).toMatch(/^At least 15 characters/);
    expect(met?.hasAttribute('data-met')).toBe(true);
    expect(met?.querySelector('[data-slot=circle-check-icon]')).not.toBeNull();
    expect(met?.querySelector('[data-slot=circle-icon]')).toBeNull();

    expect(unmet?.textContent).toMatch(/^Not your name or email/);
    expect(unmet?.hasAttribute('data-met')).toBe(false);
    expect(unmet?.querySelector('[data-slot=circle-icon]')).not.toBeNull();
    expect(unmet?.querySelector('[data-slot=circle-check-icon]')).toBeNull();
  });

  it('says after the requirement whether it is met', () => {
    render(
      <PasswordStrengthRequirements>
        <PasswordStrengthRequirement met>At least 15 characters</PasswordStrengthRequirement>
        <PasswordStrengthRequirement met={false}>Not your name or email</PasswordStrengthRequirement>
      </PasswordStrengthRequirements>,
    );
    const [met, unmet] = screen.getAllByRole('listitem');

    expect(met?.textContent).toMatch(/Met$/);
    expect(met?.textContent).not.toMatch(/Not met$/);
    expect(unmet?.textContent).toMatch(/Not met$/);
  });

  it('says it in the words the caller passes', () => {
    render(
      <PasswordStrengthRequirements>
        <PasswordStrengthRequirement met metLabel="Erfuellt" unmetLabel="Nicht erfuellt">
          Mindestens 15 Zeichen
        </PasswordStrengthRequirement>
        <PasswordStrengthRequirement met={false} metLabel="Erfuellt" unmetLabel="Nicht erfuellt">
          Nicht Ihr Name
        </PasswordStrengthRequirement>
      </PasswordStrengthRequirements>,
    );
    const [met, unmet] = screen.getAllByRole('listitem');

    expect(met?.textContent).toMatch(/Erfuellt$/);
    expect(met?.textContent).not.toMatch(/Met$/);
    expect(unmet?.textContent).toMatch(/Nicht erfuellt$/);
  });

  it('starts no animation when the pointer crosses a requirement', () => {
    render(
      <PasswordStrengthRequirements>
        <PasswordStrengthRequirement met>At least 15 characters</PasswordStrengthRequirement>
        <PasswordStrengthRequirement met={false}>Not your name or email</PasswordStrengthRequirement>
      </PasswordStrengthRequirements>,
    );
    const [met, unmet] = screen.getAllByRole('listitem');

    fireEvent.mouseEnter(met!.querySelector('[data-slot=circle-check-icon]')!);
    fireEvent.mouseEnter(unmet!.querySelector('[data-slot=circle-icon]')!);

    expect(playStarts()).toEqual([]);
  });

  it('plays the circle-check once when the requirement becomes met', () => {
    const requirement = (met: boolean) => (
      <PasswordStrengthRequirements>
        <PasswordStrengthRequirement met={met}>At least 15 characters</PasswordStrengthRequirement>
      </PasswordStrengthRequirements>
    );
    const { rerender } = render(requirement(false));
    expect(playStarts()).toEqual([]);

    rerender(requirement(true));
    expect(playStarts()).toEqual(['animate']);

    rerender(requirement(true));
    expect(playStarts()).toEqual(['animate']);
  });
});
