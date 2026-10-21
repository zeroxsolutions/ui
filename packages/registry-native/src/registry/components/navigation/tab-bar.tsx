import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { Pressable, View } from 'react-native';
import { Badge } from '../../ui/badge';
import { IconClassContext } from '../../ui/icon';
import { Text, TextClassContext } from '../../ui/text';
import { cn } from '../../lib/utils';

/** The screen edge the bar sits at. */
type TabBarSide = 'top' | 'right' | 'bottom' | 'left';

/** Which labels show: every one, only the active item's, or none. A hidden label still names its item. */
type TabBarLabels = 'always' | 'selected' | 'none';

/** `translucent` is `bg-background/70`, `solid` is `bg-background`. */
type TabBarSurface = 'translucent' | 'solid';

/** `attached` runs edge to edge, `floating` is a pill inset 16px from the edges. */
type TabBarShape = 'attached' | 'floating';

const ATTACHED_EDGE: Readonly<Record<TabBarSide, string>> = {
  top: 'inset-x-0 top-0 p-2 shadow-md',
  bottom: 'inset-x-0 bottom-0 p-2 shadow-md',
  left: 'inset-y-0 left-0 w-[88px] px-2 py-3 shadow-md',
  right: 'inset-y-0 right-0 w-[88px] px-2 py-3 shadow-md',
};

const FLOATING_EDGE: Readonly<Record<TabBarSide, string>> = {
  top: 'inset-x-4 top-4',
  bottom: 'inset-x-4 bottom-4',
  left: 'left-4 top-4',
  right: 'right-4 top-4',
};

interface TabBarContextValue {
  side: TabBarSide;
  labels: TabBarLabels;
}

const TabBarContext = createContext<TabBarContextValue | null>(null);

function useTabBar(): TabBarContextValue {
  const context = useContext(TabBarContext);
  if (!context) throw new Error('TabBar parts must be used within <TabBar>');
  return context;
}

interface TabBarItemContextValue {
  active: boolean;
  pressed: boolean;
  setDescription: Dispatch<SetStateAction<string | undefined>>;
}

const TabBarItemContext = createContext<TabBarItemContextValue | null>(null);

function useTabBarItem(): TabBarItemContextValue {
  const context = useContext(TabBarItemContext);
  if (!context) throw new Error('TabBarItem parts must be used within <TabBarItem>');
  return context;
}

type TabBarProps = ComponentProps<typeof View> & {
  /** What the destinations are, such as `Main`. A string, because a screen reader reads it and the app translates it. */
  accessibilityLabel: string;
  /** The edge it sits at; `bottom` when omitted. Top and bottom lay the items in a row, left and right in a column. */
  side?: TabBarSide;
  /** Which labels show; `always` when omitted. */
  labels?: TabBarLabels;
  /** `translucent` when omitted, or `solid`. */
  surface?: TabBarSurface;
  /** `attached` when omitted, or `floating`, which is `rounded-full`. */
  shape?: TabBarShape;
};

/**
 * A bar of top-level destinations absolutely positioned at one edge of its parent, so render it inside
 * a full-screen parent. The app pads for the home indicator; the bar does not. It is a tablist
 * named by `accessibilityLabel`, and each destination is a `TabBarItem`, the current one `active`:
 *
 *   <TabBar accessibilityLabel="Main" labels="selected">
 *     <TabBarItem active onPress={() => go('home')}>
 *       <TabBarIndicator><TabBarIcon><Icon as={House} /></TabBarIcon></TabBarIndicator>
 *       <TabBarLabel>Home</TabBarLabel>
 *     </TabBarItem>
 *   </TabBar>
 *
 * It draws no blur: `translucent` is a 70% background.
 */
function TabBar({
  side = 'bottom',
  labels = 'always',
  surface = 'translucent',
  shape = 'attached',
  className,
  ...props
}: TabBarProps): ReactNode {
  const context = useMemo(() => ({ side, labels }), [side, labels]);
  return (
    <TabBarContext.Provider value={context}>
      <View
        accessibilityRole="tablist"
        className={cn(
          'absolute z-50',
          side === 'top' || side === 'bottom' ? 'flex-row items-center justify-between' : 'flex-col gap-1',
          surface === 'solid' ? 'bg-background' : 'bg-background/70',
          shape === 'floating' ? 'rounded-full p-1.5 shadow-lg' : null,
          shape === 'floating' ? FLOATING_EDGE[side] : ATTACHED_EDGE[side],
          className,
        )}
        {...props}
      />
    </TabBarContext.Provider>
  );
}

