import * as ToggleGroupPrimitive from '@rn-primitives/toggle-group';
import { cva, type VariantProps } from 'class-variance-authority';
import { Children, createContext, isValidElement, useContext, type ReactNode } from 'react';
import { cn } from '../lib/utils';
import { IconClassContext } from './icon';
import { TextClassContext } from './text';
import { toggleVariants } from './toggle';

type ToggleVariant = NonNullable<VariantProps<typeof toggleVariants>['variant']>;
type ToggleSize = NonNullable<VariantProps<typeof toggleVariants>['size']>;

/** The gap between items in steps of the spacing scale; `0` joins them into one bar. */
type ToggleGroupSpacing = 0 | 1 | 2 | 3 | 4;

// A `cn-<slot>` token stands for that slot's classes and `cn-<slot>@<state>` for the classes
// the style puts behind that state, such as `@spacing=0` for a state of the group; the registry build
// replaces each with the classes translated for the target engine.
const toggleGroupVariants = cva('flex-row items-center self-start cn-toggle-group', {
  variants: {
    orientation: {
      horizontal: '',
      vertical: 'flex-col items-stretch',
    },
    spacing: {
      0: 'gap-0',
      1: 'gap-1',
      2: 'gap-2',
      3: 'gap-3',
      4: 'gap-4',
    },
    variant: {
      default: '',
      outline: '',
    },
  },
  compoundVariants: [{ spacing: 0, variant: 'outline', className: 'cn-toggle-group@spacing=0+variant=outline' }],
});

/** What a ToggleGroupItem reads from its group to draw itself. */
const ToggleGroupContext = createContext<{
  variant: ToggleVariant | undefined;
  size: ToggleSize | undefined;
  spacing: ToggleGroupSpacing;
  orientation: 'horizontal' | 'vertical';
  value: string | string[] | undefined;
}>({ variant: undefined, size: undefined, spacing: 2, orientation: 'horizontal', value: undefined });

/**
 * Whether an item is the group's first or last child, which a joined group rounds on the outside;
 * neither engine gives a child a reliable first or last state of its own.
 */
const ToggleGroupItemPositionContext = createContext<{ first: boolean; last: boolean }>({
  first: false,
  last: false,
});

type ToggleGroupProps = ToggleGroupPrimitive.RootProps & {
  /** The variant of every item, over the item's own. */
  variant?: ToggleVariant;
  /** The size of every item, over the item's own. */
  size?: ToggleSize;
  /** Defaults to 2, an 8px gap; 0 joins the items and rounds only the outer corners. */
  spacing?: ToggleGroupSpacing;
  /** Lays the items out in a row, the default, or a column. */
  orientation?: 'horizontal' | 'vertical';
};

/**
 * A set of ToggleGroupItem children, announced as a radio group when `type` is `single` and as a
 * group when it is `multiple`. It is controlled: pressing an item calls `onValueChange` with the new
 * value, a string or undefined in single mode and an array in multiple mode, and the item shows as
 * pressed once `value` follows. `disabled` disables every item. The items are its direct children,
 * since a joined group finds its first and last item among them.
 */
function ToggleGroup({
  className,
  variant,
  size,
  spacing = 2,
  orientation = 'horizontal',
  children,
  ...props
}: ToggleGroupProps): ReactNode {
  const items = Children.toArray(children).filter(isValidElement);

  return (
    <ToggleGroupContext.Provider value={{ variant, size, spacing, orientation, value: props.value }}>
      <ToggleGroupPrimitive.Root
        className={cn(toggleGroupVariants({ orientation, spacing, variant }), className)}
        orientation={orientation}
        {...props}
      >
        {items.map((item, index) => (
          <ToggleGroupItemPositionContext.Provider
            key={item.key}
            value={{ first: index === 0, last: index === items.length - 1 }}
          >
            {item}
          </ToggleGroupItemPositionContext.Provider>
        ))}
      </ToggleGroupPrimitive.Root>
    </ToggleGroupContext.Provider>
  );
}

type ToggleGroupItemProps = ToggleGroupPrimitive.ItemProps & {
  /** Used when the group sets no variant. */
  variant?: ToggleVariant;
  /** Used when the group sets no size. */
  size?: ToggleSize;
};

/**
 * One choice in a ToggleGroup, announced as a radio in single mode and as a checkbox in multiple mode,
 * with its checked and disabled state, and drawn as a Toggle of the group's variant and size. Its
 * label goes in as a Text child and an Icon child takes a 16px size; an icon-only item is named with
 * `aria-label`.
 */
function ToggleGroupItem({ className, value, variant, size, ...props }: ToggleGroupItemProps): ReactNode {
  const group = useContext(ToggleGroupContext);
  const { first, last } = useContext(ToggleGroupItemPositionContext);
  const pressed = Array.isArray(group.value) ? group.value.includes(value) : group.value === value;
  const itemVariant = group.variant ?? variant ?? 'default';
  const joined = group.spacing === 0;
  const horizontal = group.orientation === 'horizontal';

  return (
    <TextClassContext.Provider value="cn-toggle/text">
      <IconClassContext.Provider value="cn-toggle/icon">
        <ToggleGroupPrimitive.Item
          className={cn(
            toggleVariants({ variant: itemVariant, size: group.size ?? size, pressed }),
            'shrink-0 cn-toggle-group-item',
            pressed && 'cn-toggle-group-item@pressed',
            joined && 'cn-toggle-group-item@spacing=0',
            joined && first && horizontal && 'cn-toggle-group-item@orientation=horizontal+position=first+spacing=0',
            joined && first && !horizontal && 'cn-toggle-group-item@orientation=vertical+position=first+spacing=0',
            joined && last && horizontal && 'cn-toggle-group-item@orientation=horizontal+position=last+spacing=0',
            joined && last && !horizontal && 'cn-toggle-group-item@orientation=vertical+position=last+spacing=0',
            joined && !first && itemVariant === 'outline' && (horizontal ? 'border-l-0' : 'border-t-0'),
            className,
          )}
          value={value}
          {...props}
        />
      </IconClassContext.Provider>
    </TextClassContext.Provider>
  );
}

export { ToggleGroup, ToggleGroupItem };
export type { ToggleGroupItemProps, ToggleGroupProps };
