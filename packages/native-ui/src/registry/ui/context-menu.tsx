import * as ContextMenuPrimitive from '@rn-primitives/context-menu';
import { Check, ChevronRight } from 'lucide-react-native';
import { createContext, useContext, useState, type ComponentProps, type ReactNode } from 'react';
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

type ContextMenuProps = ContextMenuPrimitive.RootProps;

/**
 * A menu of actions on an area of the screen, which a long press opens on a device and a right click or a long
 * press on the web. It holds its own open state, and reports each open and close through `onOpenChange`.
 * Holds a ContextMenuTrigger and a ContextMenuContent.
 */
function ContextMenu(props: ContextMenuProps): ReactNode {
  return <ContextMenuPrimitive.Root {...props} />;
}

/**
 * Kept so upstream's markup ports as it is: ContextMenuContent already draws itself in the app's PortalHost,
 * so this draws its children where it stands.
 */
function ContextMenuPortal({ children }: { children?: ReactNode }): ReactNode {
  return children;
}

type ContextMenuTriggerProps = ComponentProps<typeof ContextMenuPrimitive.Trigger>;

/**
 * The area the menu belongs to. A long press opens the menu below the finger on a device, and a right click
 * or a long press at the pointer on the web. Screen readers reach it as a button whose long-press action opens
 * the menu, announced as expanded or collapsed.
 */
function ContextMenuTrigger(props: ContextMenuTriggerProps): ReactNode {
  return <ContextMenuPrimitive.Trigger {...props} />;
}

type ContextMenuContentProps = Omit<
  ContextMenuPrimitive.ContentProps,
  'side' | 'insets' | 'disablePositioningStyle' | 'children'
> & {
  children?: ReactNode;
  /**
   * The side of the long press the menu opens on, on a device: above it for `top`, and below it otherwise.
   * The web opens the menu at the pointer.
   */
  side?: MenuSide;
  /** The `name` of the PortalHost to draw in, when it is not the app's own. */
  portalHost?: string;
};

/**
 * The menu itself, drawn where the long press or the right click landed, announced as a `menu`;
 * accessibility focus moves into it as it opens. A press outside it, the Android back button, the iOS escape
 * gesture and Escape on the web close it. It fades in while growing from 95% and sliding 0.5rem away from
 * where it opened over 100ms, and out the same way, or appears and goes at once when the system asks for
 * reduced motion.
 */
function ContextMenuContent({
  className,
  children,
  align = 'start',
  alignOffset = 4,
  side = 'right',
  sideOffset = 0,
  portalHost,
  ...props
}: ContextMenuContentProps): ReactNode {
  const { open, onOpenChange } = ContextMenuPrimitive.useRootContext();
  // A device places the menu above or below the long press; the web's primitive opens it to the right of the
  // pointer, whatever `side` says.
  const placed = Platform.OS === 'web' ? 'right' : side === 'top' ? 'top' : 'bottom';
  const { present, style } = useMenuMotion(open, placed);
  const hostCheck = usePortalHostCheck(present, 'ContextMenu', portalHost);
  // Upstream's menu is modal: the screen behind it is out of a screen reader's reach while it is open.
  const modalLayer = useModalOverlay(present);

  if (!present) return null;

  const menu = (
    <ContextMenuPrimitive.Content
      forceMount
      align={align}
      alignOffset={alignOffset}
      // A device's primitive takes the two sides it places on; the web's places the menu at the pointer.
      side={placed as ContextMenuPrimitive.ContentProps['side']}
      sideOffset={sideOffset}
      {...props}
    >
      <TextClassContext.Provider value="cn-context-menu-content/text">
        {/* Not every engine styles an Animated.View by its className, so the box is a View inside it. */}
        <Animated.View style={style}>
          <View className={cn('cn-context-menu-content', className)}>{children}</View>
        </Animated.View>
      </TextClassContext.Provider>
    </ContextMenuPrimitive.Content>
  );

  return (
    <ContextMenuPrimitive.Portal hostName={portalHost} forceMount>
      {/* The web's portal slots its one child into the page, where Radix places the menu and closes it on a
          press outside; a device draws the menu in a full-screen layer of its own. */}
      {Platform.OS === 'web' ? (
        menu
      ) : (
        // Closing, it lets presses through to the screen while it fades.
        <View style={[StyleSheet.absoluteFill, { pointerEvents: open ? 'box-none' : 'none' }]} {...modalLayer}>
          {hostCheck}
          {/* A press outside the menu lands here. It closes through the open state alone: the primitive's own
              close forgets where the press was, which removes the menu before it can go out. */}
          <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={() => onOpenChange(false)} />
          {menu}
        </View>
      )}
    </ContextMenuPrimitive.Portal>
  );
}

