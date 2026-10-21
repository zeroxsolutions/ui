import * as MenubarPrimitive from '@rn-primitives/menubar';
import { Check, ChevronRight } from 'lucide-react-native';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type RefObject,
} from 'react';
import { Platform, Pressable, StyleSheet, View, type GestureResponderEvent, type Role } from 'react-native';
import Animated from 'react-native-reanimated';
import { useHighlight, useMenuMotion, type MenuSide } from '../lib/menu';
import { useModalOverlay, usePortalHostCheck } from '../lib/overlay';
import { cn } from '../lib/utils';
import { Icon, IconClassContext } from './icon';
import { Text, TextClassContext } from './text';

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` and `cn-<slot>/icon` for its
// text and icon classes, and `cn-<slot>@<state>` for the classes the style puts behind that state; the
// registry build replaces each with the classes translated for the target engine.

type MenubarProps = Omit<MenubarPrimitive.RootProps, 'value' | 'onValueChange'>;

/**
 * A bar of menus, such as File, Edit and View, announced as a `menubar`; one of its MenubarMenus is open at a
 * time. Holds a MenubarMenu per menu.
 */
function Menubar({ className, ...props }: MenubarProps): ReactNode {
  // The value of the open MenubarMenu, if any.
  const [value, setValue] = useState<string | undefined>(undefined);
  return (
    <MenubarPrimitive.Root
      value={value}
      onValueChange={setValue}
      className={cn('flex-row items-center cn-menubar', className)}
      {...props}
    />
  );
}

/** The open menu's trigger, which the menu measures to open itself beside it. */
const MenubarTriggerRefContext = createContext<RefObject<MenubarPrimitive.TriggerRef | null> | undefined>(undefined);

type MenubarMenuProps = Omit<MenubarPrimitive.MenuProps, 'value'> & {
  /** Whether the menu is open, when its owner holds the state; follow `onOpenChange` to change it. */
  open?: boolean;
  /** Whether the menu starts open, when it holds its own state. */
  defaultOpen?: boolean;
  /** Called with `true` when a press opens the menu and `false` when one closes it. */
  onOpenChange?: (open: boolean) => void;
};

/**
 * One menu of the bar: a MenubarTrigger and the MenubarContent it opens. It holds its own open state from
 * `defaultOpen`, or follows `open`; either way it reports each open and close a press asks for through
 * `onOpenChange`. Opening it closes the bar's other menu.
 */
function MenubarMenu({ open, defaultOpen = false, onOpenChange, children, ...props }: MenubarMenuProps): ReactNode {
  const value = useId();
  const trigger = useRef<MenubarPrimitive.TriggerRef>(null);
  const bar = MenubarPrimitive.useRootContext();
  const shown = bar.value === value;

  // The bar opens a menu beside its trigger once it knows where the trigger is, which a press measures; an
  // owner's open measures it here. The bar's context is a new object each render, so it is read through a ref.
  const barRef = useRef(bar);
  barRef.current = bar;
  const show = useCallback(
    (next: boolean) => {
      if (next) {
        trigger.current?.measure((_x, _y, width, height, pageX, pageY) => {
          barRef.current.setTriggerPosition?.({ width, height, pageX, pageY });
        });
      }
      barRef.current.onValueChange(next ? value : undefined);
    },
    [value],
  );

  // Only the first render's defaultOpen counts, as upstream's does.
  const startsOpen = useRef(defaultOpen && open === undefined);
  useEffect(() => {
    if (!startsOpen.current) return;
    startsOpen.current = false;
    show(true);
  }, [show]);

  const reported = useRef(shown);
  useEffect(() => {
    if (reported.current === shown) return;
    reported.current = shown;
    // Following `open` itself is no change the owner asked for.
    if (shown !== open) onOpenChange?.(shown);
  }, [shown, open, onOpenChange]);

  useEffect(() => {
    if (open !== undefined && open !== shown) show(open);
  }, [open, shown, show]);

  return (
    <MenubarTriggerRefContext.Provider value={trigger}>
      <MenubarPrimitive.Menu value={value} {...props}>
        {children}
      </MenubarPrimitive.Menu>
    </MenubarTriggerRefContext.Provider>
  );
}

/**
 * Kept so upstream's markup ports as it is: MenubarContent already draws itself in the app's PortalHost, so
 * this draws its children where it stands.
 */
function MenubarPortal({ children }: { children?: ReactNode }): ReactNode {
  return children;
}

type MenubarTriggerProps = Omit<ComponentProps<typeof MenubarPrimitive.Trigger>, 'children'> & {
  children?: ReactNode;
};

/**
 * The menu's name in the bar, such as File. A press opens its menu and closes the bar's other one, and
 * another press closes it. It is announced as expanded or collapsed, and drawn pressed in while its menu is
 * open; focus returns to it when the menu closes.
 */
function MenubarTrigger({ className, ref, ...props }: MenubarTriggerProps): ReactNode {
  const menuRef = useContext(MenubarTriggerRefContext);
  const { value } = MenubarPrimitive.useRootContext();
  const expanded = value !== undefined && value === MenubarPrimitive.useMenuContext().value;
  const composed = useCallback(
    (node: MenubarPrimitive.TriggerRef | null) => {
      if (menuRef !== undefined) menuRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [menuRef, ref],
  );
  return (
    <TextClassContext.Provider value="cn-menubar-trigger/text">
      <MenubarPrimitive.Trigger
        ref={composed}
        className={cn('flex-row items-center cn-menubar-trigger', expanded && 'cn-menubar-trigger@expanded', className)}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

type MenubarContentProps = Omit<
  MenubarPrimitive.ContentProps,
  'side' | 'insets' | 'disablePositioningStyle' | 'children'
> & {
  children?: ReactNode;
  /**
   * The side of the trigger the menu opens on. On a device it opens above or below the trigger, so `left`
   * and `right` open it below.
   */
  side?: MenuSide;
  /** The `name` of the PortalHost to draw in, when it is not the app's own. */
  portalHost?: string;
};

/**
 * The menu itself, drawn 8px below its trigger and 4px before its start by default, announced as a `menu`;
 * accessibility focus moves into it as it opens. A press outside it, the Android back button, the iOS escape
 * gesture and Escape on the web close it. It fades in while growing from 95% and sliding 0.5rem away from the
 * trigger over 100ms, and out the same way, or appears and goes at once when the system asks for reduced
 * motion.
 */
function MenubarContent({
  className,
  children,
  align = 'start',
  alignOffset = -4,
  side = 'bottom',
  sideOffset = 8,
  portalHost,
  ...props
}: MenubarContentProps): ReactNode {
  const bar = MenubarPrimitive.useRootContext();
  const open = bar.value !== undefined && bar.value === MenubarPrimitive.useMenuContext().value;
  // The primitive places the menu above or below its trigger on a device; the web's places it on any side.
  const placed = Platform.OS === 'web' || side === 'top' ? side : 'bottom';
  const { present, style } = useMenuMotion(open, placed);
  const hostCheck = usePortalHostCheck(present, 'Menubar', portalHost);
  // Upstream's menu is modal: the screen behind it is out of a screen reader's reach while it is open.
  const modalLayer = useModalOverlay(present);

  // On the web a menu going out would still be a layer Radix dismisses the bar from when the focus moves on, so
  // the arrow keys that move to the next menu would close both; there it goes at once.
  if (!present || (Platform.OS === 'web' && !open)) return null;

  const menu = (
    <MenubarPrimitive.Content
      forceMount
      align={align}
      alignOffset={alignOffset}
      // The web's primitive takes every side, though its type names only the two a device's takes.
      side={side as MenubarPrimitive.ContentProps['side']}
      sideOffset={sideOffset}
      {...props}
    >
      <TextClassContext.Provider value="cn-menubar-content/text">
        {/* Not every engine styles an Animated.View by its className, so the box is a View inside it. */}
        <Animated.View style={style}>
          <View className={cn('cn-menubar-content', className)}>{children}</View>
        </Animated.View>
      </TextClassContext.Provider>
    </MenubarPrimitive.Content>
  );

  return (
    <MenubarPrimitive.Portal hostName={portalHost} forceMount>
      {/* The web's portal slots its one child into the page, where Radix places the menu and closes it on a
          press outside; a device draws the menu in a full-screen layer of its own. */}
      {Platform.OS === 'web' ? (
        menu
      ) : (
        // Closing, it lets presses through to the screen while it fades.
        <View style={[StyleSheet.absoluteFill, { pointerEvents: open ? 'box-none' : 'none' }]} {...modalLayer}>
          {hostCheck}
          {/* A press outside the menu lands here. It closes through the open state alone: the primitive's own
              close forgets where the trigger is, which removes the menu before it can go out. */}
          <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={() => bar.onValueChange(undefined)} />
          {menu}
        </View>
      )}
    </MenubarPrimitive.Portal>
  );
}

type MenubarGroupProps = ComponentProps<typeof MenubarPrimitive.Group>;

/** Items that belong together, announced as a `group`; a MenubarLabel inside names what they are. */
function MenubarGroup(props: MenubarGroupProps): ReactNode {
  return <MenubarPrimitive.Group {...props} />;
}

type MenubarLabelProps = ComponentProps<typeof Text> & {
  /** Indents the label to line up with the text of a checkbox or radio item. */
  inset?: boolean;
};

/** The muted heading over a group of items. */
function MenubarLabel({ className, inset, ...props }: MenubarLabelProps): ReactNode {
  return (
    <MenubarPrimitive.Label asChild>
      <Text
        className={cn('cn-menubar-label cn-menubar-label/text', inset && 'cn-menubar-label@inset', className)}
        {...props}
      />
    </MenubarPrimitive.Label>
  );
}

/** Whether the item around a MenubarShortcut is highlighted, which the shortcut's colour follows. */
const MenubarItemHighlightContext = createContext(false);

/** What pressing an item does to the menu: runs the item, then closes the menu unless told not to. */
function usePressClosing(closeOnClick: boolean, onPress: ((event: GestureResponderEvent) => void) | undefined) {
  const { onValueChange } = MenubarPrimitive.useRootContext();
  return {
    // On a device the menu closes through the open state alone, so it can go out; the web's primitive
    // closes it itself.
    closeOnPress: Platform.OS === 'web' ? closeOnClick : false,
    onPress: (event: GestureResponderEvent) => {
      onPress?.(event);
      if (closeOnClick && Platform.OS !== 'web') onValueChange(undefined);
    },
  };
}

type MenubarItemProps = Omit<MenubarPrimitive.ItemProps, 'closeOnPress'> & {
  /** Indents the item to line up with the text of a checkbox or radio item. */
  inset?: boolean;
  /** `destructive` draws the item in the destructive colour, for an action such as deleting. */
  variant?: 'default' | 'destructive';
  /** Whether pressing the item closes the menu. */
  closeOnClick?: boolean;
};

/**
 * An action in the menu, announced as a `menuitem`. Pressing it runs `onPress` and closes the menu, unless
 * `closeOnClick` is false. It is highlighted while a finger is on it, or the pointer or the keyboard's focus
 * on the web. A disabled item is dimmed, announced as disabled and ignores presses.
 */
function MenubarItem({
  className,
  inset,
  variant = 'default',
  closeOnClick = true,
  onPress,
  ...props
}: MenubarItemProps): ReactNode {
  const { highlighted, handlers } = useHighlight(props);
  const menuText = useContext(TextClassContext);
  const destructive = variant === 'destructive';
  return (
    <MenubarItemHighlightContext.Provider value={highlighted}>
      <TextClassContext.Provider
        value={cn(
          menuText,
          'cn-menubar-item/text',
          destructive && 'cn-menubar-item/text@variant=destructive',
          highlighted && 'cn-menubar-item/text@highlighted',
          highlighted && destructive && 'cn-menubar-item/text@highlighted+variant=destructive',
        )}
      >
        <IconClassContext.Provider value="cn-menubar-item/icon">
          <MenubarPrimitive.Item
            className={cn(
              'relative flex-row items-center cn-menubar-item',
              inset && 'cn-menubar-item@inset',
              props.disabled === true && 'opacity-50',
              highlighted && 'cn-menubar-item@highlighted',
              highlighted && destructive && 'cn-menubar-item@highlighted+variant=destructive',
              className,
            )}
            {...props}
            {...handlers}
            {...usePressClosing(closeOnClick, onPress)}
          />
        </IconClassContext.Provider>
      </TextClassContext.Provider>
    </MenubarItemHighlightContext.Provider>
  );
}

/**
 * The role a checkbox or radio item takes on the web, where Radix draws the menu. A device has no such role,
 * so there the primitive's `checkbox` or `radio` stands, which announces the checked state.
 */
function webItemRole(role: 'menuitemcheckbox' | 'menuitemradio'): {
  role?: Role;
} {
  return Platform.OS === 'web' ? { role: role as Role } : {};
}

type MenubarCheckboxItemProps = Omit<
  MenubarPrimitive.CheckboxItemProps,
  'checked' | 'onCheckedChange' | 'closeOnPress' | 'children'
> & {
  children?: ReactNode;
  /** Whether the item is checked, when its owner holds the state; follow `onCheckedChange` to change it. */
  checked?: boolean;
  /** Whether the item starts checked, when it holds its own state. */
  defaultChecked?: boolean;
  /** Called with the new value when a press checks or unchecks the item. */
  onCheckedChange?: (checked: boolean) => void;
  /** Indents the item; its text already lines up with an inset item's. */
  inset?: boolean;
  /** Whether pressing the item closes the menu. */
  closeOnClick?: boolean;
};

/**
 * An item that is checked or not, with a check mark at its end while checked. A press toggles it and leaves
 * the menu open, unless `closeOnClick` is true. On a device it is announced as a checkbox with its checked
 * state, and on the web as a `menuitemcheckbox`.
 */
function MenubarCheckboxItem({
  className,
  children,
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  inset,
  closeOnClick = false,
  onPress,
  ...props
}: MenubarCheckboxItemProps): ReactNode {
  const [ownChecked, setOwnChecked] = useState(defaultChecked);
  const checked = checkedProp ?? ownChecked;
  const { highlighted, handlers } = useHighlight(props);
  const menuText = useContext(TextClassContext);
  return (
    <MenubarItemHighlightContext.Provider value={highlighted}>
      <TextClassContext.Provider
        value={cn(
          menuText,
          'cn-menubar-checkbox-item/text',
          highlighted && 'cn-menubar-checkbox-item/text@highlighted',
        )}
      >
        <IconClassContext.Provider value="cn-menubar-checkbox-item-indicator/icon">
          <MenubarPrimitive.CheckboxItem
            className={cn(
              'relative flex-row items-center cn-menubar-checkbox-item',
              inset && 'cn-menubar-checkbox-item@inset',
              props.disabled === true && 'opacity-50',
              highlighted && 'cn-menubar-checkbox-item@highlighted',
              className,
            )}
            checked={checked}
            onCheckedChange={(next) => {
              setOwnChecked(next);
              onCheckedChange?.(next);
            }}
            {...webItemRole('menuitemcheckbox')}
            {...props}
            {...handlers}
            {...usePressClosing(closeOnClick, onPress)}
          >
            <View className="cn-menubar-checkbox-item-indicator pointer-events-none absolute flex items-center justify-center">
              <MenubarPrimitive.ItemIndicator>
                <Icon as={Check} />
              </MenubarPrimitive.ItemIndicator>
            </View>
            {children}
          </MenubarPrimitive.CheckboxItem>
        </IconClassContext.Provider>
      </TextClassContext.Provider>
    </MenubarItemHighlightContext.Provider>
  );
}

type MenubarRadioGroupProps = Omit<MenubarPrimitive.RadioGroupProps, 'value' | 'onValueChange'> & {
  /** The chosen item's value, when the owner holds the state; follow `onValueChange` to change it. */
  value?: string;
  /** The value chosen at the start, when the group holds its own state. */
  defaultValue?: string;
  /** Called with an item's value when a press chooses it. */
  onValueChange?: (value: string) => void;
};

/** Radio items of which one is chosen, announced as a `radiogroup`. */
function MenubarRadioGroup({
  value: valueProp,
  defaultValue,
  onValueChange,
  ...props
}: MenubarRadioGroupProps): ReactNode {
  const [ownValue, setOwnValue] = useState(defaultValue);
  return (
    <MenubarPrimitive.RadioGroup
      value={valueProp ?? ownValue}
      onValueChange={(next) => {
        setOwnValue(next);
        onValueChange?.(next);
      }}
      {...props}
    />
  );
}

type MenubarRadioItemProps = Omit<MenubarPrimitive.RadioItemProps, 'closeOnPress' | 'children'> & {
  children?: ReactNode;
  /** Indents the item; its text already lines up with an inset item's. */
  inset?: boolean;
  /** Whether pressing the item closes the menu. */
  closeOnClick?: boolean;
};

/**
 * One choice of a MenubarRadioGroup, with a check mark at its end while chosen. A press chooses it and
 * leaves the menu open, unless `closeOnClick` is true. On a device it is announced as a radio button with its
 * checked state, and on the web as a `menuitemradio`.
 */
function MenubarRadioItem({
  className,
  children,
  inset,
  closeOnClick = false,
  onPress,
  ...props
}: MenubarRadioItemProps): ReactNode {
  const { highlighted, handlers } = useHighlight(props);
  const menuText = useContext(TextClassContext);
  return (
    <MenubarItemHighlightContext.Provider value={highlighted}>
      <TextClassContext.Provider
        value={cn(menuText, 'cn-menubar-radio-item/text', highlighted && 'cn-menubar-radio-item/text@highlighted')}
      >
        <IconClassContext.Provider value="cn-menubar-radio-item/icon">
          <MenubarPrimitive.RadioItem
            className={cn(
              'relative flex-row items-center cn-menubar-radio-item',
              inset && 'cn-menubar-radio-item@inset',
              props.disabled === true && 'opacity-50',
              highlighted && 'cn-menubar-radio-item@highlighted',
              className,
            )}
            {...webItemRole('menuitemradio')}
            {...props}
            {...handlers}
            {...usePressClosing(closeOnClick, onPress)}
          >
            <View className="cn-menubar-radio-item-indicator pointer-events-none absolute flex items-center justify-center">
              <MenubarPrimitive.ItemIndicator>
                <Icon as={Check} />
              </MenubarPrimitive.ItemIndicator>
            </View>
            {children}
          </MenubarPrimitive.RadioItem>
        </IconClassContext.Provider>
      </TextClassContext.Provider>
    </MenubarItemHighlightContext.Provider>
  );
}

type MenubarSeparatorProps = ComponentProps<typeof MenubarPrimitive.Separator>;

/** A hairline between groups of items. */
function MenubarSeparator({ className, ...props }: MenubarSeparatorProps): ReactNode {
  return <MenubarPrimitive.Separator className={cn('-mx-1 my-1 h-px cn-menubar-separator', className)} {...props} />;
}

type MenubarShortcutProps = ComponentProps<typeof Text>;

/** The keys that run an item, drawn muted at the item's end. */
function MenubarShortcut({ className, ...props }: MenubarShortcutProps): ReactNode {
  const highlighted = useContext(MenubarItemHighlightContext);
  return (
    <Text
      className={cn(
        'ml-auto cn-menubar-shortcut cn-menubar-shortcut/text',
        highlighted && 'cn-menubar-shortcut/text@highlighted',
        className,
      )}
      {...props}
    />
  );
}

type MenubarSubProps = ComponentProps<typeof MenubarPrimitive.Sub>;

/**
 * A menu inside the menu, opened from its MenubarSubTrigger. It holds its own open state from
 * `defaultOpen`, or follows `open` and reports changes through `onOpenChange`.
 */
function MenubarSub(props: MenubarSubProps): ReactNode {
  return <MenubarPrimitive.Sub {...props} />;
}

type MenubarSubTriggerProps = Omit<ComponentProps<typeof MenubarPrimitive.SubTrigger>, 'children'> & {
  children?: ReactNode;
  /** Indents the item to line up with the text of a checkbox or radio item. */
  inset?: boolean;
};

/**
 * The item that opens a sub-menu, with a chevron at its end, announced as a `menuitem` that is expanded or
 * collapsed. A press opens the sub-menu, and on a device another closes it.
 */
function MenubarSubTrigger({ className, inset, children, ...props }: MenubarSubTriggerProps): ReactNode {
  const { open } = MenubarPrimitive.useSubContext();
  const { highlighted, handlers } = useHighlight(props);
  const menuText = useContext(TextClassContext);
  return (
    <TextClassContext.Provider
      value={cn(
        menuText,
        'cn-menubar-sub-trigger/text',
        open && 'cn-menubar-sub-trigger/text@open',
        highlighted && 'cn-menubar-sub-trigger/text@highlighted',
      )}
    >
      <IconClassContext.Provider value="cn-menubar-sub-trigger/icon">
        <MenubarPrimitive.SubTrigger
          className={cn(
            'flex-row items-center cn-menubar-sub-trigger',
            inset && 'cn-menubar-sub-trigger@inset',
            open && 'cn-menubar-sub-trigger@open',
            highlighted && 'cn-menubar-sub-trigger@highlighted',
            className,
          )}
          {...props}
          {...handlers}
        >
          {children}
          {/* Not every engine lays out an svg by its className, so the chevron is pushed to the end by a View. */}
          <View className="ml-auto">
            <Icon as={ChevronRight} />
          </View>
        </MenubarPrimitive.SubTrigger>
      </IconClassContext.Provider>
    </TextClassContext.Provider>
  );
}

type MenubarSubContentProps = ComponentProps<typeof MenubarPrimitive.SubContent>;

/**
 * The items of a sub-menu. On a device they open in place under their MenubarSubTrigger; on the web
 * beside it.
 */
function MenubarSubContent({ className, ...props }: MenubarSubContentProps): ReactNode {
  return (
    <TextClassContext.Provider value="cn-menubar-sub-content/text">
      <MenubarPrimitive.SubContent className={cn('cn-menubar-sub-content', className)} {...props} />
    </TextClassContext.Provider>
  );
}

export {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarPortal,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
};
export type {
  MenubarCheckboxItemProps,
  MenubarContentProps,
  MenubarGroupProps,
  MenubarItemProps,
  MenubarLabelProps,
  MenubarMenuProps,
  MenubarProps,
  MenubarRadioGroupProps,
  MenubarRadioItemProps,
  MenubarSeparatorProps,
  MenubarShortcutProps,
  MenubarSubContentProps,
  MenubarSubProps,
  MenubarSubTriggerProps,
  MenubarTriggerProps,
};
