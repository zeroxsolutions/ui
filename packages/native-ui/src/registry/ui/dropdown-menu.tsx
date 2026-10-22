import * as DropdownMenuPrimitive from '@rn-primitives/dropdown-menu';
import { Check, ChevronRight } from 'lucide-react-native';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type RefObject,
} from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import Animated from 'react-native-reanimated';
import { pressClosing, useHighlight, useMenuScrollHeight, webItemRole } from '../lib/menu';
import { usePopupMotion, type PopupSide } from '../lib/motion';
import { useModalOverlay, usePortalHostCheck } from '../lib/overlay';
import { cn } from '../lib/utils';
import { useDirection } from './direction';
import { Icon, IconClassContext } from './icon';
import { Text, TextClassContext } from './text';

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` and `cn-<slot>/icon` for its
// text and icon classes, and `cn-<slot>@<state>` for the classes the style puts behind that state; the
// registry build replaces each with the classes translated for the target engine.

type DropdownMenuProps = DropdownMenuPrimitive.RootProps & {
  /** Whether the menu is open, when its owner holds the state; follow `onOpenChange` to change it. */
  open?: boolean;
  /** Whether the menu starts open, when it holds its own state. */
  defaultOpen?: boolean;
};

/** The open menu's trigger, through which its root opens and closes it. */
const DropdownMenuTriggerRefContext = createContext<RefObject<DropdownMenuPrimitive.TriggerRef | null> | undefined>(
  undefined,
);

/**
 * A menu of actions that opens from its trigger. It holds its own open state from `defaultOpen`, or follows
 * `open`; either way it reports each open and close a press asks for through `onOpenChange`. Holds a
 * DropdownMenuTrigger and a DropdownMenuContent.
 */
function DropdownMenu({ open, defaultOpen = false, onOpenChange, children, ...props }: DropdownMenuProps): ReactNode {
  const trigger = useRef<DropdownMenuPrimitive.TriggerRef>(null);
  // The primitive keeps its open state to itself, and opens and closes only through its trigger.
  const [primitiveOpen, setPrimitiveOpen] = useState(false);

  // Only the first render's defaultOpen counts, as upstream's does.
  const startsOpen = useRef(defaultOpen && open === undefined);
  useEffect(() => {
    if (startsOpen.current) trigger.current?.open();
  }, []);

  useEffect(() => {
    if (open === undefined || open === primitiveOpen) return;
    if (open) trigger.current?.open();
    else trigger.current?.close();
  }, [open, primitiveOpen]);

  return (
    <DropdownMenuTriggerRefContext.Provider value={trigger}>
      <DropdownMenuPrimitive.Root
        onOpenChange={(next) => {
          setPrimitiveOpen(next);
          // Following `open` itself is no change the owner asked for.
          if (next !== open) onOpenChange?.(next);
        }}
        {...props}
      >
        {children}
      </DropdownMenuPrimitive.Root>
    </DropdownMenuTriggerRefContext.Provider>
  );
}

/**
 * Kept so upstream's markup ports as it is: DropdownMenuContent already draws itself in the app's PortalHost,
 * so this draws its children where it stands.
 */
function DropdownMenuPortal({ children }: { children?: ReactNode }): ReactNode {
  return children;
}

type DropdownMenuTriggerProps = ComponentProps<typeof DropdownMenuPrimitive.Trigger>;

/** Opens the menu when pressed, and closes it when pressed again; pass `asChild` to make a Button the trigger. */
function DropdownMenuTrigger({ ref, ...props }: DropdownMenuTriggerProps): ReactNode {
  const rootRef = useContext(DropdownMenuTriggerRefContext);
  const composed = useCallback(
    (node: DropdownMenuPrimitive.TriggerRef | null) => {
      if (rootRef !== undefined) rootRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [rootRef, ref],
  );
  return <DropdownMenuPrimitive.Trigger ref={composed} {...props} />;
}

type DropdownMenuContentProps = Omit<
  DropdownMenuPrimitive.ContentProps,
  'side' | 'insets' | 'disablePositioningStyle' | 'children'
> & {
  children?: ReactNode;
  /**
   * The side of the trigger the menu opens on. On a device it opens above or below the trigger, so `left`
   * and `right` open it below.
   */
  side?: PopupSide;
  /** The `name` of the PortalHost to draw in, when it is not the app's own. */
  portalHost?: string;
};

/**
 * The menu itself, drawn 4px below its trigger and lined up with its start by default, announced as a
 * `menu`; accessibility focus moves into it as it opens. A press outside it, the Android back button, the
 * iOS escape gesture and Escape on the web close it. It fades in while growing from 95% and sliding 0.5rem
 * away from the trigger over 100ms, and out the same way, or appears and goes at once when the system asks
 * for reduced motion.
 */
function DropdownMenuContent({
  className,
  children,
  align = 'start',
  alignOffset = 0,
  side = 'bottom',
  sideOffset = 4,
  portalHost,
  ...props
}: DropdownMenuContentProps): ReactNode {
  const { open, onOpenChange } = DropdownMenuPrimitive.useRootContext();
  // The primitive places the menu above or below its trigger on a device; the web's places it on any side.
  const placed = Platform.OS === 'web' || side === 'top' ? side : 'bottom';
  const { present, style } = usePopupMotion(open, placed);
  const scrollHeight = useMenuScrollHeight();
  const hostCheck = usePortalHostCheck(present, 'DropdownMenu', portalHost);
  // Upstream's menu is modal: the screen behind it is out of a screen reader's reach while it is open.
  const modalLayer = useModalOverlay(present);

  if (!present) return null;

  const menu = (
    <DropdownMenuPrimitive.Content
      forceMount
      align={align}
      alignOffset={alignOffset}
      // The web's primitive takes every side, though its type names only the two a device's takes.
      side={side as DropdownMenuPrimitive.ContentProps['side']}
      sideOffset={sideOffset}
      {...props}
    >
      <TextClassContext.Provider value="cn-dropdown-menu-content/text">
        {/* Not every engine styles an Animated.View by its className, so the box is a View inside it. */}
        <Animated.View style={style}>
          <View className={cn('cn-dropdown-menu-content', className)}>
            {Platform.OS === 'web' ? (
              children
            ) : (
              // On the web Radix scrolls a list too tall for the window; a device scrolls it here.
              <ScrollView style={{ maxHeight: scrollHeight }} bounces={false} keyboardShouldPersistTaps="handled">
                {children}
              </ScrollView>
            )}
          </View>
        </Animated.View>
      </TextClassContext.Provider>
    </DropdownMenuPrimitive.Content>
  );

  return (
    <DropdownMenuPrimitive.Portal hostName={portalHost} forceMount>
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
          <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={() => onOpenChange(false)} />
          {menu}
        </View>
      )}
    </DropdownMenuPrimitive.Portal>
  );
}

type DropdownMenuGroupProps = ComponentProps<typeof DropdownMenuPrimitive.Group>;

/** Items that belong together, announced as a `group`; a DropdownMenuLabel inside names what they are. */
function DropdownMenuGroup(props: DropdownMenuGroupProps): ReactNode {
  return <DropdownMenuPrimitive.Group {...props} />;
}

type DropdownMenuLabelProps = ComponentProps<typeof Text> & {
  /** Indents the label to line up with the text of a checkbox or radio item. */
  inset?: boolean;
};

/** The muted heading over a group of items. */
function DropdownMenuLabel({ className, inset, ...props }: DropdownMenuLabelProps): ReactNode {
  return (
    <DropdownMenuPrimitive.Label asChild>
      <Text
        className={cn(
          'cn-dropdown-menu-label cn-dropdown-menu-label/text',
          inset && 'cn-dropdown-menu-label@inset',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Label>
  );
}

/** Whether the item around a DropdownMenuShortcut is highlighted, which the shortcut's colour follows. */
const DropdownMenuItemHighlightContext = createContext(false);

/** What pressing an item does to the menu: runs the item, then closes the menu unless told not to. */
function usePressClosing(closeOnClick: boolean, onPress: ((event: GestureResponderEvent) => void) | undefined) {
  const { onOpenChange } = DropdownMenuPrimitive.useRootContext();
  return pressClosing(closeOnClick, onPress, () => onOpenChange(false));
}

type DropdownMenuItemProps = Omit<DropdownMenuPrimitive.ItemProps, 'closeOnPress'> & {
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
function DropdownMenuItem({
  className,
  inset,
  variant = 'default',
  closeOnClick = true,
  onPress,
  ...props
}: DropdownMenuItemProps): ReactNode {
  const { highlighted, handlers } = useHighlight(props);
  const menuText = useContext(TextClassContext);
  const destructive = variant === 'destructive';
  return (
    <DropdownMenuItemHighlightContext.Provider value={highlighted}>
      <TextClassContext.Provider
        value={cn(
          menuText,
          'cn-dropdown-menu-item/text',
          destructive && 'cn-dropdown-menu-item/text@variant=destructive',
          highlighted && 'cn-dropdown-menu-item/text@highlighted',
          highlighted && destructive && 'cn-dropdown-menu-item/text@highlighted+variant=destructive',
        )}
      >
        <IconClassContext.Provider value="cn-dropdown-menu-item/icon">
          <DropdownMenuPrimitive.Item
            className={cn(
              'relative flex-row items-center cn-dropdown-menu-item',
              inset && 'cn-dropdown-menu-item@inset',
              props.disabled === true && 'opacity-50',
              highlighted && 'cn-dropdown-menu-item@highlighted',
              highlighted && destructive && 'cn-dropdown-menu-item@highlighted+variant=destructive',
              className,
            )}
            {...props}
            {...handlers}
            {...usePressClosing(closeOnClick, onPress)}
          />
        </IconClassContext.Provider>
      </TextClassContext.Provider>
    </DropdownMenuItemHighlightContext.Provider>
  );
}

type DropdownMenuCheckboxItemProps = Omit<
  DropdownMenuPrimitive.CheckboxItemProps,
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
function DropdownMenuCheckboxItem({
  className,
  children,
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  inset,
  closeOnClick = false,
  onPress,
  ...props
}: DropdownMenuCheckboxItemProps): ReactNode {
  const [ownChecked, setOwnChecked] = useState(defaultChecked);
  const checked = checkedProp ?? ownChecked;
  const { highlighted, handlers } = useHighlight(props);
  const menuText = useContext(TextClassContext);
  return (
    <DropdownMenuItemHighlightContext.Provider value={highlighted}>
      <TextClassContext.Provider
        value={cn(
          menuText,
          'cn-dropdown-menu-checkbox-item/text',
          highlighted && 'cn-dropdown-menu-checkbox-item/text@highlighted',
        )}
      >
        <IconClassContext.Provider value="cn-dropdown-menu-checkbox-item/icon">
          <DropdownMenuPrimitive.CheckboxItem
            className={cn(
              'relative flex-row items-center cn-dropdown-menu-checkbox-item',
              inset && 'cn-dropdown-menu-checkbox-item@inset',
              props.disabled === true && 'opacity-50',
              highlighted && 'cn-dropdown-menu-checkbox-item@highlighted',
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
            <View className="cn-dropdown-menu-item-indicator pointer-events-none">
              <DropdownMenuPrimitive.ItemIndicator>
                <Icon as={Check} />
              </DropdownMenuPrimitive.ItemIndicator>
            </View>
            {children}
          </DropdownMenuPrimitive.CheckboxItem>
        </IconClassContext.Provider>
      </TextClassContext.Provider>
    </DropdownMenuItemHighlightContext.Provider>
  );
}

type DropdownMenuRadioGroupProps = Omit<DropdownMenuPrimitive.RadioGroupProps, 'value' | 'onValueChange'> & {
  /** The chosen item's value, when the owner holds the state; follow `onValueChange` to change it. */
  value?: string;
  /** The value chosen at the start, when the group holds its own state. */
  defaultValue?: string;
  /** Called with an item's value when a press chooses it. */
  onValueChange?: (value: string) => void;
};

/** Radio items of which one is chosen, announced as a `radiogroup`. */
function DropdownMenuRadioGroup({
  value: valueProp,
  defaultValue,
  onValueChange,
  ...props
}: DropdownMenuRadioGroupProps): ReactNode {
  const [ownValue, setOwnValue] = useState(defaultValue);
  return (
    <DropdownMenuPrimitive.RadioGroup
      value={valueProp ?? ownValue}
      onValueChange={(next) => {
        setOwnValue(next);
        onValueChange?.(next);
      }}
      {...props}
    />
  );
}

type DropdownMenuRadioItemProps = Omit<DropdownMenuPrimitive.RadioItemProps, 'closeOnPress' | 'children'> & {
  children?: ReactNode;
  /** Indents the item; its text already lines up with an inset item's. */
  inset?: boolean;
  /** Whether pressing the item closes the menu. */
  closeOnClick?: boolean;
};

/**
 * One choice of a DropdownMenuRadioGroup, with a check mark at its end while chosen. A press chooses it and
 * leaves the menu open, unless `closeOnClick` is true. On a device it is announced as a radio button with its
 * checked state, and on the web as a `menuitemradio`.
 */
function DropdownMenuRadioItem({
  className,
  children,
  inset,
  closeOnClick = false,
  onPress,
  ...props
}: DropdownMenuRadioItemProps): ReactNode {
  const { highlighted, handlers } = useHighlight(props);
  const menuText = useContext(TextClassContext);
  return (
    <DropdownMenuItemHighlightContext.Provider value={highlighted}>
      <TextClassContext.Provider
        value={cn(
          menuText,
          'cn-dropdown-menu-radio-item/text',
          highlighted && 'cn-dropdown-menu-radio-item/text@highlighted',
        )}
      >
        <IconClassContext.Provider value="cn-dropdown-menu-radio-item/icon">
          <DropdownMenuPrimitive.RadioItem
            className={cn(
              'relative flex-row items-center cn-dropdown-menu-radio-item',
              inset && 'cn-dropdown-menu-radio-item@inset',
              props.disabled === true && 'opacity-50',
              highlighted && 'cn-dropdown-menu-radio-item@highlighted',
              className,
            )}
            {...webItemRole('menuitemradio')}
            {...props}
            {...handlers}
            {...usePressClosing(closeOnClick, onPress)}
          >
            <View className="cn-dropdown-menu-item-indicator pointer-events-none">
              <DropdownMenuPrimitive.ItemIndicator>
                <Icon as={Check} />
              </DropdownMenuPrimitive.ItemIndicator>
            </View>
            {children}
          </DropdownMenuPrimitive.RadioItem>
        </IconClassContext.Provider>
      </TextClassContext.Provider>
    </DropdownMenuItemHighlightContext.Provider>
  );
}

type DropdownMenuSeparatorProps = ComponentProps<typeof DropdownMenuPrimitive.Separator>;

/** A hairline between groups of items. */
function DropdownMenuSeparator({ className, ...props }: DropdownMenuSeparatorProps): ReactNode {
  return <DropdownMenuPrimitive.Separator className={cn('cn-dropdown-menu-separator', className)} {...props} />;
}

type DropdownMenuShortcutProps = ComponentProps<typeof Text>;

/** The keys that run an item, drawn muted at the item's end. */
function DropdownMenuShortcut({ className, ...props }: DropdownMenuShortcutProps): ReactNode {
  const highlighted = useContext(DropdownMenuItemHighlightContext);
  return (
    <Text
      className={cn(
        'cn-dropdown-menu-shortcut cn-dropdown-menu-shortcut/text',
        highlighted && 'cn-dropdown-menu-shortcut/text@highlighted',
        className,
      )}
      {...props}
    />
  );
}

type DropdownMenuSubProps = ComponentProps<typeof DropdownMenuPrimitive.Sub>;

/**
 * A menu inside the menu, opened from its DropdownMenuSubTrigger. It holds its own open state from
 * `defaultOpen`, or follows `open` and reports changes through `onOpenChange`.
 */
function DropdownMenuSub(props: DropdownMenuSubProps): ReactNode {
  return <DropdownMenuPrimitive.Sub {...props} />;
}

type DropdownMenuSubTriggerProps = Omit<ComponentProps<typeof DropdownMenuPrimitive.SubTrigger>, 'children'> & {
  children?: ReactNode;
  /** Indents the item to line up with the text of a checkbox or radio item. */
  inset?: boolean;
};

/** Mirrors an arrow drawn for text read left to right, so it points the same way in text read right to left. */
const MIRRORED = { transform: [{ scaleX: -1 }] };

/**
 * The item that opens a sub-menu, with a chevron at its end, mirrored when text reads right to left, announced
 * as a `menuitem` that is expanded or collapsed. A press opens the sub-menu, and on a device another closes it.
 */
function DropdownMenuSubTrigger({ className, inset, children, ...props }: DropdownMenuSubTriggerProps): ReactNode {
  const rtl = useDirection() === 'rtl';
  const { open } = DropdownMenuPrimitive.useSubContext();
  const { highlighted, handlers } = useHighlight(props);
  const menuText = useContext(TextClassContext);
  return (
    <TextClassContext.Provider
      value={cn(
        menuText,
        'cn-dropdown-menu-sub-trigger/text',
        open && 'cn-dropdown-menu-sub-trigger/text@open',
        highlighted && 'cn-dropdown-menu-sub-trigger/text@highlighted',
      )}
    >
      <IconClassContext.Provider value="cn-dropdown-menu-sub-trigger/icon">
        <DropdownMenuPrimitive.SubTrigger
          className={cn(
            'flex-row items-center cn-dropdown-menu-sub-trigger',
            inset && 'cn-dropdown-menu-sub-trigger@inset',
            open && 'cn-dropdown-menu-sub-trigger@open',
            highlighted && 'cn-dropdown-menu-sub-trigger@highlighted',
            className,
          )}
          {...props}
          {...handlers}
        >
          {children}
          {/* Not every engine lays out an svg by its className, so the chevron is pushed to the end by a View. */}
          <View className="ml-auto">
            <Icon as={ChevronRight} style={rtl ? MIRRORED : undefined} />
          </View>
        </DropdownMenuPrimitive.SubTrigger>
      </IconClassContext.Provider>
    </TextClassContext.Provider>
  );
}

type DropdownMenuSubContentProps = ComponentProps<typeof DropdownMenuPrimitive.SubContent>;

/**
 * The items of a sub-menu. On a device they open in place under their DropdownMenuSubTrigger; on the web
 * beside it.
 */
function DropdownMenuSubContent({ className, ...props }: DropdownMenuSubContentProps): ReactNode {
  return (
    <TextClassContext.Provider value="cn-dropdown-menu-sub-content/text">
      <DropdownMenuPrimitive.SubContent className={cn('cn-dropdown-menu-sub-content', className)} {...props} />
    </TextClassContext.Provider>
  );
}

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
};
export type {
  DropdownMenuCheckboxItemProps,
  DropdownMenuContentProps,
  DropdownMenuGroupProps,
  DropdownMenuItemProps,
  DropdownMenuLabelProps,
  DropdownMenuProps,
  DropdownMenuRadioGroupProps,
  DropdownMenuRadioItemProps,
  DropdownMenuSeparatorProps,
  DropdownMenuShortcutProps,
  DropdownMenuSubContentProps,
  DropdownMenuSubProps,
  DropdownMenuSubTriggerProps,
  DropdownMenuTriggerProps,
};