type TabBarItemProps = ComponentProps<typeof Pressable> & {
  /** The destination on show: announced selected, its indicator tinted and its label primary. */
  active?: boolean;
};

/**
 * One destination, a `Pressable` with the tab role that calls `onPress`, so a router's navigation goes
 * there. Its name is its `TabBarLabel`, or `accessibilityLabel` where the label is hidden and you want
 * another. A `TabBarBadge` inside it becomes its `accessibilityHint` unless you pass one.
 */
function TabBarItem({
  active = false,
  accessibilityHint,
  onPressIn,
  onPressOut,
  className,
  children,
  ...props
}: TabBarItemProps): ReactNode {
  const { side } = useTabBar();
  const [description, setDescription] = useState<string>();
  const [pressed, setPressed] = useState(false);
  const context = useMemo(() => ({ active, pressed, setDescription }), [active, pressed]);
  return (
    <TabBarItemContext.Provider value={context}>
      <TextClassContext.Provider value={active ? 'text-primary' : 'text-muted-foreground'}>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: active }}
          accessibilityHint={accessibilityHint ?? description}
          className={cn(
            'min-h-12 min-w-16 items-center justify-center gap-1 rounded-lg p-1',
            side === 'top' || side === 'bottom' ? 'flex-1' : null,
            className,
          )}
          onPressIn={(event) => {
            setPressed(true);
            onPressIn?.(event);
          }}
          onPressOut={(event) => {
            setPressed(false);
            onPressOut?.(event);
          }}
          {...props}
        >
          {children}
        </Pressable>
      </TextClassContext.Provider>
    </TabBarItemContext.Provider>
  );
}

/**
 * The pill behind the icon: tinted while its item is active, and muted while an inactive item is pressed. Holds
 * the `TabBarIcon` and any `TabBarBadge`.
 */
function TabBarIndicator({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  const { active, pressed } = useTabBarItem();
  return (
    <View
      className={cn(
        'relative h-8 w-14 items-center justify-center rounded-full',
        active ? 'bg-primary/10' : pressed && 'bg-muted',
        className,
      )}
      {...props}
    />
  );
}

/** Holds the destination's `Icon` at 20px in the item's colour, hidden from a screen reader, which reads the label. */
function TabBarIcon({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return (
    <IconClassContext.Provider value="size-5">
      <View aria-hidden className={cn('size-5 items-center justify-center', className)} {...props} />
    </IconClassContext.Provider>
  );
}

type TabBarBadgeProps = Omit<ComponentProps<typeof Badge>, 'variant' | 'children'> & {
  /** The count, such as `3`. */
  children: string | number;
  /**
   * The words a screen reader hears after the count, `new` when omitted, so `3` describes its item as
   * "3 new". A string because a screen reader reads it and an app translates it.
   */
  countLabel?: string;
};

/**
 * A destructive Badge at the indicator's top right holding a count. It is hidden from a screen reader
 * and becomes the item's `accessibilityHint`, so the item is heard as its name, then "3 new".
 * @throws {Error} when rendered outside a TabBarItem
 */
function TabBarBadge({ countLabel = 'new', className, children, ...props }: TabBarBadgeProps): ReactNode {
  const { setDescription } = useTabBarItem();
  const description = `${children} ${countLabel}`;

  useEffect(() => {
    setDescription(description);
    return () => setDescription(undefined);
  }, [description, setDescription]);

  return (
    <Badge variant="destructive" aria-hidden className={cn('absolute -top-1 left-1/2 ml-1', className)} {...props}>
      <Text>{children}</Text>
    </Badge>
  );
}

type TabBarLabelProps = ComponentProps<typeof Text>;

/**
 * The destination's name, medium-weight `text-xs` in the item colour. Where the bar's `labels` hides
 * it, it stays in the item, transparent and out of the layout, so it still names the item.
 */
function TabBarLabel({ className, ...props }: TabBarLabelProps): ReactNode {
  const { labels } = useTabBar();
  const { active } = useTabBarItem();
  const hidden = labels === 'none' || (labels === 'selected' && !active);
  return (
    <Text className={cn('font-sans-medium text-xs', hidden ? 'absolute opacity-0' : null, className)} {...props} />
  );
}

export { TabBar, TabBarBadge, TabBarIcon, TabBarIndicator, TabBarItem, TabBarLabel };
export type {
  TabBarBadgeProps,
  TabBarItemProps,
  TabBarLabels,
  TabBarLabelProps,
  TabBarProps,
  TabBarShape,
  TabBarSide,
  TabBarSurface,
};
