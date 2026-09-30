import type { ReactNode } from 'react';

import {
  PasswordInput,
  PasswordInputInput,
  PasswordInputToggle,
} from '@/registry/bases/base-ui/components/data-entry/password-input';
import { Field, FieldLabel } from '@/registry/bases/base-ui/ui/field';
import { InputGroupAddon } from '@/registry/bases/base-ui/ui/input-group';

/** A labelled password field with its show/hide toggle. */
function PasswordInputDemo(): ReactNode {
  return (
    <Field className="w-64">
      <FieldLabel htmlFor="preview-password">Password</FieldLabel>
      <PasswordInput>
        <PasswordInputInput id="preview-password" defaultValue="hunter2" autoComplete="current-password" />
        <InputGroupAddon align="inline-end">
          <PasswordInputToggle aria-label="Show password" />
        </InputGroupAddon>
      </PasswordInput>
    </Field>
  );
}

export { PasswordInputDemo };
