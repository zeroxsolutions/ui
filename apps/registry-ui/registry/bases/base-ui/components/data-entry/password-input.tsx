'use client';

import * as React from 'react';

import { EyeIcon, type EyeIconHandle } from '@/registry/bases/base-ui/ui/eye';
import { EyeOffIcon, type EyeOffIconHandle } from '@/registry/bases/base-ui/ui/eye-off';
import { InputGroup, InputGroupButton, InputGroupInput } from '@/registry/bases/base-ui/ui/input-group';

interface PasswordInputContextValue {
  visible: boolean;
  toggle: () => void;
}

const PasswordInputContext = React.createContext<PasswordInputContextValue | null>(null);

function usePasswordInput(): PasswordInputContextValue {
  const context = React.useContext(PasswordInputContext);
  if (!context) throw new Error('PasswordInput parts must be used within <PasswordInput>');
  return context;
}

/**
 * A password field over upstream's `InputGroup`. The root holds whether the
 * password shows and carries `data-visible` while it does; the consumer
 * composes a `PasswordInputInput` and, in an `InputGroupAddon`, a
 * `PasswordInputToggle`, beside any other addon (a leading lock icon):
 *
 *   <PasswordInput>
 *     <PasswordInputInput id="password" autoComplete="current-password" />
 *     <InputGroupAddon align="inline-end">
 *       <PasswordInputToggle aria-label="Show password" />
 *     </InputGroupAddon>
 *   </PasswordInput>
 *
 * The root keeps upstream's `data-slot="input-group"` (recipes such as
 * `ui/combobox.tsx`'s popup select on it); `className` places the group.
 */
function PasswordInput(props: React.ComponentProps<typeof InputGroup>): React.ReactNode {
  const [visible, setVisible] = React.useState(false);
  const context = React.useMemo(() => ({ visible, toggle: () => setVisible((current) => !current) }), [visible]);
  return (
    <PasswordInputContext.Provider value={context}>
      <InputGroup data-visible={visible || undefined} {...props} />
    </PasswordInputContext.Provider>
  );
}

/**
 * The password input, upstream's `InputGroupInput`, typed `password` or `text`
 * as the root says. Every other prop (`ref`/`onChange` for RHF `register`,
 * ref-as-prop in React 19) flows straight to the input.
 */
function PasswordInputInput(props: Omit<React.ComponentProps<typeof InputGroupInput>, 'type'>): React.ReactNode {
  const { visible } = usePasswordInput();
  return <InputGroupInput {...props} type={visible ? 'text' : 'password'} />;
}

/**
 * The show/hide toggle, upstream's ghost `icon-xs` `InputGroupButton`, pressed
 * (`aria-pressed`) while the password shows. The caller names it with a
 * fixed `aria-label` such as `Show password`, which the pressed state
 * qualifies. It stays out of the tab order, so Tab moves from the password to
 * the next field. The eye plays on the toggle's hover or focus.
 */
function PasswordInputToggle({
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: Omit<React.ComponentProps<typeof InputGroupButton>, 'children'>): React.ReactNode {
  const { visible, toggle } = usePasswordInput();
  const iconRef = React.useRef<EyeIconHandle & EyeOffIconHandle>(null);
  return (
    <InputGroupButton
      size="icon-xs"
      variant="ghost"
      aria-pressed={visible}
      tabIndex={-1}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) toggle();
      }}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        iconRef.current?.startAnimation();
      }}
      onMouseLeave={(event) => {
        onMouseLeave?.(event);
        iconRef.current?.stopAnimation();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        iconRef.current?.startAnimation();
      }}
      onBlur={(event) => {
        onBlur?.(event);
        iconRef.current?.stopAnimation();
      }}
      {...props}
    >
      {visible ? <EyeOffIcon ref={iconRef} /> : <EyeIcon ref={iconRef} />}
    </InputGroupButton>
  );
}

export { PasswordInput, PasswordInputInput, PasswordInputToggle };
