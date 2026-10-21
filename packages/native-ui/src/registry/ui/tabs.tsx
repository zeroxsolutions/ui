import * as TabsPrimitive from '@rn-primitives/tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import { createContext, useContext, type ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '../lib/utils';
import { IconClassContext } from './icon';
import { TextClassContext } from './text';

/** The orientation every part of a Tabs lays itself out by. */
const TabsOrientationContext = createContext<'horizontal' | 'vertical'>('horizontal');

/** The variant of the TabsList a TabsTrigger sits in. */
const TabsListVariantContext = createContext<'default' | 'line'>('default');

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` and `cn-<slot>/icon`
// for its text and icon classes, and `cn-<slot>@<state>` for the classes the style puts behind that state,
// such as `@selected+variant=line`; the registry build replaces each with the classes translated for
// the target engine.
const tabsVariants = cva('cn-tabs', {
  variants: {
    orientation: {
      horizontal: 'flex-col',
      vertical: 'flex-row',
    },
  },
});

const tabsListVariants = cva('items-center justify-center cn-tabs-list', {
  variants: {
    variant: {
      default: 'bg-muted',
      line: 'gap-1 bg-transparent cn-tabs-list@variant=line',
    },
    orientation: {
      horizontal: 'flex-row cn-tabs-list@orientation=horizontal',
      vertical: 'flex-col',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const tabsTriggerVariants = cva('flex-row items-center justify-center disabled:opacity-50 cn-tabs-trigger', {
  variants: {
    variant: {
      default: '',
      line: 'bg-transparent',
    },
    orientation: {
      horizontal: 'flex-1 self-stretch',
      vertical: 'w-full justify-start',
    },
    selected: {
      true: '',
      false: '',
    },
  },
  compoundVariants: [
    {
      variant: 'default',
      selected: true,
      className: 'bg-background dark:border-input dark:bg-input/30 cn-tabs-trigger@selected+variant=default',
    },
    {
      variant: 'line',
      selected: true,
      className: 'bg-transparent dark:border-transparent cn-tabs-trigger@selected+variant=line',
    },
  ],
});

const tabsTriggerUnderlineVariants = cva('absolute bg-foreground', {
  variants: {
    orientation: {
      horizontal: 'inset-x-0 -bottom-[5px] h-0.5',
      vertical: 'inset-y-0 -right-1 w-0.5',
    },
  },
});

type TabsProps = TabsPrimitive.RootProps;

/**
 * A set of panels of which the one whose TabsContent `value` matches is shown, switched by the
 * TabsTrigger children of a TabsList. It is controlled: pressing a trigger calls `onValueChange` with
 * its value, and its panel shows once `value` follows. A vertical Tabs puts its list beside the panel.
 */
function Tabs({ className, orientation = 'horizontal', ...props }: TabsProps): ReactNode {
  return (
    <TabsOrientationContext.Provider value={orientation}>
      <TabsPrimitive.Root
        className={cn(tabsVariants({ orientation }), className)}
        orientation={orientation}
        {...props}
      />
    </TabsOrientationContext.Provider>
  );
}

type TabsListProps = TabsPrimitive.ListProps & Pick<VariantProps<typeof tabsListVariants>, 'variant'>;

/**
 * The row of a Tabs' TabsTrigger children, announced as a tab list. `default` draws a muted bar with
 * the selected trigger raised on it; `line` draws no bar and underlines the selected trigger. A
 * horizontal list is as wide as its Tabs, and its triggers share the width.
 */
function TabsList({ className, variant = 'default', ...props }: TabsListProps): ReactNode {
  const orientation = useContext(TabsOrientationContext);

  return (
    <TabsListVariantContext.Provider value={variant ?? 'default'}>
      <TabsPrimitive.List className={cn(tabsListVariants({ variant, orientation }), className)} {...props} />
    </TabsListVariantContext.Provider>
  );
}

type TabsTriggerProps = Omit<TabsPrimitive.TriggerProps, 'children'> & {
  /** The label, a Text and an optional Icon; a line list draws its underline after them. */
  children?: ReactNode;
};

/**
 * The control that shows the panel of the same `value`, announced as a tab with its selected and
 * disabled state. Its label goes in as a Text child, in the foreground colour while selected and
 * dimmed otherwise, and an Icon child takes a 16px size. A disabled trigger is dimmed and ignores
 * presses.
 */
function TabsTrigger({ className, value, children, ...props }: TabsTriggerProps): ReactNode {
  const orientation = useContext(TabsOrientationContext);
  const variant = useContext(TabsListVariantContext);
  const selected = TabsPrimitive.useRootContext().value === value;

  return (
    <TextClassContext.Provider
      value={cn(
        'cn-tabs-trigger/text text-foreground/60 dark:text-muted-foreground',
        selected && 'text-foreground dark:text-foreground',
      )}
    >
      <IconClassContext.Provider value="cn-tabs-trigger/icon">
        <TabsPrimitive.Trigger
          className={cn(tabsTriggerVariants({ variant, orientation, selected }), className)}
          value={value}
          {...props}
        >
          {children}
          {variant === 'line' && selected && <View className={tabsTriggerUnderlineVariants({ orientation })} />}
        </TabsPrimitive.Trigger>
      </IconClassContext.Provider>
    </TextClassContext.Provider>
  );
}

type TabsContentProps = TabsPrimitive.ContentProps;

/**
 * The panel shown while its `value` is the selected one, announced as a tab panel; the others are not
 * rendered unless given `forceMount`. A Text child takes the style's panel text size.
 */
function TabsContent({ className, ...props }: TabsContentProps): ReactNode {
  return (
    <TextClassContext.Provider value="cn-tabs-content/text">
      <TabsPrimitive.Content className={cn('cn-tabs-content', className)} {...props} />
    </TextClassContext.Provider>
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants };
export type { TabsContentProps, TabsListProps, TabsProps, TabsTriggerProps };
