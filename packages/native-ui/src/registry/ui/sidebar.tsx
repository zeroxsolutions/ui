import { Portal, PortalHost } from '@rn-primitives/portal';
import { Slot } from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { PanelLeft } from 'lucide-react-native';
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
  ScrollView,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
  type MouseEvent,
  type NativeSyntheticEvent,
  type TargetedEvent,
  type ViewStyle,
} from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useReducedMotion } from '../lib/motion';
import { cn } from '../lib/utils';
import { Button } from './button';
import { DirectionProvider, useDirectionSides, useMirrored, type TextDirection } from './direction';
import { Icon, IconClassContext } from './icon';
import { Input } from './input';
import { Separator } from './separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './sheet';
import { Skeleton } from './skeleton';
import { Text, TextClassContext } from './text';
import { Tooltip, TooltipContent, TooltipTrigger, type TooltipContentProps } from './tooltip';

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` and `cn-<slot>/icon` for its
// text and icon classes, and `cn-<slot>@<state>` for the classes the style puts behind that state; the
// registry build replaces each with the classes translated for the target engine.

/** Upstream's 16rem, 18rem and 3rem, in px at the theme's 16px rem. */
const SIDEBAR_WIDTH = 256;
const SIDEBAR_WIDTH_MOBILE = 288;
const SIDEBAR_WIDTH_ICON = 48;

/** The room a floating or inset sidebar keeps around its panel when collapsed to icons: upstream's spacing(4). */
const SIDEBAR_INSET_ROOM = 16;

/** The width of the strip along the panel's edge that a SidebarRail takes presses on. */
const SIDEBAR_RAIL_WIDTH = 16;

/** The window width, in px, from which the sidebar is a panel beside the screen: Tailwind's `md`. */
const MOBILE_BREAKPOINT = 768;

/** The key that toggles the sidebar on the web with Cmd or Ctrl held. */
const SIDEBAR_KEYBOARD_SHORTCUT = 'b';

/** Upstream's 200ms linear width transition. */
const SIDEBAR_MOTION = { duration: 200, easing: Easing.linear } as const;

type SidebarState = 'expanded' | 'collapsed';

interface SidebarContextProps {
  /** `expanded` while the panel is open, `collapsed` while it is not. */
  state: SidebarState;
  /** Whether the panel is open, from `md` up. */
  open: boolean;
  setOpen: (open: boolean | ((open: boolean) => boolean)) => void;
  /** Whether the sheet is open, below `md`. */
  openMobile: boolean;
  setOpenMobile: (open: boolean | ((open: boolean) => boolean)) => void;
  /** Whether the window is narrower than `md`, where the sidebar is a sheet. */
  isMobile: boolean;
  /** Opens or closes the sheet below `md`, and the panel from it. */
  toggleSidebar: () => void;
}

/** The provider's own record of an inset Sidebar, which draws the provider in the sidebar colour. */
interface SidebarLayout {
  inset: boolean;
  setInset: (inset: boolean) => void;
}

const SidebarContext = createContext<(SidebarContextProps & SidebarLayout) | null>(null);

/**
 * The sidebar's state and the setters a part outside it, such as a button in the screen's header, opens and
 * closes it with.
 * @throws {Error} outside a SidebarProvider
 */
function useSidebar(): SidebarContextProps {
  return useSidebarLayout();
}

/** The provider's state with its own record of an inset Sidebar. */
function useSidebarLayout(): SidebarContextProps & SidebarLayout {
  const context = useContext(SidebarContext);
  if (!context) throw new Error('useSidebar must be used within a SidebarProvider.');
  return context;
}

/** The state of the Sidebar a part is drawn in, which upstream's parts read off the Sidebar's attributes. */
interface SidebarFrame {
  /** The Sidebar's `collapsible` while it is collapsed, and `''` while it is open or a sheet. */
  collapsible: '' | 'offcanvas' | 'icon' | 'none';
  /** The name of the PortalHost a SidebarRail draws in, while the Sidebar is a panel that collapses. */
  railHost?: string;
}

const SidebarFrameContext = createContext<SidebarFrame>({ collapsible: '' });

/** The parts of the web's key event and window the shortcut reads; the library is typed without the DOM. */
interface WebKeyEvent {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  preventDefault(): void;
}

interface WebWindow {
  addEventListener(type: 'keydown', listener: (event: WebKeyEvent) => void): void;
  removeEventListener(type: 'keydown', listener: (event: WebKeyEvent) => void): void;
}

type SidebarProviderProps = ComponentProps<typeof View> & {
  /** Whether the panel starts open, when the provider holds its own state. */
  defaultOpen?: boolean;
  /** Whether the panel is open, when its owner holds the state; follow `onOpenChange` to change it. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/**
 * Holds whether the sidebar is open, and lays a Sidebar and a SidebarInset out side by side, filling its
 * parent. Below the `md` width the Sidebar is a sheet, with its own open state; from it, a panel beside the
 * screen. On the web Cmd+B or Ctrl+B opens and closes it.
 */
function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  children,
  ...props
}: SidebarProviderProps): ReactNode {
  const isMobile = useWindowDimensions().width < MOBILE_BREAKPOINT;
  const [openMobile, setOpenMobile] = useState(false);
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const [inset, setInset] = useState(false);
  const open = openProp ?? ownOpen;

  const setOpen = useCallback(
    (value: boolean | ((open: boolean) => boolean)) => {
      const next = typeof value === 'function' ? value(open) : value;
      if (setOpenProp) setOpenProp(next);
      else setOwnOpen(next);
    },
    [setOpenProp, open],
  );

  const toggleSidebar = useCallback(() => {
    if (isMobile) setOpenMobile((shown) => !shown);
    else setOpen((shown) => !shown);
  }, [isMobile, setOpen]);

  useEffect(() => {
    const page = (globalThis as { window?: WebWindow }).window;
    if (Platform.OS !== 'web' || page === undefined) return;
    const onKeyDown = (event: WebKeyEvent) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };
    page.addEventListener('keydown', onKeyDown);
    return () => page.removeEventListener('keydown', onKeyDown);
  }, [toggleSidebar]);

  const state: SidebarState = open ? 'expanded' : 'collapsed';
  const context = useMemo(
    () => ({ state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar, inset, setInset }),
    [state, open, setOpen, isMobile, openMobile, toggleSidebar, inset],
  );

  return (
    <SidebarContext.Provider value={context}>
      <View
        className={cn('flex-1 w-full flex-row overflow-hidden', inset && !isMobile && 'bg-sidebar', className)}
        {...props}
      >
        {children}
      </View>
    </SidebarContext.Provider>
  );
}

type SidebarProps = ComponentProps<typeof View> & {
  /** The edge the panel is attached to, and the sheet slides in from. */
  side?: 'left' | 'right';
  /** `floating` draws the panel as a card, `inset` sets the SidebarInset beside it as a card. */
  variant?: 'sidebar' | 'floating' | 'inset';
  /** How the panel collapses: off the screen, to its icons, or not at all. */
  collapsible?: 'offcanvas' | 'icon' | 'none';
  /** The direction the parts inside read, when it is not the app's. */
  dir?: TextDirection;
};

/**
 * The sidebar itself, holding a SidebarHeader, a SidebarContent and a SidebarFooter. Below the `md` width it
 * is a sheet sliding in from `side`, opened by `openMobile`; from it, a 16rem panel beside the SidebarInset
 * that collapses, as `collapsible` says, off the screen or to a 3rem rail of icons over 200ms, or at once
 * when the system asks for reduced motion. A `none` one is always a panel. Place it after the SidebarInset
 * when `side` is right.
 */
function Sidebar({
  side = 'left',
  variant = 'sidebar',
  collapsible = 'offcanvas',
  dir,
  className,
  children,
  ...props
}: SidebarProps): ReactNode {
  const sidebar = useSidebarLayout();
  const { isMobile, state, openMobile, setOpenMobile, setInset } = sidebar;
  const collapsed = state === 'collapsed';
  const card = variant === 'floating' || variant === 'inset';
  const iconWidth = SIDEBAR_WIDTH_ICON + (card ? SIDEBAR_INSET_ROOM : 0);
  const target = !collapsed ? SIDEBAR_WIDTH : collapsible === 'icon' ? iconWidth : 0;
  const reduced = useReducedMotion();
  const width = useSharedValue(target);
  const { sidesSwapped } = useDirectionSides();
  const railHost = useId();
  const returnFocus = useReturnFocus(isMobile && openMobile);

  useEffect(() => {
    width.value = reduced ? target : withTiming(target, SIDEBAR_MOTION);
  }, [target, reduced, width]);

  useEffect(() => {
    if (collapsible === 'none' || isMobile || variant !== 'inset') return;
    setInset(true);
    return () => setInset(false);
  }, [collapsible, isMobile, variant, setInset]);

  const gap = useAnimatedStyle(() => ({ width: width.value }));
  // An icon rail is as wide as its gap; a panel going off the screen keeps its width and slides out.
  const panel = useAnimatedStyle(() => ({ width: collapsible === 'icon' ? width.value : SIDEBAR_WIDTH }));
  // The panel is anchored at the edge that faces the screen, so a shrinking gap slides it off its own side.
  const facing = (side === 'left') !== sidesSwapped ? 'right' : 'left';
  const ownEdge = facing === 'right' ? 'left' : 'right';
  // The rail is centred on that edge, measured from the provider's edge the Sidebar sits at.
  const rail = useAnimatedStyle(() => ({ [ownEdge]: width.value - SIDEBAR_RAIL_WIDTH / 2 }));

  const inner = (frame: SidebarFrame, body: ReactNode) => (
    <SidebarFrameContext.Provider value={frame}>
      <TextClassContext.Provider value="text-sidebar-foreground">
        {dir === undefined ? body : <DirectionProvider direction={dir}>{body}</DirectionProvider>}
      </TextClassContext.Provider>
    </SidebarFrameContext.Provider>
  );

  if (collapsible === 'none') {
    return inner(
      { collapsible: '' },
      <View style={{ width: SIDEBAR_WIDTH }} className={cn('h-full flex-col bg-sidebar', className)} {...props}>
        {children}
      </View>,
    );
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          side={side}
          showCloseButton={false}
          style={{ width: SIDEBAR_WIDTH_MOBILE }}
          className={cn('bg-sidebar p-0 gap-0', className)}
          onCloseAutoFocus={returnFocus}
          {...props}
        >
          {/* Names the sheet for a screen reader, drawn out of sight. */}
          <SheetHeader className="absolute h-px w-px overflow-hidden opacity-0">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          {/* The sheet draws outside this tree, so the provider is handed in again. */}
          <SidebarContext.Provider value={sidebar}>
            {inner({ collapsible: '' }, <View className="h-full w-full flex-1 flex-col">{children}</View>)}
          </SidebarContext.Provider>
        </SheetContent>
      </Sheet>
    );
  }

  const edge = facing === 'right' ? 'border-r' : 'border-l';

  return inner(
    { collapsible: collapsed ? collapsible : '', railHost },
    <>
      {/* Not every engine styles an Animated.View by its className, so each box is a View inside one. */}
      <Animated.View style={[{ position: 'relative' }, gap]}>
        <Animated.View style={[{ position: 'absolute', top: 0, bottom: 0, [facing]: 0 }, panel]}>
          <View className={cn('flex-1', card ? 'p-2' : `${edge} border-border`, className)} {...props}>
            <View
              className={cn(
                'flex-1 w-full flex-col cn-sidebar-inner',
                variant === 'floating' && 'border border-sidebar-border cn-sidebar-inner@variant=floating',
              )}
            >
              {children}
            </View>
          </View>
        </Animated.View>
      </Animated.View>
      {/* The rail is drawn beside the panel, in the provider, where a touch reaches it even while the panel is
        off the screen: Android delivers no touch outside a parent's bounds. */}
      <Animated.View
        style={[
          { position: 'absolute', top: 0, bottom: 0, width: SIDEBAR_RAIL_WIDTH, zIndex: 20, pointerEvents: 'box-none' },
          rail,
        ]}
      >
        <PortalHost name={railHost} />
      </Animated.View>
    </>,
  );
}

/** The parts of the web's focused element the sheet reads and refocuses; the library is typed without the DOM. */
interface WebFocusable {
  focus(): void;
}

/**
 * On the web, the element that held the focus when `shown` turned true, and the sheet's close handler that
 * moves the focus back to it. The sheet has no trigger of its own for its primitive to return the focus to.
 */
function useReturnFocus(shown: boolean): (event: { preventDefault(): void }) => void {
  const previous = useRef<WebFocusable | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'web' || !shown) return;
    previous.current =
      (globalThis as { document?: { activeElement: WebFocusable | null } }).document?.activeElement ?? null;
  }, [shown]);
  return useCallback((event: { preventDefault(): void }) => {
    if (previous.current === null) return;
    event.preventDefault();
    previous.current.focus();
    previous.current = null;
  }, []);
}

type SidebarTriggerProps = ComponentProps<typeof Button>;

/** A ghost icon button named Toggle Sidebar that opens and closes the sidebar. */
function SidebarTrigger({ className, onPress, ...props }: SidebarTriggerProps): ReactNode {
  const { toggleSidebar } = useSidebar();
  const mirrored = useMirrored();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Toggle Sidebar"
      className={cn(className)}
      onPress={(event: GestureResponderEvent) => {
        onPress?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <Icon as={PanelLeft} style={mirrored} />
    </Button>
  );
}

type SidebarRailProps = ComponentProps<typeof Pressable>;

/**
 * A strip along the panel's edge that opens and closes the sidebar when pressed, named Toggle Sidebar and
 * left out of the keyboard's order; on the web a line marks it while the pointer is over it.
 */
function SidebarRail({ className, ...props }: SidebarRailProps): ReactNode {
  const { toggleSidebar } = useSidebar();
  const { railHost } = useContext(SidebarFrameContext);
  const [hovered, setHovered] = useState(false);
  const name = useId();
  if (railHost === undefined) return null;
  return (
    <Portal name={name} hostName={railHost}>
      <Pressable
        key={name}
        role="button"
        aria-label="Toggle Sidebar"
        focusable={false}
        tabIndex={-1}
        onPress={toggleSidebar}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        className={cn('h-full w-full items-center cn-sidebar-rail', className)}
        // React Native Web reads this cursor, which React Native's style type does not list.
        style={Platform.OS === 'web' ? { cursor: 'ew-resize' as ViewStyle['cursor'] } : undefined}
        {...props}
      >
        <View className={cn('h-full w-[2px]', hovered && 'bg-sidebar-border')} />
      </Pressable>
    </Portal>
  );
}

type SidebarInsetProps = ComponentProps<typeof View>;

/** The screen beside the sidebar, announced as the main content; a card with room around it by an inset Sidebar. */
function SidebarInset({ className, ...props }: SidebarInsetProps): ReactNode {
  const { inset, isMobile, state } = useSidebarLayout();
  const card = inset && !isMobile;
  return (
    <View
      role="main"
      className={cn(
        'relative w-full flex-1 flex-col cn-sidebar-inset',
        card && 'm-2 ml-0 rounded-xl shadow-sm',
        card && state === 'collapsed' && 'ml-2',
        className,
      )}
      {...props}
    />
  );
}

type SidebarInputProps = ComponentProps<typeof Input>;

/** A text field sized for the sidebar, such as a search box in its header. */
function SidebarInput({ className, ...props }: SidebarInputProps): ReactNode {
  return <Input className={cn('cn-sidebar-input', className)} {...props} />;
}

type SidebarSectionProps = ComponentProps<typeof View>;

/** The top of the sidebar, above its SidebarContent. */
function SidebarHeader({ className, ...props }: SidebarSectionProps): ReactNode {
  return <View className={cn('flex-col cn-sidebar-header', className)} {...props} />;
}

/** The bottom of the sidebar, below its SidebarContent. */
function SidebarFooter({ className, ...props }: SidebarSectionProps): ReactNode {
  return <View className={cn('flex-col cn-sidebar-footer', className)} {...props} />;
}

type SidebarSeparatorProps = ComponentProps<typeof Separator>;

/** A rule between the sidebar's sections, in the sidebar's border colour. */
function SidebarSeparator({ className, ...props }: SidebarSeparatorProps): ReactNode {
  return <Separator className={cn('w-auto cn-sidebar-separator', className)} {...props} />;
}

type SidebarContentProps = ComponentProps<typeof ScrollView>;

/** The sidebar's groups, scrolling between its header and footer; a rail of icons does not scroll. */
function SidebarContent({ className, contentContainerClassName, ...props }: SidebarContentProps): ReactNode {
  const { collapsible } = useContext(SidebarFrameContext);
  return (
    <ScrollView
      className={cn('min-h-0 flex-1', className)}
      contentContainerClassName={cn('flex-col cn-sidebar-content', contentContainerClassName)}
      scrollEnabled={collapsible !== 'icon'}
      showsVerticalScrollIndicator={false}
      {...props}
    />
  );
}

/** A section of the sidebar, holding a SidebarGroupLabel and a SidebarGroupContent or a SidebarMenu. */
function SidebarGroup({ className, ...props }: SidebarSectionProps): ReactNode {
  return <View className={cn('relative w-full min-w-0 flex-col cn-sidebar-group', className)} {...props} />;
}

/** Its Text children, or its string wrapped in one. */
function labelOf(children: ReactNode, numberOfLines?: number): ReactNode {
  return typeof children === 'string' || typeof children === 'number' ? (
    <Text numberOfLines={numberOfLines}>{children}</Text>
  ) : (
    children
  );
}

type SidebarGroupLabelProps = ComponentProps<typeof View> & {
  /** Renders the single child with the label's props and classes merged on. */
  asChild?: boolean;
};

/** The muted heading of a SidebarGroup, which slides up out of sight in a rail of icons. */
function SidebarGroupLabel({ className, asChild = false, children, ...props }: SidebarGroupLabelProps): ReactNode {
  const { collapsible } = useContext(SidebarFrameContext);
  const icons = collapsible === 'icon';
  const Component = asChild ? Slot : View;
  return (
    <TextClassContext.Provider value="cn-sidebar-group-label/text">
      <IconClassContext.Provider value="cn-sidebar-group-label/icon">
        <Component
          className={cn(
            'flex-row shrink-0 items-center cn-sidebar-group-label',
            icons && 'cn-sidebar-group-label@collapsible=icon',
            className,
          )}
          {...props}
        >
          {asChild ? children : labelOf(children)}
        </Component>
      </IconClassContext.Provider>
    </TextClassContext.Provider>
  );
}

type SidebarActionProps = ComponentProps<typeof Pressable> & {
  /** Renders the single child with the action's props and classes merged on. */
  asChild?: boolean;
};

/** A button in the corner of a SidebarGroup, beside its label; hidden in a rail of icons. */
function SidebarGroupAction({ className, asChild = false, ...props }: SidebarActionProps): ReactNode {
  const { collapsible } = useContext(SidebarFrameContext);
  const { isMobile } = useSidebar();
  const Component = asChild ? Slot : Pressable;
  if (collapsible === 'icon') return null;
  return (
    <TextClassContext.Provider value="cn-sidebar-group-action/text">
      <IconClassContext.Provider value="cn-sidebar-group-action/icon">
        <Component
          role="button"
          // Upstream widens the touch area of a small button below md.
          hitSlop={isMobile ? 8 : undefined}
          className={cn('aspect-square items-center justify-center cn-sidebar-group-action', className)}
          {...props}
        />
      </IconClassContext.Provider>
    </TextClassContext.Provider>
  );
}

/** The body of a SidebarGroup. */
function SidebarGroupContent({ className, ...props }: SidebarSectionProps): ReactNode {
  return (
    <TextClassContext.Provider value={cn(useContext(TextClassContext), 'cn-sidebar-group-content/text')}>
      <View className={cn('w-full cn-sidebar-group-content', className)} {...props} />
    </TextClassContext.Provider>
  );
}

/** A list of SidebarMenuItems. */
function SidebarMenu({ className, ...props }: SidebarSectionProps): ReactNode {
  return <View role="list" className={cn('w-full min-w-0 flex-col cn-sidebar-menu', className)} {...props} />;
}

/** What the parts of a SidebarMenuItem tell one another, which upstream reads off the button's attributes. */
interface SidebarMenuItemParts {
  /** Whether the pointer is over the item, on the web. */
  hovered: boolean;
  /** Whether the pointer is over the item's SidebarMenuButton, on the web. */
  buttonHovered: boolean;
  setButtonHovered: (hovered: boolean) => void;
  size: SidebarMenuButtonSize;
  setSize: (size: SidebarMenuButtonSize) => void;
  active: boolean;
  setActive: (active: boolean) => void;
  hasAction: boolean;
  setHasAction: (hasAction: boolean) => void;
}

const SidebarMenuItemContext = createContext<SidebarMenuItemParts | undefined>(undefined);

/** One entry of a SidebarMenu: a SidebarMenuButton, and a SidebarMenuAction, a SidebarMenuBadge or a SidebarMenuSub. */
function SidebarMenuItem({ className, ...props }: SidebarSectionProps): ReactNode {
  const [size, setSize] = useState<SidebarMenuButtonSize>('default');
  const [active, setActive] = useState(false);
  const [hasAction, setHasAction] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);
  const parts = useMemo(
    () => ({ hovered, buttonHovered, setButtonHovered, size, setSize, active, setActive, hasAction, setHasAction }),
    [hovered, buttonHovered, size, active, hasAction],
  );
  return (
    <SidebarMenuItemContext.Provider value={parts}>
      <View
        role="listitem"
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        className={cn('relative', className)}
        {...props}
      />
    </SidebarMenuItemContext.Provider>
  );
}

const sidebarMenuButtonVariants = cva(
  'w-full flex-row items-center overflow-hidden disabled:opacity-50 cn-sidebar-menu-button',
  {
    variants: {
      variant: {
        default: 'cn-sidebar-menu-button-variant-default',
        outline: 'cn-sidebar-menu-button-variant-outline',
      },
      size: {
        default: 'cn-sidebar-menu-button-size-default',
        sm: 'cn-sidebar-menu-button-size-sm',
        lg: 'cn-sidebar-menu-button-size-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const sidebarMenuButtonTextVariants = cva('cn-sidebar-menu-button/text', {
  variants: {
    size: {
      default: 'cn-sidebar-menu-button-size-default/text',
      sm: 'cn-sidebar-menu-button-size-sm/text',
      lg: 'cn-sidebar-menu-button-size-lg/text',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

type SidebarMenuButtonSize = 'default' | 'sm' | 'lg';

type SidebarMenuButtonProps = Omit<ComponentProps<typeof Pressable>, 'children'> &
  VariantProps<typeof sidebarMenuButtonVariants> & {
    children?: ReactNode;
    /** Renders the single child with the button's props and classes merged on. */
    asChild?: boolean;
    /** Marks the button as the current screen's, drawn in the accent colour and announced as selected. */
    isActive?: boolean;
    /** A label shown beside the button on the web while the sidebar is a rail of icons. */
    tooltip?: string | TooltipContentProps;
  };

/**
 * The control of a SidebarMenuItem, holding an Icon and a Text, announced as a button. It is drawn in the
 * accent colour while `isActive`, and shrinks to its icon in a rail of icons. On the web its `tooltip` shows
 * beside it while the sidebar is a rail of icons.
 */
function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = 'default',
  size = 'default',
  tooltip,
  className,
  children,
  accessibilityState,
  onHoverIn,
  onHoverOut,
  ...props
}: SidebarMenuButtonProps): ReactNode {
  const { isMobile, state } = useSidebar();
  const { collapsible } = useContext(SidebarFrameContext);
  const item = useContext(SidebarMenuItemContext);
  const icons = collapsible === 'icon';
  const resolvedSize = size ?? 'default';
  const setSize = item?.setSize;
  const setActive = item?.setActive;
  useEffect(() => setSize?.(resolvedSize), [setSize, resolvedSize]);
  useEffect(() => setActive?.(isActive), [setActive, isActive]);

  const Component = asChild ? Slot : Pressable;
  const control = (
    <Component
      role="button"
      accessibilityState={{ ...accessibilityState, selected: isActive }}
      className={cn(
        sidebarMenuButtonVariants({ variant, size }),
        isActive && 'cn-sidebar-menu-button@selected',
        item?.hasAction === true && 'cn-sidebar-menu-button@sidebar=menu-action',
        icons && 'cn-sidebar-menu-button@collapsible=icon',
        icons && size === 'lg' && 'cn-sidebar-menu-button-size-lg@collapsible=icon',
        className,
      )}
      {...props}
      onHoverIn={(event: MouseEvent) => {
        item?.setButtonHovered(true);
        onHoverIn?.(event);
      }}
      onHoverOut={(event: MouseEvent) => {
        item?.setButtonHovered(false);
        onHoverOut?.(event);
      }}
    >
      {asChild ? children : labelOf(children, 1)}
    </Component>
  );
  // A device opens a tooltip on the press that runs the button, so it shows none there.
  const tooltipShown = tooltip !== undefined && Platform.OS === 'web' && state === 'collapsed' && !isMobile;
  const content = typeof tooltip === 'string' ? { children: <Text>{tooltip}</Text> } : tooltip;

  return (
    <TextClassContext.Provider
      value={cn(
        useContext(TextClassContext),
        sidebarMenuButtonTextVariants({ size }),
        isActive && 'cn-sidebar-menu-button/text@selected',
      )}
    >
      <IconClassContext.Provider value="size-4 shrink-0">
        {tooltipShown ? (
          <Tooltip>
            <TooltipTrigger asChild>{control}</TooltipTrigger>
            <TooltipContent side="right" align="center" {...content} />
          </Tooltip>
        ) : (
          control
        )}
      </IconClassContext.Provider>
    </TextClassContext.Provider>
  );
}

type SidebarMenuActionProps = SidebarActionProps & {
  /** On the web, shows the action only while the pointer is over its item or it holds the focus. */
  showOnHover?: boolean;
};

/** A button at the end of a SidebarMenuItem, beside its SidebarMenuButton; hidden in a rail of icons. */
function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  onFocus,
  onBlur,
  ...props
}: SidebarMenuActionProps): ReactNode {
  const { collapsible } = useContext(SidebarFrameContext);
  const [focused, setFocused] = useState(false);
  const { isMobile } = useSidebar();
  const item = useContext(SidebarMenuItemContext);
  const setHasAction = item?.setHasAction;
  useEffect(() => {
    setHasAction?.(true);
    return () => setHasAction?.(false);
  }, [setHasAction]);
  const Component = asChild ? Slot : Pressable;
  if (collapsible === 'icon') return null;
  const size = item?.size ?? 'default';
  const expanded = props['aria-expanded'] === true || props.accessibilityState?.expanded === true;
  // A pointer reveals it on the web; a touch screen has none, so it stays shown there.
  const hidden = showOnHover && Platform.OS === 'web' && !isMobile && item?.hovered !== true && !focused && !expanded;
  return (
    <TextClassContext.Provider
      value={cn('cn-sidebar-menu-action/text', item?.buttonHovered === true && 'cn-sidebar-menu-action/text@hovered')}
    >
      <IconClassContext.Provider value="cn-sidebar-menu-action/icon">
        <Component
          role="button"
          hitSlop={isMobile ? 8 : undefined}
          className={cn(
            'aspect-square items-center justify-center cn-sidebar-menu-action',
            size === 'default' && 'cn-sidebar-menu-action@size=default',
            size === 'sm' && 'cn-sidebar-menu-action@size=sm',
            size === 'lg' && 'cn-sidebar-menu-action@size=lg',
            hidden && 'opacity-0',
            className,
          )}
          onFocus={(event: NativeSyntheticEvent<TargetedEvent>) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event: NativeSyntheticEvent<TargetedEvent>) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...props}
        />
      </IconClassContext.Provider>
    </TextClassContext.Provider>
  );
}

/** A count at the end of a SidebarMenuItem, such as unread messages; hidden in a rail of icons. */
function SidebarMenuBadge({ className, children, ...props }: SidebarSectionProps): ReactNode {
  const { collapsible } = useContext(SidebarFrameContext);
  const item = useContext(SidebarMenuItemContext);
  if (collapsible === 'icon') return null;
  const size = item?.size ?? 'default';
  return (
    <TextClassContext.Provider
      value={cn(
        'tabular-nums cn-sidebar-menu-badge/text',
        item?.buttonHovered === true && 'cn-sidebar-menu-badge/text@hovered',
        item?.active === true && 'cn-sidebar-menu-badge/text@selected',
      )}
    >
      <View
        pointerEvents="none"
        className={cn(
          'items-center justify-center cn-sidebar-menu-badge',
          size === 'default' && 'cn-sidebar-menu-badge@size=default',
          size === 'sm' && 'cn-sidebar-menu-badge@size=sm',
          size === 'lg' && 'cn-sidebar-menu-badge@size=lg',
          className,
        )}
        {...props}
      >
        {labelOf(children)}
      </View>
    </TextClassContext.Provider>
  );
}

type SidebarMenuSkeletonProps = ComponentProps<typeof View> & {
  /** Draws a square placeholder for the icon before the text's. */
  showIcon?: boolean;
};

/** A placeholder for a SidebarMenuItem while the menu loads, its text a random 50% to 90% wide. */
function SidebarMenuSkeleton({ className, showIcon = false, ...props }: SidebarMenuSkeletonProps): ReactNode {
  const [width] = useState(() => `${Math.floor(Math.random() * 40) + 50}%` as const);
  return (
    <View className={cn('flex-row items-center cn-sidebar-menu-skeleton', className)} {...props}>
      {showIcon && <Skeleton className="cn-sidebar-menu-skeleton-icon" />}
      <Skeleton style={{ maxWidth: width }} className="cn-sidebar-menu-skeleton-text flex-1" />
    </View>
  );
}

/** A nested list of SidebarMenuSubItems under a SidebarMenuItem, ruled along its start; hidden in a rail of icons. */
function SidebarMenuSub({ className, ...props }: SidebarSectionProps): ReactNode {
  const { collapsible } = useContext(SidebarFrameContext);
  if (collapsible === 'icon') return null;
  return <View role="list" className={cn('min-w-0 flex-col cn-sidebar-menu-sub', className)} {...props} />;
}

/** One entry of a SidebarMenuSub. */
function SidebarMenuSubItem({ className, ...props }: SidebarSectionProps): ReactNode {
  return <View role="listitem" className={cn('relative', className)} {...props} />;
}

type SidebarMenuSubButtonProps = Omit<ComponentProps<typeof Pressable>, 'children'> & {
  children?: ReactNode;
  /** Renders the single child, such as a router's link, with the link's props merged on. */
  asChild?: boolean;
  size?: 'sm' | 'md';
  /** Marks the link as the current screen's, drawn in the accent colour and announced as selected. */
  isActive?: boolean;
};

/** A link in a SidebarMenuSub, announced as a link; `onPress` navigates. */
function SidebarMenuSubButton({
  asChild = false,
  size = 'md',
  isActive = false,
  className,
  children,
  accessibilityState,
  ...props
}: SidebarMenuSubButtonProps): ReactNode {
  const Component = asChild ? Slot : Pressable;
  return (
    <TextClassContext.Provider
      value={cn(
        'cn-sidebar-menu-sub-button/text',
        size === 'md' && 'cn-sidebar-menu-sub-button/text@size=md',
        size === 'sm' && 'cn-sidebar-menu-sub-button/text@size=sm',
        isActive && 'cn-sidebar-menu-sub-button/text@selected',
      )}
    >
      <IconClassContext.Provider value="shrink-0 cn-sidebar-menu-sub-button/icon">
        <Component
          role="link"
          accessibilityState={{ ...accessibilityState, selected: isActive }}
          className={cn(
            'min-w-0 flex-row items-center overflow-hidden disabled:opacity-50 cn-sidebar-menu-sub-button',
            isActive && 'cn-sidebar-menu-sub-button@selected',
            className,
          )}
          {...props}
        >
          {asChild ? children : labelOf(children, 1)}
        </Component>
      </IconClassContext.Provider>
    </TextClassContext.Provider>
  );
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  sidebarMenuButtonVariants,
  useSidebar,
};
export type {
  SidebarContentProps,
  SidebarContextProps,
  SidebarGroupLabelProps,
  SidebarInputProps,
  SidebarInsetProps,
  SidebarMenuActionProps,
  SidebarMenuButtonProps,
  SidebarMenuSkeletonProps,
  SidebarMenuSubButtonProps,
  SidebarProps,
  SidebarProviderProps,
  SidebarRailProps,
  SidebarSeparatorProps,
  SidebarTriggerProps,
};
