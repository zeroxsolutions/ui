import * as SwitchPrimitive from '@rn-primitives/switch';
import { cva } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

// A `cn-<slot>` token stands for that Vega slot's classes and `cn-<slot>@<state>` for the classes
// Vega puts behind that state, such as `@checked+size=sm`; the registry build replaces each with the
// classes translated for the target engine.
const switchVariants = cva('flex-row items-center cn-switch', {
  variants: {
    size: {
      default: 'cn-switch@size=default',
      sm: 'cn-switch@size=sm',
    },
    checked: {
      true: 'cn-switch@checked',
      false: 'cn-switch@unchecked',
    },
  },
});

const switchThumbVariants = cva('cn-switch-thumb', {
  variants: {
    size: {
      default: 'cn-switch-thumb@size=default',
      sm: 'cn-switch-thumb@size=sm',
    },
    checked: {
      true: 'cn-switch-thumb@checked',
      false: 'cn-switch-thumb@unchecked',
    },
  },
  compoundVariants: [
    { size: 'default', checked: true, className: 'cn-switch-thumb@checked+size=default' },
    { size: 'default', checked: false, className: 'cn-switch-thumb@size=default+unchecked' },
    { size: 'sm', checked: true, className: 'cn-switch-thumb@checked+size=sm' },
    { size: 'sm', checked: false, className: 'cn-switch-thumb@size=sm+unchecked' },
  ],
});

type SwitchProps = SwitchPrimitive.RootProps & {
  /** `sm` draws a 24px track; the default is 32px. */
  size?: 'default' | 'sm';
  /**
   * Draws the destructive border. React Native does not announce it, so carry the error in
   * `accessibilityHint` or in a Text the user can reach.
   */
  'aria-invalid'?: boolean;
};

/**
 * An on/off control, announced as a switch with its checked and disabled state. It is controlled:
 * pressing it calls `onCheckedChange` with the new value, and it moves only once `checked` follows.
 * A disabled switch is dimmed and ignores presses. Name it with `aria-label`, which both platforms
 * read; Android also reads a Label's nativeID through `aria-labelledby`.
 */
function Switch({
  className,
  size = 'default',
  checked,
  disabled,
  'aria-invalid': invalid,
  ...props
}: SwitchProps): ReactNode {
  return (
    <SwitchPrimitive.Root
      className={cn(
        switchVariants({ size, checked }),
        invalid && 'cn-switch@invalid',
        disabled && 'opacity-50',
        className,
      )}
      checked={checked}
      disabled={disabled}
      aria-invalid={invalid}
      {...props}
    >
      <SwitchPrimitive.Thumb className={switchThumbVariants({ size, checked })} />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
export type { SwitchProps };
