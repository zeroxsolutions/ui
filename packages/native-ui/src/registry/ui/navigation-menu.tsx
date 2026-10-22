import * as PopoverPrimitive from '@rn-primitives/popover';
import { Slot } from '@rn-primitives/slot';
import { cva } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react-native';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
  type PointerEvent,
} from 'react-native';
import Animated, { Easing, useAnimatedStyle } from 'react-native-reanimated';
import { useHighlight } from '../lib/menu';
import { usePresence, type PopupSide } from '../lib/motion';
import { usePortalHostCheck } from '../lib/overlay';
import { cn } from '../lib/utils';
import { Icon, IconClassContext } from './icon';
import { Popover, PopoverTrigger } from './popover';
import { Text, TextClassContext } from './text';

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` and `cn-<slot>/icon` for its
// text and icon classes, and `cn-<slot>@<state>` for the classes the style puts behind that state; the
// registry build replaces each with the classes translated for the target engine.

/** Upstream's popup comes in over 0.35s on `cubic-bezier(0.22, 1, 0.36, 1)` and goes out over 150ms. */
const CONTENT_ENTER = { duration: 350, easing: Easing.bezier(0.22, 1, 0.36, 1) } as const;
const CONTENT_EXIT = { duration: 150, easing: Easing.bezier(0.25, 0.1, 0.25, 1) } as const;

/** How far in from each edge of the screen the content stops, in px. */
const SCREEN_MARGIN = 8;

/** Where the open content is drawn against its trigger, as upstream's NavigationMenuPositioner places it. */
interface NavigationMenuPlacement {
  side: PopupSide;
  sideOffset: number;
  align: 'start' | 'center' | 'end';
  alignOffset: number;
}

const DEFAULT_PLACEMENT: NavigationMenuPlacement = { side: 'bottom', sideOffset: 8, align: 'start', alignOffset: 0 };

/** Who placed the content: the positioner the menu draws itself, or one its caller draws. */
type PlacementSource = 'root' | 'caller';

/** How the open content was opened: a pointer resting on its trigger on the web, or a press. */
type OpenReason = 'hover' | 'press';

interface NavigationMenuState {
  /** The value of the item whose content is open, `null` while none is. */
  value: unknown;
  /** Opens the item of `value`, or closes the open one with `null`. */
  change: (value: unknown, reason: OpenReason) => void;
  openedBy: OpenReason;
  /** On the web: opens `value` once the pointer has rested `delay` ms, or closes after `closeDelay` ms. */
  hoverOpen: (value: unknown) => void;
  hoverClose: () => void;
  cancelHoverClose: () => void;
  /** Marks whether a finger, or the pointer's button, is down on a trigger, whose press a close then is. */
  pressTrigger: (down: boolean) => void;
  placement: NavigationMenuPlacement;
  /**
   * Sets where content is placed: `root` from the menu's own positioner, `caller` from one the caller draws,
   * which wins while it is mounted; `null` withdraws it.
   */
  setPlacement: (source: PlacementSource, placement: NavigationMenuPlacement | null) => void;
}

const NavigationMenuContext = createContext<NavigationMenuState | undefined>(undefined);

function useNavigationMenu(part: string): NavigationMenuState {
  const menu = useContext(NavigationMenuContext);
  if (menu === undefined) throw new Error(`${part} must be used within a NavigationMenu.`);
  return menu;
}

/** The item a part sits in: its value and whether its content is open. */
interface NavigationMenuItemState {
  value: unknown;
  open: boolean;
}

const NavigationMenuItemContext = createContext<NavigationMenuItemState | undefined>(undefined);

type NavigationMenuProps<Value = string> = Omit<ComponentProps<typeof View>, 'children'> & {
  /** The value of the item whose content is open, when its owner holds the state; `null` for none. */
  value?: Value | null;
  /** The item whose content starts open, when the menu holds its own state. */
  defaultValue?: Value | null;
  /** Called with the item that opens, or `null` as the open one closes. */
  onValueChange?: (value: Value | null) => void;
  /** How long, in ms, the pointer rests on a trigger before the web opens its content. */
  delay?: number;
  /** How long, in ms, after the pointer leaves a trigger and its content before the web closes it. */
  closeDelay?: number;
  /** How the content lines up with its trigger. */
  align?: NavigationMenuPlacement['align'];
  children?: ReactNode;
};

/**
 * Links to the app's sections, with items whose trigger opens a panel of more links. A navigation
 * landmark, named Main unless given an `aria-label`. One item's content is open at a time: a press on its
 * trigger opens it and a second press, a press outside it, the Android back button or Escape on the web
 * close it. On the web the pointer resting on a trigger also opens it, and leaving the trigger and its
 * content closes what it opened. It holds the open item from `defaultValue`, or follows `value`, and
 * reports each change through `onValueChange`. Holds a NavigationMenuList.
 */
function NavigationMenu<Value = string>({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  delay = 50,
  closeDelay = 50,
  align = 'start',
  className,
  children,
  'aria-label': label = 'Main',
  ...props
}: NavigationMenuProps<Value>): ReactNode {
  const [ownValue, setOwnValue] = useState<unknown>(defaultValue);
  const value = valueProp === undefined ? ownValue : valueProp;
  const [openedBy, setOpenedBy] = useState<OpenReason>('press');
  const [placements, setPlacements] = useState<Record<PlacementSource, NavigationMenuPlacement | null>>({
    root: { ...DEFAULT_PLACEMENT, align },
    caller: null,
  });
  const placement = placements.caller ?? placements.root ?? DEFAULT_PLACEMENT;
  const setPlacement = useCallback(
    (source: PlacementSource, next: NavigationMenuPlacement | null) =>
      setPlacements((current) => ({ ...current, [source]: next })),
    [],
  );
  const openTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const triggerPressed = useRef(false);
  // The handlers below read the latest value without being made again on each change.
  const current = useRef({ value, openedBy });
  current.current = { value, openedBy };

  const cancelHoverClose = useCallback(() => clearTimeout(closeTimer.current), []);
  useEffect(
    () => () => {
      clearTimeout(openTimer.current);
      clearTimeout(closeTimer.current);
    },
    [],
  );

  const change = useCallback(
    (next: unknown, reason: OpenReason) => {
      clearTimeout(openTimer.current);
      clearTimeout(closeTimer.current);
      const pressed = triggerPressed.current;
      // A press on a trigger whose content the pointer opened keeps it open, as upstream's does.
      if (next === null && pressed && current.current.openedBy === 'hover') {
        setOpenedBy('press');
        return;
      }
      if (next === current.current.value) return;
      if (next !== null) setOpenedBy(reason);
      setOwnValue(next);
      onValueChange?.(next as Value | null);
    },
    [onValueChange],
  );

  const hoverOpen = useCallback(
    (next: unknown) => {
      clearTimeout(closeTimer.current);
      clearTimeout(openTimer.current);
      if (current.current.value === next) return;
      openTimer.current = setTimeout(() => change(next, 'hover'), delay);
    },
    [change, delay],
  );

  const hoverClose = useCallback(() => {
    clearTimeout(openTimer.current);
    if (current.current.openedBy !== 'hover') return;
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => change(null, 'hover'), closeDelay);
  }, [change, closeDelay]);

  const pressTrigger = useCallback((down: boolean) => {
    triggerPressed.current = down;
  }, []);

  const menu = useMemo<NavigationMenuState>(
    () => ({
      value,
      change,
      openedBy,
      hoverOpen,
      hoverClose,
      cancelHoverClose,
      pressTrigger,
      placement,
      setPlacement,
    }),
    [value, change, openedBy, hoverOpen, hoverClose, cancelHoverClose, pressTrigger, placement],
  );

  return (
    <NavigationMenuContext.Provider value={menu}>
      <View
        role="navigation"
        aria-label={label}
        className={cn('relative flex-row items-center justify-center self-start cn-navigation-menu', className)}
        {...props}
      >
        {children}
        <RootPositioner align={align} />
      </View>
    </NavigationMenuContext.Provider>
  );
}

type NavigationMenuListProps = ComponentProps<typeof View>;

/** The row of a NavigationMenu's items, announced as a list. */
function NavigationMenuList({ className, ...props }: NavigationMenuListProps): ReactNode {
  return (
    <View
      role="list"
      className={cn('flex-row items-center justify-center cn-navigation-menu-list', className)}
      {...props}
    />
  );
}

type NavigationMenuItemProps = ComponentProps<typeof View> & {
  /** Names the item for the menu's `value`; one is made up when left out. */
  value?: unknown;
};

/** One entry of the list: a NavigationMenuTrigger with its NavigationMenuContent, or a NavigationMenuLink. */
function NavigationMenuItem({ value: valueProp, className, children, ...props }: NavigationMenuItemProps): ReactNode {
  const id = useId();
  const value = valueProp ?? id;
  const menu = useNavigationMenu('NavigationMenuItem');
  const open = menu.value !== null && menu.value === value;
  const item = useMemo(() => ({ value, open }), [value, open]);
  return (
    <NavigationMenuItemContext.Provider value={item}>
      <Popover
        role="listitem"
        open={open}
        onOpenChange={(next) => menu.change(next ? value : null, 'press')}
        className={cn('relative', className)}
        {...props}
      >
        {children}
      </Popover>
    </NavigationMenuItemContext.Provider>
  );
}

/**
 * The classes of a NavigationMenuTrigger, to draw a NavigationMenuLink in the list's row as a trigger is
 * drawn.
 */
const navigationMenuTriggerStyle = cva(
  'flex-row h-9 items-center justify-center disabled:opacity-50 cn-navigation-menu-trigger',
);

/** Props that clear the popup kind the web's primitive gives a trigger, which spreads a child's props last. */
const NO_POPUP = { 'aria-haspopup': undefined } as const;

/** Its Text children, or its string wrapped in one. */
function labelOf(children: ReactNode): ReactNode {
  return typeof children === 'string' || typeof children === 'number' ? <Text>{children}</Text> : children;
}

type NavigationMenuTriggerProps = Omit<ComponentProps<typeof PopoverTrigger>, 'children'> & {
  children?: ReactNode;
};

/**
 * Opens its item's NavigationMenuContent when pressed and closes it when pressed again, announced as a
 * button with its expanded state; on the web the pointer resting on it opens the content too. A chevron
 * after its label turns over while the content is open.
 */
function NavigationMenuTrigger({
  className,
  children,
  onHoverIn,
  onHoverOut,
  ...props
}: NavigationMenuTriggerProps): ReactNode {
  const menu = useNavigationMenu('NavigationMenuTrigger');
  const item = useContext(NavigationMenuItemContext);
  const open = item?.open ?? false;
  const { highlighted, handlers } = useHighlight(props);
  return (
    <TextClassContext.Provider value="cn-navigation-menu-trigger/text">
      <PopoverTrigger
        className={cn(
          navigationMenuTriggerStyle(),
          open && 'cn-navigation-menu-trigger@open',
          highlighted && 'cn-navigation-menu-trigger@highlighted',
          open && highlighted && 'cn-navigation-menu-trigger@highlighted+open',
          className,
        )}
        // The web's primitive marks its trigger as opening a dialog; the content is none.
        {...(Platform.OS === 'web' ? NO_POPUP : {})}
        {...props}
        {...handlers}
        onPressIn={(event: GestureResponderEvent) => {
          menu.pressTrigger(true);
          handlers.onPressIn?.(event);
        }}
        onPressOut={(event: GestureResponderEvent) => {
          // The press itself, if the finger lifted on the trigger, runs before this timer.
          setTimeout(() => menu.pressTrigger(false), 0);
          handlers.onPressOut?.(event);
        }}
        onHoverIn={(event) => {
          handlers.onHoverIn?.(event);
          onHoverIn?.(event);
          if (item !== undefined && !props.disabled) menu.hoverOpen(item.value);
        }}
        onHoverOut={(event) => {
          handlers.onHoverOut?.(event);
          onHoverOut?.(event);
          menu.hoverClose();
        }}
      >
        {labelOf(children)}
        {/* Not every engine places an icon by its margin, so the chevron's box is a View around it. */}
        <View
          aria-hidden
          className={cn('cn-navigation-menu-trigger-icon', open && 'cn-navigation-menu-trigger-icon@open')}
        >
          <Icon as={ChevronDown} className="size-full" />
        </View>
      </PopoverTrigger>
    </TextClassContext.Provider>
  );
}

/** The part of a DOM element the web's content reads and writes; the library is typed without the DOM. */
interface WebElement {
  closest(selector: string): WebElement | null;
  removeAttribute(name: string): void;
}

type NavigationMenuContentProps = Omit<
  PopoverPrimitive.ContentProps,
  'side' | 'align' | 'sideOffset' | 'alignOffset' | 'insets' | 'disablePositioningStyle'
> & {
  /** The `name` of the PortalHost to draw in, when it is not the app's own. */
  portalHost?: string;
};

/**
 * The panel of links an item's trigger opens, drawn under the trigger, 8px off it and lined up with its
 * start, as the NavigationMenu's `align` and its NavigationMenuPositioner place it, and never wider than
 * the screen. It is not modal: a screen reader reaches the screen behind it. It fades in while growing from
 * 90% over 0.35s and out over 150ms, or appears and goes at once when the system asks for reduced motion.
 */
function NavigationMenuContent({ className, children, portalHost, ...props }: NavigationMenuContentProps): ReactNode {
  const menu = useNavigationMenu('NavigationMenuContent');
  const { open, onOpenChange } = PopoverPrimitive.useRootContext();
  const { present, progress, reduced } = usePresence(open, CONTENT_ENTER, CONTENT_EXIT);
  const { placement } = menu;
  const { width } = useWindowDimensions();
  const motion = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.9 + progress.value * 0.1 }],
  }));
  const hostCheck = usePortalHostCheck(present, 'NavigationMenu', portalHost);
  // The web's primitive draws its content inside an element announced as a dialog; upstream's is none. Its
  // portal mounts that element a render after the content opens, so the role goes as the content is attached.
  const ref = useCallback((node: PopoverPrimitive.ContentRef | null) => {
    if (Platform.OS !== 'web') return;
    (node as unknown as WebElement | null)?.closest('[role="dialog"]')?.removeAttribute('role');
  }, []);

  if (!present) return null;

  const onPointerEnter = (event: PointerEvent) => {
    if (event.nativeEvent.pointerType === 'mouse') menu.cancelHoverClose();
  };
  const onPointerLeave = (event: PointerEvent) => {
    if (event.nativeEvent.pointerType === 'mouse') menu.hoverClose();
  };

  const content = (
    <PopoverPrimitive.Content
      forceMount
      ref={ref}
      align={placement.align}
      alignOffset={placement.alignOffset}
      // The web's primitive takes every side, though its type names only the two a device's takes.
      side={placement.side as PopoverPrimitive.ContentProps['side']}
      sideOffset={placement.sideOffset}
      // Opened by the pointer resting on its trigger, the content leaves the keyboard's focus where it is.
      onOpenAutoFocus={(event: Event) => {
        if (menu.openedBy === 'hover') event.preventDefault();
      }}
      {...(Platform.OS === 'web' ? {} : { role: undefined, 'aria-modal': false })}
      {...props}
    >
      <TextClassContext.Provider value="cn-navigation-menu-popup/text">
        {/* Not every engine styles an Animated.View by its className, so the box is a View inside it. */}
        <Animated.View style={[{ transformOrigin: 'top' }, !reduced && motion]}>
          <View
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
            style={{ maxWidth: width - 2 * SCREEN_MARGIN }}
            className="cn-navigation-menu-popup overflow-hidden"
          >
            <View className={cn('cn-navigation-menu-content', className)}>{children}</View>
          </View>
        </Animated.View>
      </TextClassContext.Provider>
    </PopoverPrimitive.Content>
  );

  return (
    <PopoverPrimitive.Portal hostName={portalHost} forceMount>
      {/* The web's portal slots its one child into the page, where Radix places the content and closes it on a
          press outside; a device draws the content in a full-screen layer of its own. */}
      {Platform.OS === 'web' ? (
        content
      ) : (
        // The portal draws outside this tree, so the menu is handed in again.
        <NavigationMenuContext.Provider value={menu}>
          {/* Closing, it lets presses through to the screen while it fades. */}
          <View style={[StyleSheet.absoluteFill, { pointerEvents: open ? 'box-none' : 'none' }]}>
            {hostCheck}
            {/* A press outside the content lands here. It closes through the open state alone: the primitive's
                own close forgets where the trigger is, which removes the content before it can go out. */}
            <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={() => onOpenChange(false)} />
            {content}
          </View>
        </NavigationMenuContext.Provider>
      )}
    </PopoverPrimitive.Portal>
  );
}

type NavigationMenuPositionerProps = Partial<NavigationMenuPlacement>;

/**
 * Where every item's content is drawn against its trigger: on `side`, `sideOffset` px off it, lined up by
 * `align` and `alignOffset`. A NavigationMenu draws one itself, from its own `align`, which one drawn inside
 * the menu overrides while it is mounted; it draws nothing. On
 * a device the content opens above or below its trigger, so `left` and `right` open it below.
 */
function NavigationMenuPositioner(props: NavigationMenuPositionerProps): ReactNode {
  usePlacement('caller', props);
  return null;
}

/** The positioner a NavigationMenu draws itself, which one its caller draws overrides. */
function RootPositioner(props: NavigationMenuPositionerProps): ReactNode {
  usePlacement('root', props);
  return null;
}

/** Hands the menu where `source` places its content, and withdraws it on unmount. */
function usePlacement(
  source: PlacementSource,
  {
    side = DEFAULT_PLACEMENT.side,
    sideOffset = DEFAULT_PLACEMENT.sideOffset,
    align = DEFAULT_PLACEMENT.align,
    alignOffset = DEFAULT_PLACEMENT.alignOffset,
  }: NavigationMenuPositionerProps,
): void {
  const { setPlacement } = useNavigationMenu('NavigationMenuPositioner');
  // The primitive places the content above or below its trigger on a device; the web's places it on any side.
  const placed = Platform.OS === 'web' || side === 'top' ? side : 'bottom';
  useEffect(() => {
    setPlacement(source, { side: placed, sideOffset, align, alignOffset });
    return () => setPlacement(source, null);
  }, [setPlacement, source, placed, sideOffset, align, alignOffset]);
}

type NavigationMenuLinkProps = Omit<ComponentProps<typeof Pressable>, 'children'> & {
  children?: ReactNode;
  /** Marks the link as the current page, drawn on the muted background. */
  active?: boolean;
  /**
   * Whether pressing the link closes the open content: by default on a device, where the content would
   * stay drawn over the screen the link opens, and not on the web, as upstream's.
   */
  closeOnClick?: boolean;
  /** Renders the single child, such as expo-router's `Link asChild`, with the link's props merged on. */
  asChild?: boolean;
};

/**
 * A link to a screen, announced as a link and as the current page while `active`; `onPress` navigates.
 * It is highlighted while a finger is on it, or the pointer or the keyboard's focus on the web. Its Text
 * children are its label.
 */
function NavigationMenuLink({
  className,
  children,
  active = false,
  closeOnClick = Platform.OS !== 'web',
  asChild = false,
  onPress,
  ...props
}: NavigationMenuLinkProps): ReactNode {
  const menu = useNavigationMenu('NavigationMenuLink');
  const { highlighted, handlers } = useHighlight(props);
  const Component = asChild ? Slot : Pressable;
  return (
    <TextClassContext.Provider value={cn(useContext(TextClassContext), 'cn-navigation-menu-link/text')}>
      <IconClassContext.Provider value="cn-navigation-menu-link/icon">
        <Component
          role="link"
          aria-selected={active || undefined}
          {...(Platform.OS === 'web' && active ? { 'aria-current': 'page' } : {})}
          className={cn(
            'flex-row items-center cn-navigation-menu-link',
            active && 'cn-navigation-menu-link@selected',
            highlighted && 'cn-navigation-menu-link@highlighted',
            className,
          )}
          {...props}
          {...handlers}
          onPress={(event: GestureResponderEvent) => {
            onPress?.(event);
            if (closeOnClick) menu.change(null, 'press');
          }}
        >
          {labelOf(children)}
        </Component>
      </IconClassContext.Provider>
    </TextClassContext.Provider>
  );
}

type NavigationMenuIndicatorProps = ComponentProps<typeof View>;

/** A small arrow under its item's trigger while the item's content is open; hidden from screen readers. */
function NavigationMenuIndicator({ className, ...props }: NavigationMenuIndicatorProps): ReactNode {
  const item = useContext(NavigationMenuItemContext);
  if (item?.open !== true) return null;
  return (
    <View
      aria-hidden
      className={cn('h-1.5 items-center justify-end overflow-hidden cn-navigation-menu-indicator', className)}
      {...props}
    >
      <View className="cn-navigation-menu-indicator-arrow relative top-[60%] h-2 w-2 rotate-45" />
    </View>
  );
}

export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuPositioner,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
};
export type {
  NavigationMenuContentProps,
  NavigationMenuIndicatorProps,
  NavigationMenuItemProps,
  NavigationMenuLinkProps,
  NavigationMenuListProps,
  NavigationMenuPositionerProps,
  NavigationMenuProps,
  NavigationMenuTriggerProps,
};
