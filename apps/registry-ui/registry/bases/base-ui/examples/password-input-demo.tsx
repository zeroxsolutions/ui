import type { ReactNode } from 'react';

import { PasswordInput } from '@/registry/bases/base-ui/components/data-entry/password-input';
import { Field, FieldLabel } from '@/registry/bases/base-ui/ui/field';

/** A labelled password field with its show/hide toggle. */
function PasswordInputDemo(): ReactNode {
  return (
    <Field className="w-64">
      <FieldLabel htmlFor="preview-password">Password</FieldLabel>
      <PasswordInput id="preview-password" defaultValue="hunter2" autoComplete="current-password" />
    </Field>
  );
}

export { PasswordInputDemo };
