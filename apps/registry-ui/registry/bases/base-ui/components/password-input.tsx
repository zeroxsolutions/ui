import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/registry/bases/base-ui/ui/input-group';

/**
 * A password field — the `input-group` composition with a show/hide toggle in
 * the inline-end addon, packaged so call-sites never re-wire the eye button.
 * `className` sizes the group; remaining props (incl. `ref`/`onChange` for RHF
 * `register`, ref-as-prop in React 19) flow straight to the input.
 *
 * Named modifier-first (`PasswordInput`), per component-conventions: a new input
 * variant takes the `<Modifier>Input` form.
 */
function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<'input'>, 'type'>) {
  const [visible, setVisible] = React.useState(false);

  return (
    <InputGroup className={className}>
      <InputGroupInput {...props} type={visible ? 'text' : 'password'} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          variant="ghost"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          tabIndex={-1}
        >
          {visible ? <EyeOff /> : <Eye />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

export { PasswordInput };
