import * as RadioGroupPrimitive from '@rn-primitives/radio-group';
import { createContext, useContext, type ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '../lib/utils';

/** What a RadioGroupItem reads from its group to draw itself: the selected value and whether the group is disabled. */
const RadioGroupContext = createContext<{ value: string | undefined; disabled: boolean }>({
  value: undefined,
  disabled: false,
});

// A `cn-<slot>` token stands for that Vega slot's classes and `cn-<slot>@<state>` for the classes
// Vega puts behind that state; the registry build replaces each with the classes translated for the
// target engine.

/**
 * A set of RadioGroupItem children of which one is selected, announced as a radio group. It is
 * controlled: pressing an item calls `onValueChange` with the item's value, and the item shows as
 * selected once `value` follows. `disabled` disables every item.
 */
function RadioGroup({ className, value, disabled = false, ...props }: RadioGroupPrimitive.RootProps): ReactNode {
  return (
    <RadioGroupContext.Provider value={{ value, disabled }}>
      <RadioGroupPrimitive.Root
        className={cn('cn-radio-group', className)}
        value={value}
        disabled={disabled}
        {...props}
      />
    </RadioGroupContext.Provider>
  );
}

type RadioGroupItemProps = RadioGroupPrimitive.ItemProps & {
  /**
   * Draws the destructive border while the item is not selected. React Native does not announce
   * it, so carry the error in `accessibilityHint` or in a Text the user can reach.
   */
  'aria-invalid'?: boolean;
};

/**
 * One choice in a RadioGroup, announced as a radio with its checked and disabled state and drawn as
 * a dotted circle while selected. A disabled item, or any item of a disabled group, is dimmed and
 * ignores presses. Name it with `aria-label`, or with a Label's nativeID through `aria-labelledby`.
 */
function RadioGroupItem({
  className,
  value,
  disabled,
  'aria-invalid': invalid,
  ...props
}: RadioGroupItemProps): ReactNode {
  const group = useContext(RadioGroupContext);
  const checked = group.value === value;
  const dimmed = group.disabled || disabled === true;

  return (
    <RadioGroupPrimitive.Item
      className={cn(
        'aspect-square shrink-0 items-center justify-center border cn-radio-group-item',
        checked && 'cn-radio-group-item@checked',
        invalid && 'cn-radio-group-item@invalid',
        checked && invalid && 'cn-radio-group-item@checked+invalid',
        dimmed && 'opacity-50',
        className,
      )}
      value={value}
      disabled={disabled}
      aria-invalid={invalid}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="cn-radio-group-indicator">
        <View className="cn-radio-group-indicator-icon" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
export type { RadioGroupItemProps };
