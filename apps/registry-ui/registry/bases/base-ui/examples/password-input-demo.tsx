import type { ReactNode } from 'react';

import { PasswordInput } from '@/registry/bases/base-ui/components/data-entry/password-input';
import { Label } from '@/registry/bases/base-ui/ui/label';

/** A labelled password field with its show/hide toggle. */
function PasswordInputDemo(): ReactNode {
  return (
    <div className="flex w-64 flex-col gap-1.5">
      <Label htmlFor="preview-password">Password</Label>
      <PasswordInput id="preview-password" defaultValue="hunter2" autoComplete="current-password" />
    </div>
  );
}

export { PasswordInputDemo };
