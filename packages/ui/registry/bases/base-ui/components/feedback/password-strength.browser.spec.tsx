import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { drawingsIn, expectStill, playMotion, settled } from '../../../../../test/motion';
import {
  PasswordStrength,
  PasswordStrengthMeter,
  PasswordStrengthRequirement,
  PasswordStrengthRequirements,
} from './password-strength';

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

function requirements(): ReactNode {
  return (
    <PasswordStrengthRequirements>
      <PasswordStrengthRequirement met>At least 15 characters</PasswordStrengthRequirement>
      <PasswordStrengthRequirement met={false}>Not your name or email</PasswordStrengthRequirement>
    </PasswordStrengthRequirements>
  );
}

const items = () => [page.getByRole('listitem').nth(0), page.getByRole('listitem').nth(1)] as const;

describe('PasswordStrength', () => {
  it.each([
    ['weak', 1],
    ['fair', 2],
    ['strong', 3],
  ] as const)('sets the meter to step %s of three and shows its word', async (strength, step) => {
    await render(strengthOf(strength));
    const meter = page.getByRole('progressbar', { name: 'Password strength' });

    await expect.element(meter).toHaveAttribute('aria-valuenow', String(step));
    await expect.element(meter).toHaveAttribute('aria-valuemax', '3');
    await expect.element(meter).toHaveAttribute('aria-valuetext', WORDS[strength]);
    await expect.element(meter.getByText(WORDS[strength])).toBeVisible();
  });

  it('announces a change of strength politely', async () => {
    const screen = await render(strengthOf('weak'));
    const status = page.getByRole('status');
    await expect.element(status).toHaveAttribute('aria-live', 'polite');
    await expect.element(status).toHaveTextContent('Weak');

    await screen.rerender(strengthOf('fair'));
    await expect.element(page.getByRole('status')).toHaveTextContent('Fair');
  });

  it('marks a met requirement with the circle-check and an unmet one with the circle', async () => {
    await render(requirements());
    const [met, unmet] = items();

    await expect.element(met.getByTestId('circle-check-icon')).toBeVisible();
    await expect.element(met.getByTestId('circle-icon')).not.toBeInTheDocument();
    await expect.element(unmet.getByTestId('circle-icon')).toBeVisible();
    await expect.element(unmet.getByTestId('circle-check-icon')).not.toBeInTheDocument();
  });

  it('says after the requirement whether it is met', async () => {
    await render(requirements());
    const [met, unmet] = items();

    await expect.element(met).toHaveTextContent(/^At least 15 characters, Met$/);
    await expect.element(unmet).toHaveTextContent(/^Not your name or email, Not met$/);
  });

  it('says it in the words the caller passes', async () => {
    await render(
      <PasswordStrengthRequirements>
        <PasswordStrengthRequirement met metLabel="Erfuellt" unmetLabel="Nicht erfuellt">
          Mindestens 15 Zeichen
        </PasswordStrengthRequirement>
        <PasswordStrengthRequirement met={false} metLabel="Erfuellt" unmetLabel="Nicht erfuellt">
          Nicht Ihr Name
        </PasswordStrengthRequirement>
      </PasswordStrengthRequirements>,
    );
    const [met, unmet] = items();

    await expect.element(met).toHaveTextContent(/, Erfuellt$/);
    await expect.element(unmet).toHaveTextContent(/, Nicht erfuellt$/);
  });
});

describe('PasswordStrengthRequirement icon', () => {
  playMotion();

  it('stays still when the pointer crosses a requirement', async () => {
    await render(requirements());
    const [met, unmet] = items();

    await userEvent.hover(met.getByTestId('circle-check-icon'));
    await expectStill(met.element());
    await userEvent.hover(unmet.getByTestId('circle-icon'));
    await expectStill(unmet.element());
  });

  it('draws the circle-check in once when the requirement becomes met', async () => {
    const requirement = (met: boolean) => (
      <PasswordStrengthRequirements>
        <PasswordStrengthRequirement met={met}>At least 15 characters</PasswordStrengthRequirement>
      </PasswordStrengthRequirements>
    );
    const screen = await render(requirement(false));

    await screen.rerender(requirement(true));
    const item = page.getByRole('listitem').element();
    expect((await drawingsIn(item)).size, 'the circle-check plays').toBeGreaterThan(1);

    await settled(item);
    await screen.rerender(requirement(true));
    await expectStill(item);
  });
});
