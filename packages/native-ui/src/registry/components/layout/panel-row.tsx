import { Children, isValidElement, type ComponentProps, type ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '../../lib/utils';

/**
 * One row of a property section: the fields (usually a `PanelFieldGroup`) and a trailing `PanelRowAction`.
 * React Native has no grid, so the row draws the web's two columns itself: everything but the action goes in
 * a leading column that takes the room left, and the action column after it is at least one default icon
 * button (`size="icon"`, `min-w-8`) wide whether an action is composed or not, so every row in a panel
 * shares the same right edge. It finds the action by its element, so pass `PanelRowAction` itself, not
 * inside a component of your own.
 */
function PanelRow({ className, children, ...props }: ComponentProps<typeof View>): ReactNode {
  const parts = Children.toArray(children);
  const actions = parts.filter((part) => isValidElement(part) && part.type === PanelRowAction);
  const fields = parts.filter((part) => !actions.includes(part));

  return (
    <View className={cn('flex-row items-end gap-1', className)} {...props}>
      <View className="min-w-0 flex-1">{fields}</View>
      {actions.length > 0 ? actions : <View className="min-w-8" />}
    </View>
  );
}

/** The trailing action of a `PanelRow`, such as an aspect-lock toggle or a reset button, centred in its column. */
function PanelRowAction({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return <View className={cn('min-w-8 shrink-0 flex-row justify-center', className)} {...props} />;
}

export { PanelRow, PanelRowAction };
