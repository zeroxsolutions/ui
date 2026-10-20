import * as CheckboxPrimitive from '@rn-primitives/checkbox';
import { Check } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { cn } from '../lib/utils';
import { Icon } from './icon';

// A `cn-<slot>` token stands for that Vega slot's view classes, `cn-<slot>/text` for its text
// classes and `cn-<slot>@<state>` for the classes Vega puts behind that state; the registry build
// replaces each with the classes translated for the target engine. Vega sizes the check mark with
// a descendant selector and colours it through the text colour, neither of which reaches an svg on
// a device, so the mark takes both as its own classes.

type CheckboxProps = CheckboxPrimitive.RootProps & {
  /**
   * Draws the destructive border while unchecked. React Native does not announce it, so carry the
   * error in `accessibilityHint` or in a Text the user can reach.
   */
  'aria-invalid'?: boolean;
};

/**
 * A box that is checked or not, announced as a checkbox with its checked and disabled state. It is
 * controlled: pressing it calls `onCheckedChange` with the new value, and the mark shows once
 * `checked` follows. A disabled checkbox is dimmed and ignores presses. Name it with `aria-label`,
 * which both platforms read; Android also reads a Label's nativeID through `aria-labelledby`.
 */
function Checkbox({ className, checked, disabled, 'aria-invalid': invalid, ...props }: CheckboxProps): ReactNode {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'shrink-0 cn-checkbox',
        checked && 'cn-checkbox@checked',
        invalid && 'cn-checkbox@invalid',
        checked && invalid && 'cn-checkbox@checked+invalid',
        disabled && 'cn-checkbox@disabled',
        className,
      )}
      checked={checked}
      disabled={disabled}
      aria-invalid={invalid}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="cn-checkbox-indicator items-center justify-center">
        <Icon as={Check} className="cn-checkbox/text@checked size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
export type { CheckboxProps };
