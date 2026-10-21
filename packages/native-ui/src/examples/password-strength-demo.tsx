import type { ReactNode } from 'react';

import {
  PasswordStrength,
  PasswordStrengthMeter,
  PasswordStrengthRequirement,
  PasswordStrengthRequirements,
} from '@/components/feedback/password-strength';

function PasswordStrengthDemo(): ReactNode {
  return (
    <PasswordStrength strength="fair">
      <PasswordStrengthMeter valueText="Fair">Password strength</PasswordStrengthMeter>
      <PasswordStrengthRequirements>
        <PasswordStrengthRequirement met>At least 15 characters</PasswordStrengthRequirement>
        <PasswordStrengthRequirement>Not your name or email</PasswordStrengthRequirement>
      </PasswordStrengthRequirements>
    </PasswordStrength>
  );
}

export { PasswordStrengthDemo };
