import * as TogglePrimitive from '@rn-primitives/toggle';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { cn } from '../lib/utils';
import { IconClassContext } from './icon';
import { TextClassContext } from './text';

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` and `cn-<slot>/icon`
// for its text and icon classes, and `cn-<slot>@<state>` for the classes the style puts behind that state;
// the registry build replaces each with the classes translated for the target engine.
const toggleVariants = cva('flex-row items-center justify-center disabled:opacity-50 cn-toggle', {
  variants: {
    variant: {
      default: 'cn-toggle-variant-default',
      outline: 'cn-toggle-variant-outline',
    },
    size: {
      default: 'cn-toggle-size-default',
      sm: 'cn-toggle-size-sm',
      lg: 'cn-toggle-size-lg',
    },
    pressed: {
      true: 'cn-toggle@pressed',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
    pressed: false,
  },
});

type ToggleProps = TogglePrimitive.RootProps &
  Omit<VariantProps<typeof toggleVariants>, 'pressed'> & {
    /**
     * Draws the destructive border. React Native does not announce it, so carry the error in
     * `accessibilityHint` or in a Text the user can reach.
     */
    'aria-invalid'?: boolean;
  };

/**
 * A two-state button, announced as a button with its selected and disabled state, drawn on the muted
 * background while pressed. It is controlled: pressing it calls `onPressedChange` with the new value,
 * and it shows as pressed once `pressed` follows. Its label goes in as a Text child, which takes the
 * label classes, and an Icon child takes a 16px size; an icon-only toggle is named with `aria-label`.
 */
function Toggle({
  className,
  variant,
  size,
  pressed,
  disabled,
  accessibilityState,
  'aria-invalid': invalid,
  ...props
}: ToggleProps): ReactNode {
  return (
    <TextClassContext.Provider value="cn-toggle/text">
      <IconClassContext.Provider value="cn-toggle/icon">
        <TogglePrimitive.Root
          className={cn(toggleVariants({ variant, size, pressed }), invalid && 'cn-toggle@invalid', className)}
          pressed={pressed}
          disabled={disabled}
          aria-invalid={invalid}
          {...props}
          // The primitive sets role switch and aria-checked, and React Native lets an aria-* prop win
          // over accessibilityState, so both are replaced here, after the caller's props.
          role="button"
          aria-checked={undefined}
          accessibilityState={{ ...accessibilityState, selected: pressed, disabled }}
        />
      </IconClassContext.Provider>
    </TextClassContext.Provider>
  );
}

export { Toggle, toggleVariants };
export type { ToggleProps };