type ContextMenuGroupProps = ComponentProps<typeof ContextMenuPrimitive.Group>;

/** Items that belong together, announced as a `group`; a ContextMenuLabel inside names what they are. */
function ContextMenuGroup(props: ContextMenuGroupProps): ReactNode {
  return <ContextMenuPrimitive.Group {...props} />;
}

type ContextMenuLabelProps = ComponentProps<typeof Text> & {
  /** Indents the label to line up with the text of a checkbox or radio item. */
  inset?: boolean;
};

/** The muted heading over a group of items. */
function ContextMenuLabel({ className, inset, ...props }: ContextMenuLabelProps): ReactNode {
  return (
    <ContextMenuPrimitive.Label asChild>
      <Text
        className={cn(
          'cn-context-menu-label cn-context-menu-label/text',
          inset && 'cn-context-menu-label@inset',
          className,
        )}
        {...props}
      />
    </ContextMenuPrimitive.Label>
  );
}

/** Whether the item around a ContextMenuShortcut is highlighted, which the shortcut's colour follows. */
const ContextMenuItemHighlightContext = createContext(false);

/** What pressing an item does to the menu: runs the item, then closes the menu unless told not to. */
function usePressClosing(closeOnClick: boolean, onPress: ((event: GestureResponderEvent) => void) | undefined) {
  const { onOpenChange } = ContextMenuPrimitive.useRootContext();
  return {
    // On a device the menu closes through the open state alone, so it can go out; the web's primitive
    // closes it itself.
    closeOnPress: Platform.OS === 'web' ? closeOnClick : false,
    onPress: (event: GestureResponderEvent) => {
      onPress?.(event);
      if (closeOnClick && Platform.OS !== 'web') onOpenChange(false);
    },
  };
}

