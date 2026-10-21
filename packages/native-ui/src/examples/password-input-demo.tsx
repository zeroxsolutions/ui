import type { ReactNode } from 'react';

import { PasswordInput, PasswordInputInput, PasswordInputToggle } from '@/components/data-entry/password-input';
import { InputGroupAddon } from '@/components/ui/input-group';

function PasswordInputDemo(): ReactNode {
  return (
    <PasswordInput>
      <PasswordInputInput aria-label="Password" autoComplete="current-password" defaultValue="correct horse" />
      <InputGroupAddon align="inline-end">
        <PasswordInputToggle />
      </InputGroupAddon>
    </PasswordInput>
  );
}

export { PasswordInputDemo };
