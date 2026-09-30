'use client';

import * as React from 'react';

import { EyeIcon, type EyeIconHandle } from '@/registry/bases/base-ui/ui/eye';
import { EyeOffIcon, type EyeOffIconHandle } from '@/registry/bases/base-ui/ui/eye-off';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/registry/bases/base-ui/ui/input-group';

/**
 * A password field - the `input-group` composition with a show/hide toggle in
 * the inline-end addon, packaged so call-sites never re-wire the eye button.
 * `className` places the group, which keeps upstream's `data-slot="input-group"`
 * (recipes such as `ui/combobox.tsx`'s popup select on it) and carries
 * `data-visible` while the password shows; remaining props (incl.
 * `ref`/`onChange` for RHF `register`, ref-as-prop in React 19) flow straight
 * to the input. The toggle's eye plays on the toggle's hover or focus.
 */
function PasswordInput({ className, ...props }: Omit<React.ComponentProps<'input'>, 'type'>): React.ReactNode {
  const [visible, setVisible] = React.useState(false);
  const iconRef = React.useRef<EyeIconHandle & EyeOffIconHandle>(null);

  return (
    <InputGroup data-visible={visible || undefined} className={className}>
      <InputGroupInput {...props} type={visible ? 'text' : 'password'} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          variant="ghost"
          onClick={() => setVisible((v) => !v)}
          onMouseEnter={() => iconRef.current?.startAnimation()}
          onMouseLeave={() => iconRef.current?.stopAnimation()}
          onFocus={() => iconRef.current?.startAnimation()}
          onBlur={() => iconRef.current?.stopAnimation()}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          tabIndex={-1}
        >
          {visible ? <EyeOffIcon ref={iconRef} /> : <EyeIcon ref={iconRef} />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

export { PasswordInput };