type ContextMenuItemProps = Omit<ContextMenuPrimitive.ItemProps, 'closeOnPress'> & {
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
function ContextMenuItem({
  className,
  inset,
  variant = 'default',
  closeOnClick = true,
  onPress,
  ...props
}: ContextMenuItemProps): ReactNode {
  const { highlighted, handlers } = useHighlight(props);
  const menuText = useContext(TextClassContext);
  const destructive = variant === 'destructive';
  return (
    <ContextMenuItemHighlightContext.Provider value={highlighted}>
      <TextClassContext.Provider
        value={cn(
          menuText,
          'cn-context-menu-item/text',
          destructive && 'cn-context-menu-item/text@variant=destructive',
          highlighted && 'cn-context-menu-item/text@highlighted',
          highlighted && destructive && 'cn-context-menu-item/text@highlighted+variant=destructive',
        )}
      >
        <IconClassContext.Provider value="cn-context-menu-item/icon">
          <ContextMenuPrimitive.Item
            className={cn(
              'relative flex-row items-center cn-context-menu-item',
              inset && 'cn-context-menu-item@inset',
              props.disabled === true && 'opacity-50',
              highlighted && 'cn-context-menu-item@highlighted',
              highlighted && destructive && 'cn-context-menu-item@highlighted+variant=destructive',
              className,
            )}
            {...webItemRole('menuitem')}
            {...props}
            {...handlers}
            {...usePressClosing(closeOnClick, onPress)}
          />
        </IconClassContext.Provider>
      </TextClassContext.Provider>
    </ContextMenuItemHighlightContext.Provider>
  );
}

/**
 * The role an item takes on the web, where the primitive draws each item as a `button` inside Radix's. A device
 * has no checkbox or radio menu item role, so there the primitive's `checkbox` or `radio` stands, which
 * announces the checked state.
 */
function webItemRole(role: 'menuitem' | 'menuitemcheckbox' | 'menuitemradio'): {
  role?: Role;
} {
  return Platform.OS === 'web' ? { role: role as Role } : {};
}

type ContextMenuCheckboxItemProps = Omit<
  ContextMenuPrimitive.CheckboxItemProps,
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
function ContextMenuCheckboxItem({
  className,
  children,
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  inset,
  closeOnClick = false,
  onPress,
  ...props
}: ContextMenuCheckboxItemProps): ReactNode {
  const [ownChecked, setOwnChecked] = useState(defaultChecked);
  const checked = checkedProp ?? ownChecked;
  const { highlighted, handlers } = useHighlight(props);
  const menuText = useContext(TextClassContext);
  return (
    <ContextMenuItemHighlightContext.Provider value={highlighted}>
      <TextClassContext.Provider
        value={cn(
          menuText,
          'cn-context-menu-checkbox-item/text',
          highlighted && 'cn-context-menu-checkbox-item/text@highlighted',
        )}
      >
        <IconClassContext.Provider value="cn-context-menu-checkbox-item/icon">
          <ContextMenuPrimitive.CheckboxItem
            className={cn(
              'relative flex-row items-center cn-context-menu-checkbox-item',
              inset && 'cn-context-menu-checkbox-item@inset',
              props.disabled === true && 'opacity-50',
              highlighted && 'cn-context-menu-checkbox-item@highlighted',
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
            <View className="cn-context-menu-item-indicator pointer-events-none">
              <ContextMenuPrimitive.ItemIndicator>
                <Icon as={Check} />
              </ContextMenuPrimitive.ItemIndicator>
            </View>
            {children}
          </ContextMenuPrimitive.CheckboxItem>
        </IconClassContext.Provider>
      </TextClassContext.Provider>
    </ContextMenuItemHighlightContext.Provider>
  );
}

type ContextMenuRadioGroupProps = Omit<ContextMenuPrimitive.RadioGroupProps, 'value' | 'onValueChange'> & {
  /** The chosen item's value, when the owner holds the state; follow `onValueChange` to change it. */
  value?: string;
  /** The value chosen at the start, when the group holds its own state. */
  defaultValue?: string;
  /** Called with an item's value when a press chooses it. */
  onValueChange?: (value: string) => void;
};

/** Radio items of which one is chosen, announced as a `radiogroup`. */
function ContextMenuRadioGroup({
  value: valueProp,
  defaultValue,
  onValueChange,
  ...props
}: ContextMenuRadioGroupProps): ReactNode {
  const [ownValue, setOwnValue] = useState(defaultValue);
  return (
    <ContextMenuPrimitive.RadioGroup
      value={valueProp ?? ownValue}
      onValueChange={(next) => {
        setOwnValue(next);
        onValueChange?.(next);
      }}
      {...props}
    />
  );
}

type ContextMenuRadioItemProps = Omit<ContextMenuPrimitive.RadioItemProps, 'closeOnPress' | 'children'> & {
  children?: ReactNode;
  /** Indents the item; its text already lines up with an inset item's. */
  inset?: boolean;
  /** Whether pressing the item closes the menu. */
  closeOnClick?: boolean;
};

/**
 * One choice of a ContextMenuRadioGroup, with a check mark at its end while chosen. A press chooses it and
 * leaves the menu open, unless `closeOnClick` is true. On a device it is announced as a radio button with its
 * checked state, and on the web as a `menuitemradio`.
 */
function ContextMenuRadioItem({
  className,
  children,
  inset,
  closeOnClick = false,
  onPress,
  ...props
}: ContextMenuRadioItemProps): ReactNode {
  const { highlighted, handlers } = useHighlight(props);
  const menuText = useContext(TextClassContext);
  return (
    <ContextMenuItemHighlightContext.Provider value={highlighted}>
      <TextClassContext.Provider
        value={cn(
          menuText,
          'cn-context-menu-radio-item/text',
          highlighted && 'cn-context-menu-radio-item/text@highlighted',
        )}
      >
        <IconClassContext.Provider value="cn-context-menu-radio-item/icon">
          <ContextMenuPrimitive.RadioItem
            className={cn(
              'relative flex-row items-center cn-context-menu-radio-item',
              inset && 'cn-context-menu-radio-item@inset',
              props.disabled === true && 'opacity-50',
              highlighted && 'cn-context-menu-radio-item@highlighted',
              className,
            )}
            {...webItemRole('menuitemradio')}
            {...props}
            {...handlers}
            {...usePressClosing(closeOnClick, onPress)}
          >
            <View className="cn-context-menu-item-indicator pointer-events-none">
              <ContextMenuPrimitive.ItemIndicator>
                <Icon as={Check} />
              </ContextMenuPrimitive.ItemIndicator>
            </View>
            {children}
          </ContextMenuPrimitive.RadioItem>
        </IconClassContext.Provider>
      </TextClassContext.Provider>
    </ContextMenuItemHighlightContext.Provider>
  );
}

type ContextMenuSeparatorProps = ComponentProps<typeof ContextMenuPrimitive.Separator>;

/** A hairline between groups of items. */
function ContextMenuSeparator({ className, ...props }: ContextMenuSeparatorProps): ReactNode {
  return <ContextMenuPrimitive.Separator className={cn('cn-context-menu-separator', className)} {...props} />;
}

type ContextMenuShortcutProps = ComponentProps<typeof Text>;

/** The keys that run an item, drawn muted at the item's end. */
function ContextMenuShortcut({ className, ...props }: ContextMenuShortcutProps): ReactNode {
  const highlighted = useContext(ContextMenuItemHighlightContext);
  return (
    <Text
      className={cn(
        'cn-context-menu-shortcut cn-context-menu-shortcut/text',
        highlighted && 'cn-context-menu-shortcut/text@highlighted',
        className,
      )}
      {...props}
    />
  );
}

type ContextMenuSubProps = ComponentProps<typeof ContextMenuPrimitive.Sub>;

/**
 * A menu inside the menu, opened from its ContextMenuSubTrigger. It holds its own open state from
 * `defaultOpen`, or follows `open` and reports changes through `onOpenChange`.
 */
function ContextMenuSub(props: ContextMenuSubProps): ReactNode {
  return <ContextMenuPrimitive.Sub {...props} />;
}

type ContextMenuSubTriggerProps = Omit<ComponentProps<typeof ContextMenuPrimitive.SubTrigger>, 'children'> & {
  children?: ReactNode;
  /** Indents the item to line up with the text of a checkbox or radio item. */
  inset?: boolean;
};

/**
 * The item that opens a sub-menu, with a chevron at its end, announced as a `menuitem` that is expanded or
 * collapsed. A press opens the sub-menu, and on a device another closes it.
 */
function ContextMenuSubTrigger({ className, inset, children, ...props }: ContextMenuSubTriggerProps): ReactNode {
  const { open } = ContextMenuPrimitive.useSubContext();
  const { highlighted, handlers } = useHighlight(props);
  const menuText = useContext(TextClassContext);
  return (
    <TextClassContext.Provider
      value={cn(
        menuText,
        'cn-context-menu-sub-trigger/text',
        open && 'cn-context-menu-sub-trigger/text@open',
        highlighted && 'cn-context-menu-sub-trigger/text@highlighted',
      )}
    >
      <IconClassContext.Provider value="cn-context-menu-sub-trigger/icon">
        <ContextMenuPrimitive.SubTrigger
          className={cn(
            'flex-row items-center cn-context-menu-sub-trigger',
            inset && 'cn-context-menu-sub-trigger@inset',
            open && 'cn-context-menu-sub-trigger@open',
            highlighted && 'cn-context-menu-sub-trigger@highlighted',
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
        </ContextMenuPrimitive.SubTrigger>
      </IconClassContext.Provider>
    </TextClassContext.Provider>
  );
}

type ContextMenuSubContentProps = ComponentProps<typeof ContextMenuPrimitive.SubContent>;

/**
 * The items of a sub-menu. On a device they open in place under their ContextMenuSubTrigger; on the web
 * beside it.
 */
function ContextMenuSubContent({ className, ...props }: ContextMenuSubContentProps): ReactNode {
  return (
    <TextClassContext.Provider value="cn-context-menu-sub-content/text">
      <ContextMenuPrimitive.SubContent className={cn('cn-context-menu-sub-content', className)} {...props} />
    </TextClassContext.Provider>
  );
}

export {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuPortal,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
};
export type {
  ContextMenuCheckboxItemProps,
  ContextMenuContentProps,
  ContextMenuGroupProps,
  ContextMenuItemProps,
  ContextMenuLabelProps,
  ContextMenuProps,
  ContextMenuRadioGroupProps,
  ContextMenuRadioItemProps,
  ContextMenuSeparatorProps,
  ContextMenuShortcutProps,
  ContextMenuSubContentProps,
  ContextMenuSubProps,
  ContextMenuSubTriggerProps,
  ContextMenuTriggerProps,
};
