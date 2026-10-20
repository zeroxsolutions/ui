'use client';

import { useState, type ReactNode } from 'react';

import {
  PasswordInput,
  PasswordInputInput,
  PasswordInputToggle,
} from '@/registry/bases/base-ui/components/data-entry/password-input';
import {
  PasswordStrength,
  PasswordStrengthMeter,
  PasswordStrengthRequirement,
  PasswordStrengthRequirements,
  type PasswordStrengthValue,
} from '@/registry/bases/base-ui/components/feedback/password-strength';
import { Field, FieldLabel } from '@/registry/bases/base-ui/ui/field';
import { InputGroupAddon } from '@/registry/bases/base-ui/ui/input-group';

/** The signed-up person's name and email, which the password must not contain. */
const PERSONAL_WORDS = ['ada', 'lovelace'];
const MIN_LENGTH = 15;
const FAIR_LENGTH = 8;

const STRENGTH_WORD: Record<PasswordStrengthValue, string> = { weak: 'Weak', fair: 'Fair', strong: 'Strong' };

/**
 * A new password checked as NIST SP 800-63B rev 4 asks: by its length and against the person's own
 * name and email, with no rule about character classes. It is strong at 15 characters free of
 * personal data, fair at 8, and weak below that.
 */
function PasswordStrengthDemo(): ReactNode {
  const [password, setPassword] = useState('');
  const lowered = password.toLowerCase();
  const isLongEnough = password.length >= MIN_LENGTH;
  const isImpersonal = password.length > 0 && !PERSONAL_WORDS.some((word) => lowered.includes(word));
  const strength: PasswordStrengthValue =
    isLongEnough && isImpersonal ? 'strong' : password.length >= FAIR_LENGTH && isImpersonal ? 'fair' : 'weak';

  return (
    <div className="flex w-full max-w-80 flex-col gap-3">
      <Field>
        <FieldLabel htmlFor="preview-new-password">New password for ada@example.com</FieldLabel>
        <PasswordInput>
          <PasswordInputInput
            id="preview-new-password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <InputGroupAddon align="inline-end">
            <PasswordInputToggle aria-label="Show password" />
          </InputGroupAddon>
        </PasswordInput>
      </Field>
      <PasswordStrength strength={strength}>
        <PasswordStrengthMeter valueText={STRENGTH_WORD[strength]}>Password strength</PasswordStrengthMeter>
        <PasswordStrengthRequirements>
          <PasswordStrengthRequirement met={isLongEnough}>
            At least {MIN_LENGTH} characters
            <span className="sr-only">{isLongEnough ? ', met' : ', not met'}</span>
          </PasswordStrengthRequirement>
          <PasswordStrengthRequirement met={isImpersonal}>
            Not your name or email
            <span className="sr-only">{isImpersonal ? ', met' : ', not met'}</span>
          </PasswordStrengthRequirement>
        </PasswordStrengthRequirements>
      </PasswordStrength>
    </div>
  );
}

export { PasswordStrengthDemo };
